import React, { useEffect, useRef, useCallback } from 'react';
import { useMusicStore, Track } from '@/store/useMusicStore';
import { toast } from 'sonner';

interface PlayerControllerProps {
  onAudioRef?: (audio: HTMLAudioElement | null) => void;
}

export const PlayerController: React.FC<PlayerControllerProps> = ({ onAudioRef }) => {
  const audioRef = useRef<HTMLAudioElement>(null);
  
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

  // Setup Media Session API
  const setupMediaSession = useCallback((track: Track) => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: track.artist,
        artwork: [
          { src: track.cover, sizes: '96x96', type: 'image/png' },
          { src: track.cover, sizes: '128x128', type: 'image/png' },
          { src: track.cover, sizes: '192x192', type: 'image/png' },
          { src: track.cover, sizes: '256x256', type: 'image/png' },
          { src: track.cover, sizes: '384x384', type: 'image/png' },
          { src: track.cover, sizes: '512x512', type: 'image/png' },
        ],
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
            console.error('Play failed:', error);
            pause();
          });
        }
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, pause]);

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

  // Get the audio source - only use local sources (M4A or MP3)
  const audioSrc = currentTrack.src_m4a || currentTrack.src_mp3;

  // Don't render if no local source is available
  if (!audioSrc) {
    console.warn('No local audio source available for track:', currentTrack.id);
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