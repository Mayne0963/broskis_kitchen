import { useEffect, useRef, RefObject, useState } from 'react';
import { analytics } from '@/lib/analytics';

/**
 * Hook to handle autoplay unlock for iOS/Safari and other browsers that block autoplay
 * This hook listens for user interactions and attempts to unlock audio playback
 * Enhanced with localStorage persistence and user-friendly tips
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
        if (wasUnlocked) {
          isUnlockedRef.current = true;
          console.log('🔓 Audio autoplay previously unlocked');
          return true;
        }
      } catch (error) {
        console.warn('Failed to check localStorage for audio unlock status');
      }
      return false;
    };

    // Function to attempt audio unlock
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
          
          // Remove event listeners after successful unlock
          removeEventListeners();
        }
      } catch (error) {
        console.log('🔒 Audio autoplay still blocked, waiting for user interaction');
        setShowUnlockTip(true); // Show friendly tip
        // Don't log as error since this is expected behavior
      }
    };

    // Event handler for user interactions
    const handleUserInteraction = async (event: Event) => {
      if (isUnlockedRef.current) return;

      console.log(`🎵 User interaction detected: ${event.type}`);
      await attemptUnlock();
    };

    // List of events that can unlock autoplay
    const events = ['touchstart', 'touchend', 'click', 'keydown', 'mousedown'];

    // Add event listeners
    const addEventListeners = () => {
      events.forEach(eventType => {
        document.addEventListener(eventType, handleUserInteraction, { 
          once: false, // Allow multiple attempts
          passive: true 
        });
      });
    };

    // Remove event listeners
    const removeEventListeners = () => {
      events.forEach(eventType => {
        document.removeEventListener(eventType, handleUserInteraction);
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
        
        // If unlock failed, add event listeners for user interaction
        if (!isUnlockedRef.current) {
          addEventListeners();
          console.log('🎵 Waiting for user interaction to unlock audio playback...');
        }
      }, 100);
    };

    // Start the unlock process
    initialUnlockAttempt();

    // Cleanup function
    return () => {
      removeEventListeners();
    };
  }, [audioRef]);

  // Return whether autoplay has been unlocked
  return {
    isUnlocked: isUnlockedRef.current,
    showUnlockTip,
    hideUnlockTip: () => setShowUnlockTip(false),
    attemptUnlock: async () => {
      if (!audioRef.current || isUnlockedRef.current) return;
      
      try {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          await playPromise;
          isUnlockedRef.current = true;
          
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
 * Utility function to check if the current browser/device likely requires user interaction for autoplay
 */
export const requiresUserInteraction = (): boolean => {
  const userAgent = navigator.userAgent.toLowerCase();
  
  // iOS Safari, Mobile Safari, and other mobile browsers typically require user interaction
  const isMobile = /iphone|ipad|ipod|android|mobile/i.test(userAgent);
  const isSafari = /safari/i.test(userAgent) && !/chrome/i.test(userAgent);
  
  return isMobile || isSafari;
};

/**
 * Hook to detect if autoplay is supported without user interaction
 */
export const useAutoplaySupport = () => {
  const supportRef = useRef<boolean | null>(null);

  useEffect(() => {
    const detectAutoplaySupport = async () => {
      try {
        const audio = new Audio();
        audio.muted = true; // Muted autoplay is more likely to be allowed
        
        const playPromise = audio.play();
        if (playPromise !== undefined) {
          await playPromise;
          audio.pause();
          supportRef.current = true;
          console.log('✅ Autoplay is supported');
        }
      } catch (error) {
        supportRef.current = false;
        console.log('❌ Autoplay is not supported');
      }
    };

    if (supportRef.current === null) {
      detectAutoplaySupport();
    }
  }, []);

  return supportRef.current;
};