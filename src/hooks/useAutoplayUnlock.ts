import { useEffect, useRef, RefObject, useState } from 'react';
import { analytics } from '@/lib/analytics';

// Global unlock state to persist across component re-renders
let globalUnlockState = false;
let globalEventListenersAdded = false;

/**
 * Hook to handle autoplay unlock for iOS/Safari and other browsers that block autoplay
 * This hook listens for user interactions and attempts to unlock audio playback
 * Enhanced with localStorage persistence, global listeners, and improved iOS support
 */
export const useAutoplayUnlock = (audioRef: RefObject<HTMLAudioElement>) => {
  const isUnlockedRef = useRef(false);
  const hasAttemptedRef = useRef(false);
  const [showUnlockTip, setShowUnlockTip] = useState(false);

  useEffect(() => {
    if (!audioRef.current) return;

    const audio = audioRef.current;

    // Check if audio was previously unlocked
    const checkPreviousUnlock = () => {
      try {
        const wasUnlocked = localStorage.getItem('broski_audio_unlocked') === '1';
        if (wasUnlocked || globalUnlockState) {
          isUnlockedRef.current = true;
          globalUnlockState = true;
          console.log('🔓 Audio autoplay previously unlocked');
          return true;
        }
      } catch (error) {
        console.warn('Failed to check localStorage for audio unlock status');
      }
      return false;
    };

    // Enhanced function to attempt audio unlock
    const attemptUnlock = async () => {
      if (isUnlockedRef.current || !audio) return;

      try {
        // Create a silent audio context to test autoplay capability
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }

        // Try to play and immediately pause to unlock
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
          await playPromise;
          audio.pause();
          audio.currentTime = 0;
          isUnlockedRef.current = true;
          globalUnlockState = true;
          
          // Store unlock status in localStorage
          try {
            localStorage.setItem('broski_audio_unlocked', '1');
          } catch (error) {
            console.warn('Failed to store audio unlock status');
          }
          
          console.log('🔓 Audio autoplay unlocked successfully');
          setShowUnlockTip(false); // Hide tip on successful unlock
          
          // Track analytics
          analytics.unlockTap();
          
          // Remove global event listeners after successful unlock
          removeGlobalEventListeners();
        }
      } catch (error) {
        console.log('🔒 Audio autoplay still blocked, waiting for user interaction');
        setShowUnlockTip(true); // Show friendly tip
        // Don't log as error since this is expected behavior
      }
    };

    // Global event handler for user interactions (persists across navigation)
    const handleGlobalUserInteraction = async (event: Event) => {
      if (globalUnlockState) return;

      console.log(`🎵 Global user interaction detected: ${event.type}`);
      
      // Try to unlock with any available audio element
      const audioElements = document.querySelectorAll('audio');
      for (const audioEl of audioElements) {
        try {
          const playPromise = audioEl.play();
          if (playPromise !== undefined) {
            await playPromise;
            audioEl.pause();
            audioEl.currentTime = 0;
            globalUnlockState = true;
            isUnlockedRef.current = true;
            
            // Store unlock status
            try {
              localStorage.setItem('broski_audio_unlocked', '1');
            } catch (error) {
              console.warn('Failed to store audio unlock status');
            }
            
            console.log('🔓 Global audio autoplay unlocked');
            setShowUnlockTip(false);
            analytics.unlockTap();
            removeGlobalEventListeners();
            break;
          }
        } catch (error) {
          // Continue trying with other audio elements
        }
      }
    };

    // Enhanced list of events that can unlock autoplay (especially for iOS)
    const events = [
      'touchstart', 'touchend', 'touchmove',
      'click', 'mousedown', 'mouseup',
      'keydown', 'keyup',
      'pointerdown', 'pointerup'
    ];

    // Add global event listeners (only once)
    const addGlobalEventListeners = () => {
      if (globalEventListenersAdded) return;
      
      events.forEach(eventType => {
        document.addEventListener(eventType, handleGlobalUserInteraction, { 
          once: false,
          passive: true,
          capture: true // Capture phase for better iOS compatibility
        });
      });
      
      globalEventListenersAdded = true;
      console.log('🎵 Global autoplay unlock listeners added');
    };

    // Remove global event listeners
    const removeGlobalEventListeners = () => {
      if (!globalEventListenersAdded) return;
      
      events.forEach(eventType => {
        document.removeEventListener(eventType, handleGlobalUserInteraction, { capture: true });
      });
      
      globalEventListenersAdded = false;
      console.log('🔓 Global autoplay unlock listeners removed');
    };

    // Local event handler for this specific audio element
    const handleLocalUserInteraction = async (event: Event) => {
      if (isUnlockedRef.current) return;

      console.log(`🎵 Local user interaction detected: ${event.type}`);
      await attemptUnlock();
    };

    // Add local event listeners for this audio element
    const addLocalEventListeners = () => {
      events.forEach(eventType => {
        document.addEventListener(eventType, handleLocalUserInteraction, { 
          once: false,
          passive: true 
        });
      });
    };

    // Remove local event listeners
    const removeLocalEventListeners = () => {
      events.forEach(eventType => {
        document.removeEventListener(eventType, handleLocalUserInteraction);
      });
    };

    // Initial attempt for browsers that allow autoplay
    const initialUnlockAttempt = async () => {
      if (hasAttemptedRef.current) return;
      hasAttemptedRef.current = true;

      // Check if previously unlocked
      if (checkPreviousUnlock()) {
        return; // Already unlocked, no need to attempt
      }

      // Wait a bit for the audio element to be ready
      setTimeout(async () => {
        await attemptUnlock();
        
        // If unlock failed, add both local and global event listeners
        if (!isUnlockedRef.current && !globalUnlockState) {
          addLocalEventListeners();
          addGlobalEventListeners();
          console.log('🎵 Waiting for user interaction to unlock audio playback...');
        }
      }, 100);
    };

    // Start the unlock process
    initialUnlockAttempt();

    // Cleanup function
    return () => {
      removeLocalEventListeners();
      // Don't remove global listeners here - they should persist
    };
  }, [audioRef]);

  // Return whether autoplay has been unlocked
  return {
    isUnlocked: isUnlockedRef.current || globalUnlockState,
    showUnlockTip,
    hideUnlockTip: () => setShowUnlockTip(false),
    attemptUnlock: async () => {
      if (!audioRef.current || isUnlockedRef.current || globalUnlockState) return;
      
      try {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          await playPromise;
          isUnlockedRef.current = true;
          globalUnlockState = true;
          
          // Store unlock status
          try {
            localStorage.setItem('broski_audio_unlocked', '1');
          } catch (error) {
            console.warn('Failed to store audio unlock status');
          }
          
          setShowUnlockTip(false);
          analytics.unlockTap();
          console.log('🔓 Manual audio unlock successful');
        }
      } catch (error) {
        console.log('🔒 Manual audio unlock failed');
        setShowUnlockTip(true);
      }
    }
  };
};

/**
 * Check if the current browser/device requires user interaction for autoplay
 */
export const requiresUserInteraction = (): boolean => {
  const userAgent = navigator.userAgent.toLowerCase();
  return (
    userAgent.includes('safari') ||
    userAgent.includes('iphone') ||
    userAgent.includes('ipad') ||
    userAgent.includes('mobile')
  );
};

/**
 * Hook to detect autoplay support
 */
export const useAutoplaySupport = () => {
  const [supportsAutoplay, setSupportsAutoplay] = useState<boolean | null>(null);

  useEffect(() => {
    const testAutoplay = async () => {
      try {
        const audio = new Audio();
        audio.muted = true;
        const playPromise = audio.play();
        
        if (playPromise !== undefined) {
          await playPromise;
          audio.pause();
          setSupportsAutoplay(true);
        }
      } catch (error) {
        setSupportsAutoplay(false);
      }
    };

    testAutoplay();
  }, []);

  return supportsAutoplay;
};