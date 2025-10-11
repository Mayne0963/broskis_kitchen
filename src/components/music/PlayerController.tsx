import React, { useEffect, useRef, useCallback } from 'react';
import { useMusicStore, Track } from '@/store/useMusicStore';
import { useAutoplayUnlock } from '@/hooks/useAutoplayUnlock';
import { toast } from 'sonner';

interface PlayerControllerProps {
  onAudioRef?: (audio: HTMLAudioElement | null) => void;
}

export const PlayerController: React.FC<PlayerControllerProps> = ({ onAudioRef }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  const hasAttemptedAutoplayRef = useRef(false);
  
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
  const { isUnlocked, attemptUnlock } = useAutoplayUnlock(audioRef);

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
    const errorMessage = error ? `Audio error: ${error.message}` : 'Track unavailable';
    
    console.error('Audio playback error:', error);
    setError(errorMessage);
    setLoading(false);
    
    toast.error('Track unavailable', {
      description: 'Skipping to next track...',
    });
    
    // Auto-skip to next track after a short delay
    setTimeout(() => {
      next();
    }, 1000);
  }, [setError, setLoading, next]);

  const handleLoadStart = useCallback(() => {
    setLoading(true);
    setError(null);
  }, [setLoading, setError]);

  const handleCanPlay = useCallback(() => {
    setLoading(false);
  }, [setLoading]);

  // Effect to handle play/pause state changes
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        const playPromise = audioRef.current.play();
        if (playPromise !== undefined) {
          playPromise.catch((error) => {
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
  }, [isPlaying, pause, attemptUnlock]);

  // Effect to handle volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Effect to handle track changes
  useEffect(() => {
    if (audioRef.current && currentTrack) {
      // Reset position when track changes
      audioRef.current.currentTime = position;
    }
  }, [currentId, position]);

  // Provide audio ref to parent component (for unlock functionality)
  useEffect(() => {
    if (onAudioRef) {
      onAudioRef(audioRef.current);
    }
  }, [onAudioRef]);

  // Effect to attempt autoplay when tracks are loaded and ready
  useEffect(() => {
    if (tracks.length > 0 && currentTrack && audioRef.current && !hasAttemptedAutoplayRef.current) {
      hasAttemptedAutoplayRef.current = true;
      
      // Wait a bit for the audio element to be ready
      setTimeout(async () => {
        if (audioRef.current && !isPlaying) {
          console.log('🎵 Attempting initial autoplay...');
          
          try {
            // Try to play the first track automatically
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
      }, 500);
    }
  }, [tracks, currentTrack, isPlaying, play]);

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
  );
};