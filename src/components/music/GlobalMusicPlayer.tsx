"use client";
import React, { useEffect, useState } from 'react';
import { 
  Play, 
  Pause, 
  SkipForward, 
  SkipBack, 
  Volume2, 
  VolumeX, 
  Shuffle, 
  Repeat, 
  Repeat1,
  Heart,
  List,
  Square
} from 'lucide-react';
import { useGlobalAudio } from '@/providers/GlobalAudioProvider';
import { useMusicStore } from '@/store/useMusicStore';

interface GlobalMusicPlayerProps {
  className?: string;
  variant?: 'full' | 'compact' | 'mini';
  showPlaylist?: boolean;
}

const GlobalMusicPlayer: React.FC<GlobalMusicPlayerProps> = ({
  className = '',
  variant = 'full',
  showPlaylist = true,
}) => {
  const globalAudio = useGlobalAudio();
  
  // Return loading state if global audio context is not available
  if (!globalAudio) {
    return (
      <div className={`bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-6 ${className}`}>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-700 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-gray-700 rounded w-1/2"></div>
        </div>
      </div>
    );
  }
  
  const { 
    tracks: globalTracks, 
    currentIndex, 
    current: currentTrack, 
    time: position, 
    duration, 
    isPlaying,
    play: globalPlay, 
    pause: globalPause, 
    next: globalNext, 
    prev: globalPrev,
    setTime: globalSetTime,
    audioRef
  } = globalAudio;
  
  const { playlists } = useMusicStore();
  const [showPlaylistPanel, setShowPlaylistPanel] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [volume, setVolume] = useState(0.8);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState<'off' | 'all' | 'one'>('off');

  // Enhanced format time helper
  const formatTime = (seconds: number): string => {
    if (!seconds || Number.isNaN(seconds) || !Number.isFinite(seconds)) {
      return "0:00";
    }
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle seek
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPosition = Number(e.target.value);
    if (Number.isNaN(newPosition) || newPosition < 0) return;
    const maxPosition = duration || 0;
    const clampedPosition = Math.min(newPosition, maxPosition);
    globalSetTime(clampedPosition);
  };

  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number(e.target.value);
    setVolume(newVolume);
    // Apply volume to global audio element
    if (audioRef.current) {
      audioRef.current.volume = newVolume;
    }
  };

  // Toggle favorite
  const toggleFavorite = (trackId: string) => {
    setFavorites(prev => 
      prev.includes(trackId) 
        ? prev.filter(id => id !== trackId)
        : [...prev, trackId]
    );
  };

  // Handle playlist selection
  const handlePlaylistSelect = (playlistId: string) => {
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) return;
    
    // Find the first track in the playlist
    const firstTrackId = playlist.trackIds[0];
    const trackIndex = globalTracks.findIndex(t => t.id === firstTrackId);
    if (trackIndex >= 0) {
      globalPlay(trackIndex);
    }
  };

  // Handle track selection
  const handleTrackSelect = (trackId: string) => {
    const trackIndex = globalTracks.findIndex(t => t.id === trackId);
    if (trackIndex >= 0) {
      globalPlay(trackIndex);
    }
  };

  // Get repeat icon
  const getRepeatIcon = () => {
    switch (repeat) {
      case 'one':
        return <Repeat1 className="w-5 h-5" />;
      case 'all':
        return <Repeat className="w-5 h-5" />;
      default:
        return <Repeat className="w-5 h-5" />;
    }
  };

  // Get current playlist tracks
  const getCurrentPlaylistTracks = () => {
    if (!currentTrack) return [];
    
    // Find which playlist contains the current track
    const currentPlaylist = playlists.find(p => 
      p.trackIds.includes(currentTrack.id)
    );
    
    if (!currentPlaylist) return globalTracks;
    
    return currentPlaylist.trackIds
      .map(id => globalTracks.find(t => t.id === id))
      .filter(Boolean) as typeof globalTracks;
  };

  const currentPlaylistTracks = getCurrentPlaylistTracks();

  // Mini variant
  if (variant === 'mini') {
    return (
      <div className={`bg-gray-900 rounded-lg p-3 flex items-center space-x-3 ${className}`}>
        <button
          onClick={isPlaying ? globalPause : () => globalPlay()}
          className="text-orange-500 hover:text-orange-400 transition-colors"
        >
          {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
        </button>
        
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium truncate">{currentTrack?.title || 'No track selected'}</p>
          <p className="text-gray-400 text-xs truncate">{currentTrack?.genre || ''}</p>
        </div>
        
        <div className="text-xs text-gray-400">
          {formatTime(position)} / {formatTime(duration)}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-700 ${className}`}>
      {/* Main Player */}
      <div className="p-6">
        {/* Current Track Info */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="w-16 h-16 bg-gradient-to-br from-orange-400 to-red-500 rounded-lg flex items-center justify-center">
            <div className="text-white text-2xl">♪</div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="text-white font-semibold text-lg truncate">
              {currentTrack?.title || 'Select a track'}
            </h3>
            <p className="text-gray-400 truncate">
              {currentTrack?.genre || 'No genre'}
            </p>
            {/* Dev-only badge showing track path */}
            {process.env.NODE_ENV === 'development' && currentTrack && (
              <p className="text-xs text-gray-500 truncate" data-testid="track-path">
                {currentTrack.src_mp3 || currentTrack.src_m4a}
              </p>
            )}
          </div>
          
          <button
            onClick={() => currentTrack && toggleFavorite(currentTrack.id)}
            className={`p-2 rounded-full transition-colors ${
              currentTrack && favorites.includes(currentTrack.id)
                ? 'text-red-500 hover:text-red-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Heart className="w-5 h-5" fill={currentTrack && favorites.includes(currentTrack.id) ? 'currentColor' : 'none'} />
          </button>
        </div>

        {/* Enhanced Progress Bar */}
        <div className="music-progress-container">
          <span className="music-time-display current-time">
            {formatTime(position)}
          </span>
          <div className="music-progress-wrapper">
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={0.25}
              value={position}
              onChange={handleSeek}
              className="music-progress"
              style={{
                background: `linear-gradient(to right, #f97316 0%, #f97316 ${(position / (duration || 1)) * 100}%, #374151 ${(position / (duration || 1)) * 100}%, #374151 100%)`
              }}
              aria-label="Music progress"
              aria-valuemin={0}
              aria-valuemax={duration || 0}
              aria-valuenow={position}
              aria-valuetext={`${formatTime(position)} of ${formatTime(duration)}`}
            />
          </div>
          <span className="music-time-display duration-time">
            {formatTime(duration)}
          </span>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center space-x-6 mb-6">
          <button
            onClick={() => setShuffle(!shuffle)}
            className={`p-2 rounded-full transition-colors ${
              shuffle ? 'text-orange-500 bg-orange-500/20' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Shuffle className="w-5 h-5" />
          </button>
          
          <button
            onClick={globalPrev}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <SkipBack className="w-6 h-6" />
          </button>
          
          {isPlaying ? (
            <button
              onClick={globalPause}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white p-3 rounded-full transition-all duration-200 transform hover:scale-105"
              title="Pause"
            >
              <Pause className="w-6 h-6" />
            </button>
          ) : (
            <button
              onClick={() => globalPlay()}
              className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white p-3 rounded-full transition-all duration-200 transform hover:scale-105"
              title="Play"
            >
              <Play className="w-6 h-6 ml-1" />
            </button>
          )}
          
          <button
            onClick={globalNext}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <SkipForward className="w-6 h-6" />
          </button>
          
          <button
            onClick={() => setRepeat(repeat === 'off' ? 'all' : repeat === 'all' ? 'one' : 'off')}
            className={`p-2 rounded-full transition-colors ${
              repeat !== 'off' ? 'text-orange-500 bg-orange-500/20' : 'text-gray-400 hover:text-white'
            }`}
          >
            {getRepeatIcon()}
          </button>
        </div>

        {/* Volume Control */}
        <div className="flex items-center space-x-3 mb-6">
          <button
            onClick={() => setVolume(volume > 0 ? 0 : 0.8)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            {volume === 0 ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
          </button>
          <div className="flex-1">
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={handleVolumeChange}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
              style={{
                background: `linear-gradient(to right, #f97316 0%, #f97316 ${volume * 100}%, #374151 ${volume * 100}%, #374151 100%)`
              }}
            />
          </div>
          <span className="text-sm text-gray-400 w-8">
            {Math.round(volume * 100)}
          </span>
        </div>

        {/* Playlist Controls */}
        <div className="flex items-center justify-between">
          <div className="flex space-x-2 flex-wrap">
            {playlists.map((playlist) => (
              <button
                key={playlist.id}
                onClick={() => handlePlaylistSelect(playlist.id)}
                className="px-3 py-1 rounded-full text-sm transition-colors bg-gray-700 text-gray-300 hover:bg-gray-600"
              >
                {playlist.title}
              </button>
            ))}
          </div>
          
          <button
            onClick={() => setShowPlaylistPanel(!showPlaylistPanel)}
            className="text-gray-400 hover:text-white transition-colors"
            data-testid="playlist-toggle"
          >
            <List className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Playlist Panel */}
      {showPlaylistPanel && (
        <div className="border-t border-gray-700 p-6">
          <h4 className="text-white font-semibold mb-4">All Tracks</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {currentPlaylistTracks.map((track) => (
              <div
                key={track.id}
                onClick={() => handleTrackSelect(track.id)}
                className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-colors ${
                  currentTrack?.id === track.id
                    ? 'bg-orange-500/20 border border-orange-500/30'
                    : 'hover:bg-gray-700/50'
                }`}
                data-testid={`track-${track.id}`}
                data-path={track.src_mp3 || track.src_m4a}
              >
                <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded flex items-center justify-center text-white text-xs">
                  {currentTrack?.id === track.id && isPlaying ? (
                    <Pause className="w-3 h-3" />
                  ) : (
                    <Play className="w-3 h-3" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{track.title}</p>
                  <p className="text-gray-400 text-xs truncate">{track.genre}</p>
                  {/* Dev-only badge showing track path */}
                  {process.env.NODE_ENV === 'development' && (
                    <p 
                      className="text-xs text-gray-500 truncate"
                      data-testid="track-path"
                    >
                      {track.src_mp3 || track.src_m4a}
                    </p>
                  )}
                </div>
                <span className="text-gray-400 text-xs">
                  {formatTime(track.duration || 180)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default GlobalMusicPlayer;