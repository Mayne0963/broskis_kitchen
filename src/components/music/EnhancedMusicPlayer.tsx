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
  Minimize2,
  Maximize2
} from 'lucide-react';
import { useMusicStore, Track } from '@/store/useMusicStore';
import { PlayerController } from './PlayerController';

interface EnhancedMusicPlayerProps {
  className?: string;
  variant?: 'full' | 'compact' | 'mini';
  showPlaylist?: boolean;
  onAudioRef?: (audio: HTMLAudioElement | null) => void;
}

export const EnhancedMusicPlayer: React.FC<EnhancedMusicPlayerProps> = ({
  className = '',
  variant = 'full',
  showPlaylist = true,
  onAudioRef,
}) => {
  const {
    tracks,
    playlists,
    currentId,
    currentPlaylistId,
    isPlaying,
    position,
    duration,
    volume,
    shuffle,
    repeat,
    isLoading,
    error,
    setTracks,
    setQueue,
    loadPlaylist,
    play,
    pause,
    toggle,
    next,
    prev,
    seek,
    setVolume,
    toggleShuffle,
    cycleRepeat,
    loadState,
  } = useMusicStore();

  const [showPlaylistPanel, setShowPlaylistPanel] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);

  // Get current playlist and track
  const currentPlaylist = playlists.find(p => p.id === currentPlaylistId);
  const currentTrack = tracks.find(t => t.id === currentId);

  // Get tracks for current playlist
  const getPlaylistTracks = (playlistId: string | null): Track[] => {
    if (!playlistId) return tracks;
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) return tracks;
    return playlist.trackIds.map(id => tracks.find(t => t.id === id)).filter(Boolean) as Track[];
  };

  const currentPlaylistTracks = getPlaylistTracks(currentPlaylistId);

  // Initialize with first playlist when playlists are loaded
  useEffect(() => {
    if (playlists.length > 0 && !currentPlaylistId) {
      loadPlaylist(playlists[0].id);
    }
  }, [playlists, currentPlaylistId, loadPlaylist]);

  // Load tracks and restore state on mount
  useEffect(() => {
    loadState();
  }, [loadState]);

  // Format time helper
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle seek
  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPosition = Number(e.target.value);
    seek(newPosition);
  };

  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number(e.target.value);
    setVolume(newVolume);
  };

  // Toggle favorite
  const toggleFavorite = (trackId: string) => {
    setFavorites(prev => 
      prev.includes(trackId) 
        ? prev.filter(id => id !== trackId)
        : [...prev, trackId]
    );
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

  // Mini variant
  if (variant === 'mini') {
    return (
      <div className={`bg-gray-900 rounded-lg p-3 flex items-center space-x-3 ${className}`}>
        <button
          onClick={toggle}
          disabled={isLoading}
          className="text-orange-500 hover:text-orange-400 transition-colors"
        >
          {isLoading ? (
            <div className="animate-spin w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full" />
          ) : isPlaying ? (
            <Pause className="w-5 h-5" />
          ) : (
            <Play className="w-5 h-5" />
          )}
        </button>
        
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium truncate">{currentTrack?.title || 'No track selected'}</p>
          <p className="text-gray-400 text-xs truncate">{currentTrack?.artist || ''}</p>
        </div>
        
        <div className="text-xs text-gray-400">
          {formatTime(position)} / {formatTime(duration)}
        </div>
        
        <PlayerController onAudioRef={onAudioRef} />
      </div>
    );
  }

  return (
    <div className={`bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-700 ${className}`}>
      {/* Player Controller (hidden audio element) */}
      <PlayerController onAudioRef={onAudioRef} />
      
      {/* Error Display */}
      {error && (
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-3 mb-4 mx-6 mt-6">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Main Player */}
      <div className={`p-6 ${isMinimized ? 'hidden' : ''}`}>
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
              {currentTrack?.artist || 'No artist'}
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

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center space-x-3 mb-2">
            <span className="text-sm text-gray-400 w-12 text-right">
              {formatTime(position)}
            </span>
            <div className="flex-1">
              <input
                type="range"
                min={0}
                max={duration || 0}
                value={position}
                onChange={handleSeek}
                className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider"
                style={{
                  background: `linear-gradient(to right, #f97316 0%, #f97316 ${(position / (duration || 1)) * 100}%, #374151 ${(position / (duration || 1)) * 100}%, #374151 100%)`
                }}
              />
            </div>
            <span className="text-sm text-gray-400 w-12">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center space-x-6 mb-6">
          <button
            onClick={toggleShuffle}
            className={`p-2 rounded-full transition-colors ${
              shuffle ? 'text-orange-500 bg-orange-500/20' : 'text-gray-400 hover:text-white'
            }`}
          >
            <Shuffle className="w-5 h-5" />
          </button>
          
          <button
            onClick={prev}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <SkipBack className="w-6 h-6" />
          </button>
          
          <button
            onClick={toggle}
            disabled={isLoading}
            className="bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white p-3 rounded-full transition-all duration-200 transform hover:scale-105 disabled:opacity-50"
          >
            {isLoading ? (
              <div className="animate-spin w-6 h-6 border-2 border-white border-t-transparent rounded-full" />
            ) : isPlaying ? (
              <Pause className="w-6 h-6" />
            ) : (
              <Play className="w-6 h-6 ml-1" />
            )}
          </button>
          
          <button
            onClick={next}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <SkipForward className="w-6 h-6" />
          </button>
          
          <button
            onClick={cycleRepeat}
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
                onClick={() => loadPlaylist(playlist.id)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  currentPlaylistId === playlist.id
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
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
      {showPlaylistPanel && currentPlaylist && (
        <div className="border-t border-gray-700 p-6">
          <h4 className="text-white font-semibold mb-4">{currentPlaylist.title}</h4>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {currentPlaylistTracks.map((track) => (
              <div
                key={track.id}
                onClick={() => play(track.id)}
                className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-colors ${
                  currentId === track.id
                    ? 'bg-orange-500/20 border border-orange-500/30'
                    : 'hover:bg-gray-700/50'
                }`}
                data-testid={`track-${track.id}`}
                data-path={track.src_mp3 || track.src_m4a}
              >
                <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-red-500 rounded flex items-center justify-center text-white text-xs">
                  {currentId === track.id && isPlaying ? (
                    <Pause className="w-3 h-3" />
                  ) : (
                    <Play className="w-3 h-3" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{track.title}</p>
                  <p className="text-gray-400 text-xs truncate">{track.artist}</p>
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
                  {formatTime(track.duration)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Minimize/Maximize Button */}
      <button
        onClick={() => setIsMinimized(!isMinimized)}
        className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
      >
        {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
      </button>
    </div>
  );
};