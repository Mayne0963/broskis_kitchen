import React, { useEffect, useRef, useCallback, useState } from 'react';
import { useMusicStore, Track } from '@/store/useMusicStore';
import { useAutoplayUnlock } from '@/hooks/useAutoplayUnlock';
import { analytics } from '@/lib/analytics';
import { toast } from 'sonner';



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
  useAutoplayUnlock(audioRef);

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
    if (!unlocked) {
      setShowSilentOverlay(true);
    }
  }, []);

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
    
    // Only log audio errors in development to reduce console noise in production
    if (process.env.NODE_ENV === 'development') {
      console.warn('Audio playback error (auto-skipping):', {
        track: currentTrack?.title,
        error: errorMessage,
        code: errorCode,
        src: currentTrack?.src_mp3
      });
    }
    
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
        // Suppress analytics errors to prevent console noise
        if (process.env.NODE_ENV === 'development') {
          console.log('Analytics error:', e);
        }
      }
    }
    
    // Show user-friendly toast with track name
    const trackName = currentTrack?.title || 'track';
    toast.error(`Skipping "${trackName}" - file not available`, {
      duration: 3000,
      description: 'Moving to next track...'
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
              pause();
            });
        }
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, pause, currentTrack]);

  // Effect to handle volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  // Effect to handle seek/position changes from store
  useEffect(() => {
    if (audioRef.current && currentTrack) {
      const audioCurrentTime = audioRef.current.currentTime;
      const timeDifference = Math.abs(audioCurrentTime - position);
      
      // Only update audio currentTime if there's a significant difference (>1 second)
      // This prevents interference with normal time updates during playback
      if (timeDifference > 1) {
        console.log(`🎵 Seeking from ${audioCurrentTime.toFixed(2)}s to ${position.toFixed(2)}s`);
        audioRef.current.currentTime = position;
      }
    }
  }, [position, currentTrack]);

  // Effect to handle track changes with validation
  useEffect(() => {
    if (!currentTrack) return;
    const el = audioRef.current;
    if (!el) return;

    const src = currentTrack.src_mp3;
    if (!src) {
      console.error('Track missing audio source:', currentTrack);
      setError('Track source unavailable');
      // Auto-skip to next track if current track has no source
      setTimeout(() => {
        next();
      }, 1000);
      return;
    }

    // Validate that the source is a local file (starts with /audio/)
    if (!src.startsWith('/audio/')) {
      console.warn('Non-local audio source detected:', src);
      setError('Invalid audio source');
      setTimeout(() => {
        next();
      }, 1000);
      return;
    }

    // Abort any previous loading
    el.pause();
    el.src = src;
    el.load();

    // Reset autoplay attempt flag when track changes
    hasAttemptedAutoplayRef.current = false;

    // Don't attempt autoplay here - let handleCanPlay handle it
    // This prevents ERR_ABORTED errors from premature play() calls
  }, [currentTrack, setError, next]);

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
  }, [tracks, currentTrack, isPlaying]);

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
        <div 
          onClick={handleSilentUnlock}
          className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 text-white text-xl z-50 cursor-pointer"
        >
          <div className="text-center">
            <div className="text-4xl mb-4">🎶</div>
            <div className="text-2xl font-bold mb-2">Tap to Start Broski&apos;s Music</div>
            <div className="text-lg opacity-75">One tap unlocks all tracks</div>
          </div>
        </div>
      )}
      

    </>
  );
};