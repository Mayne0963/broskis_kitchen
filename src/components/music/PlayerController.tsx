import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useMusicStore, Track } from '@/store/useMusicStore';
import { useAutoplayUnlock } from '@/hooks/useAutoplayUnlock';
import { analytics } from '@/lib/analytics';
import { toast } from 'sonner';
import { SilentUnlockOverlay } from './SilentUnlockOverlay';

interface PlayerControllerProps {
  onAudioRef?: (audio: HTMLAudioElement | null) => void;
}

export const PlayerController: React.FC<PlayerControllerProps> = ({ onAudioRef }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const hasAttemptedAutoplayRef = useRef(false);
  const [showSilentOverlay, setShowSilentOverlay] = useState(false);
  
  const {
    tracks,
    currentId,
    isPlaying,
    position,
    volume,
    repeat,
    setPosition,
    setDuration,
    setLoading,
    setError,
    next,
    pause,
    play,
  } = useMusicStore();

  const currentTrack = tracks.find(t => t.id === currentId);
  
  // Use autoplay unlock hook
  const { isUnlocked, showUnlockTip, hideUnlockTip, attemptUnlock } = useAutoplayUnlock(audioRef);

  // Setup Media Session API
  const setupMediaSession = useCallback((track: Track) => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artist,
        album: track.genre || 'Broski\'s Music',
        // No artwork since we removed cover images
      });

      // Set action handlers
      navigator.mediaSession.setActionHandler('play', () => {
        play();
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        pause();
      });

      navigator.mediaSession.setActionHandler('nexttrack', () => {
        next();
      });

      navigator.mediaSession.setActionHandler('previoustrack', () => {
        const store = useMusicStore.getState();
        store.prev();
      });

      navigator.mediaSession.setActionHandler('seekto', (details) => {
        if (details.seekTime !== undefined && audioRef.current) {
          audioRef.current.currentTime = details.seekTime;
          setPosition(details.seekTime);
        }
      });

      // Set position state for lock screen
      navigator.mediaSession.setPositionState({
        duration: track.duration,
        playbackRate: 1,
        position: position,
      });
    }
  }, [play, pause, next, setPosition, position]);

  // Silent unlock handler for iOS autoplay
  const handleSilentUnlock = useCallback(async () => {
    if (audioRef.current) {
      try {
        await audioRef.current.play();
        audioRef.current.pause();
        localStorage.setItem('broski_audio_unlocked', '1');
        setShowSilentOverlay(false);
        try {
          analytics.unlockTap();
        } catch (e) {
          console.log('Analytics error:', e);
        }
        console.log('🔓 Silent unlock successful');
      } catch (error) {
        console.log('🔒 Silent unlock failed, will retry on next interaction');
      }
    }
  }, []);

  // Check if silent overlay should be shown
  useEffect(() => {
    const unlocked = localStorage.getItem('broski_audio_unlocked');
    if (!unlocked && !isUnlocked) {
      setShowSilentOverlay(true);
    }
  }, [isUnlocked]);

  // Audio event handlers
  const handleTimeUpdate = useCallback(() => {
    if (audioRef.current) {
      const currentTime = audioRef.current.currentTime;
      setPosition(currentTime);
      
      // Update Media Session position
      if ('mediaSession' in navigator && currentTrack) {
        navigator.mediaSession.setPositionState({
          duration: currentTrack.duration,
          playbackRate: 1,
          position: currentTime,
        });
      }
    }
  }, [setPosition, currentTrack]);

  const handleLoadedMetadata = useCallback(() => {
    if (audioRef.current && currentTrack) {
      const duration = audioRef.current.duration;
      setDuration(duration);
      setLoading(false);
      
      // Setup Media Session with loaded track
      setupMediaSession(currentTrack);
      
      // Restore position if needed
      if (position > 0 && position < duration) {
        audioRef.current.currentTime = position;
      }
    }
  }, [currentTrack, setDuration, setLoading, setupMediaSession, position]);

  const handleEnded = useCallback(() => {
    if (repeat === 'one') {
      // Replay current track
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play();
      }
    } else {
      // Move to next track
      next();
    }
  }, [repeat, next]);

  const handleError = useCallback((e: React.SyntheticEvent<HTMLAudioElement, Event>) => {
    const error = (e.target as HTMLAudioElement).error;
    const errorCode = error?.code?.toString() || 'unknown';
    const errorMessage = error ? `Audio error: ${error.message}` : 'Track unavailable';
    
    console.error('Audio playback error:', error);
    setError(errorMessage);
    setLoading(false);
    
    // Track analytics for error
    if (currentTrack) {
      try {
        analytics.trackError({
          id: currentTrack.id,
          src: currentTrack.src_mp3,
          title: currentTrack.title,
          artist: currentTrack.artist,
          code: errorCode,
          message: errorMessage
        });
      } catch (e) {
        console.log('Analytics error:', e);
      }
    }
    
    // Show user-friendly toast
    toast.error('Skipping unavailable track', {
      duration: 2000,
    });
    
    // Auto-skip to next track within 500ms as requested
    setTimeout(() => {
      next();
    }, 500);
  }, [setError, setLoading, next, currentTrack]);

  const handleLoadStart = useCallback(() => {
    setLoading(true);
    setError(null);
  }, [setLoading, setError]);

  const handleCanPlay = useCallback(() => {
    setLoading(false);
    
    // Attempt autoplay when audio is ready to play
    if (!hasAttemptedAutoplayRef.current && currentTrack && audioRef.current) {
      hasAttemptedAutoplayRef.current = true;
      
      setTimeout(async () => {
        if (audioRef.current && !isPlaying && currentTrack) {
          console.log('🎵 Attempting initial autoplay after canPlay...');
          
          try {
            const playPromise = audioRef.current.play();
            if (playPromise !== undefined) {
              await playPromise;
              play(); // Update store state
              console.log('✅ Autoplay successful');
            }
          } catch (error) {
            console.log('🔒 Initial autoplay blocked, waiting for user interaction');
            // Don't show error toast for initial autoplay failure
          }
        }
      }, 100);
    }
  }, [setLoading, currentTrack, isPlaying, play]);

  // Effect to handle play/pause state changes
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              // Track successful play
              if (currentTrack) {
                try {
                  analytics.trackPlay({
                    id: currentTrack.id,
                    src: currentTrack.src_mp3,
                    title: currentTrack.title,
                    artist: currentTrack.artist
                  });
                } catch (e) {
                  console.log('Analytics error:', e);
                }
              }
            })
            .catch((error) => {
              console.log('🔒 Autoplay blocked, waiting for user interaction:', error.message);
              // Try to unlock autoplay
              attemptUnlock();
              pause();
            });
        }
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, pause, attemptUnlock, currentTrack]);

  // Effect to handle volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Effect to handle track changes with validation
  useEffect(() => {
    if (audioRef.current && currentTrack) {
      // Validate track has required properties
      if (!currentTrack.src_mp3) {
        console.error('Track missing src_mp3:', currentTrack);
        setError('Track source unavailable');
        return;
      }
      
      // Reset autoplay attempt flag when track changes
      hasAttemptedAutoplayRef.current = false;
      
      // Reset position when track changes
      audioRef.current.currentTime = position;
    }
  }, [currentId, position, currentTrack, setError]);

  // Provide audio ref to parent component (for unlock functionality)
  useEffect(() => {
    if (onAudioRef) {
      onAudioRef(audioRef.current);
    }
  }, [onAudioRef]);

  // Effect to attempt autoplay when tracks are loaded and ready
  useEffect(() => {
    // Only proceed if we have tracks, a current track, and haven't attempted autoplay yet
    if (tracks.length > 0 && currentTrack && currentTrack.src_mp3 && !hasAttemptedAutoplayRef.current) {
      console.log('🎵 MUSIC PLAYER:', { 
        loadedTracks: tracks.length, 
        currentTrack: currentTrack?.title, 
        artist: currentTrack?.artist,
        isPlaying,
        hasAttemptedAutoplay: hasAttemptedAutoplayRef.current 
      });
      
      // Wait for audio element to be ready and attempt autoplay on canPlay event
      // The actual autoplay attempt is now handled in handleCanPlay callback
    }
  }, [tracks, currentTrack]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  if (!currentTrack) {
    return null;
  }

  // Get the audio source - use MP3 source
  const audioSrc = currentTrack.src_mp3;

  // Don't render if no audio source is available
  if (!audioSrc) {
    console.warn('No audio source available for track:', currentTrack.id);
    return null;
  }

  return (
    <>
      <audio
        ref={audioRef}
        src={audioSrc}
        preload="metadata"
        playsInline
        crossOrigin="anonymous"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onError={handleError}
        onLoadStart={handleLoadStart}
        onCanPlay={handleCanPlay}
        style={{ display: 'none' }}
      />
      
      {/* Silent unlock overlay for iOS */}
      {showSilentOverlay && (
        <SilentUnlockOverlay onUnlock={handleSilentUnlock} />
      )}
      
      {/* Unlock tip overlay */}
      {showUnlockTip && (
        <div 
          className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-black/80 text-white px-4 py-2 rounded-lg text-sm z-50 cursor-pointer"
          onClick={hideUnlockTip}
        >
          Tap anywhere to start audio
        </div>
      )}
    </>
  );
};