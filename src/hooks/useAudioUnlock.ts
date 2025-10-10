import { useState, useEffect, useCallback, useRef } from 'react';

const STORAGE_KEY = 'broski_audio_unlocked';

// Singleton AudioContext to avoid multiple instances
let audioContext: AudioContext | null = null;

const getAudioContext = (): AudioContext => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  return audioContext;
};

const isIOSSafari = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = window.navigator.userAgent;
  const vendor = window.navigator.vendor;
  
  // Detect iOS devices
  const isIOS = /iPhone|iPad|iPod/.test(userAgent);
  // Detect Safari (includes mobile Safari)
  const isSafari = vendor && vendor.includes('Apple');
  
  return isIOS && isSafari;
};

export const useAudioUnlock = () => {
  const [unlocked, setUnlocked] = useState<boolean>(false);
  const [isIOS, setIsIOS] = useState<boolean>(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Check if already unlocked on mount
  useEffect(() => {
    const isIOSDevice = isIOSSafari();
    setIsIOS(isIOSDevice);
    
    if (isIOSDevice) {
      const stored = localStorage.getItem(STORAGE_KEY);
      setUnlocked(stored === 'true');
    } else {
      // Non-iOS devices don't need unlock
      setUnlocked(true);
    }
  }, []);

  const unlock = useCallback(async (audioElement?: HTMLAudioElement) => {
    try {
      // Get or create AudioContext and resume it
      const ctx = getAudioContext();
      if (ctx.state === 'suspended') {
        await ctx.resume();
      }

      // If audio element is provided, try to play it
      const audio = audioElement || audioRef.current;
      if (audio) {
        try {
          await audio.play();
          // Immediately pause to avoid unwanted playback
          audio.pause();
          audio.currentTime = 0;
        } catch (playError) {
          console.warn('Audio play test failed:', playError);
        }
      }

      // Set unlocked state
      setUnlocked(true);
      localStorage.setItem(STORAGE_KEY, 'true');
      
      return true;
    } catch (error) {
      console.error('Audio unlock failed:', error);
      return false;
    }
  }, []);

  const setAudioRef = useCallback((audio: HTMLAudioElement | null) => {
    audioRef.current = audio;
  }, []);

  return {
    unlocked,
    isIOS,
    needsUnlock: isIOS && !unlocked,
    unlock,
    setAudioRef,
  };
};