"use client"

import React, { useState, useRef, useEffect } from 'react'
import { FaPlay, FaPause, FaForward, FaBackward, FaVolumeUp, FaVolumeDown, FaRandom, FaRedoAlt, FaHeart, FaRegHeart, FaList, FaMinus, FaExpand, FaCompress } from 'react-icons/fa'
import { musicCredits } from '../../data/music-credits'

interface Track {
  id: string
  title: string
  artist: string
  url: string
  coverImage?: string
  genre?: string
  duration?: number
}

interface Playlist {
  id: string
  name: string
  description: string
  tracks: Track[]
  color: string
}

interface MUSICPLERAYProps {
  className?: string
  variant?: 'full' | 'compact' | 'mini'
  autoPlay?: boolean
  showPlaylist?: boolean
  defaultPlaylist?: 'chill' | 'upbeat' | 'jazz'
}

const MUSICPLERAY: React.FC<MUSICPLERAYProps> = ({
  className = '',
  variant = 'full',
  autoPlay = false,
  showPlaylist = true,
  defaultPlaylist = 'chill'
}) => {
  // Organized playlists with royalty-free music
  const playlists: Playlist[] = [
    {
      id: 'chill',
      name: 'Chill Vibes',
      description: 'Relaxing and ambient tracks perfect for unwinding',
      color: 'from-blue-500 to-purple-600',
      tracks: [
        {
          id: 'chill-1',
          title: 'Chill Lofi Beat',
          artist: 'Royalty Free Music',
          url: '/music/chill-lofi-beat.mp3',
          coverImage: '/images/lofi_study_beats.jpg',
          genre: 'Lofi',
          duration: 180
        },
        {
          id: 'chill-2',
          title: 'Peaceful Piano',
          artist: 'Ambient Sounds',
          url: '/music/peaceful-piano.mp3',
          coverImage: '/images/relaxing-piano.svg',
          genre: 'Ambient',
          duration: 240
        },
        {
          id: 'chill-3',
          title: 'Ambient Nature',
          artist: 'Nature Sounds',
          url: '/music/ambient-nature.mp3',
          coverImage: '/images/relaxing-piano.svg',
          genre: 'Ambient',
          duration: 300
        },
        {
          id: 'chill-4',
          title: 'Ambient Relaxing',
          artist: 'Zen Masters',
          url: '/music/ambient-relaxing.mp3',
          coverImage: '/images/relaxing-piano.svg',
          genre: 'Ambient',
          duration: 320
        }
      ]
    },
    {
      id: 'upbeat',
      name: 'Upbeat Energy',
      description: 'Energetic and motivating tracks to boost your mood',
      color: 'from-[var(--color-harvest-gold)] to-[var(--color-harvest-gold)]',
      tracks: [
        {
          id: 'upbeat-1',
          title: 'Uplifting Corporate',
          artist: 'Royalty Free Music',
          url: '/music/uplifting-corporate.mp3',
          coverImage: '/images/lofi_study_beats.jpg',
          genre: 'Corporate',
          duration: 220
        },
        {
          id: 'upbeat-2',
          title: 'Electronic Future',
          artist: 'Digital Beats',
          url: '/music/electronic-future.mp3',
          coverImage: '/images/lofi_study_beats.jpg',
          genre: 'Electronic',
          duration: 190
        },
        {
          id: 'upbeat-3',
          title: 'Upbeat Acoustic',
          artist: 'Acoustic Vibes',
          url: '/music/upbeat-acoustic.mp3',
          coverImage: '/images/chilled-vibes.svg',
          genre: 'Acoustic',
          duration: 210
        }
      ]
    },
    {
      id: 'jazz',
      name: 'Jazz Collection',
      description: 'Smooth jazz and sophisticated melodies',
      color: 'from-green-500 to-teal-600',
      tracks: [
        {
          id: 'jazz-1',
          title: 'Jazzy Abstract',
          artist: 'Creative Commons',
          url: '/music/jazzy-abstract.mp3',
          coverImage: '/images/chilled-vibes.svg',
          genre: 'Jazz',
          duration: 200
        },
        {
          id: 'jazz-2',
          title: 'Smooth Jazz',
          artist: 'Jazz Collective',
          url: '/music/smooth-jazz.mp3',
          coverImage: '/images/chilled-vibes.svg',
          genre: 'Jazz',
          duration: 280
        }
      ]
    }
  ]

  const [currentPlaylistId, setCurrentPlaylistId] = useState(defaultPlaylist)
  const currentPlaylist = playlists.find(p => p.id === currentPlaylistId) || playlists[0]
  const playlist = currentPlaylist.tracks
  const audioRef = useRef<HTMLAudioElement>(null)
  
  // Player state
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.7)
  const [isShuffled, setIsShuffled] = useState(false)
  const [isRepeating, setIsRepeating] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [favorites, setFavorites] = useState<string[]>([])
  const [isMinimized, setIsMinimized] = useState(false)
  const [isCompact, setIsCompact] = useState(variant === 'compact')
  const [showPlaylistPanel, setShowPlaylistPanel] = useState(showPlaylist)

  const currentTrack = playlist[currentTrackIndex]

  // Auto-play on mount if enabled
  useEffect(() => {
    if (autoPlay && currentTrack) {
      handlePlay()
    }
  }, [])

  // Update audio element when track changes
  useEffect(() => {
    if (audioRef.current && currentTrack) {
      audioRef.current.src = currentTrack.url
      
      // Add error handling for audio loading
      audioRef.current.addEventListener('error', (e) => {
        console.warn('Audio loading error for:', currentTrack.title, e);
        // Skip to next track on error
        handleNext();
      });
      
      audioRef.current.load()
      setCurrentTime(0)
      setError(null)
    }
  }, [currentTrack])

  // Update volume
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])

  // Audio event handlers
  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
      setIsLoading(false)
    }
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleEnded = () => {
    if (isRepeating) {
      handlePlay()
    } else {
      handleNext()
    }
  }

  const handleError = () => {
    setError('Failed to load track')
    setIsPlaying(false)
    setIsLoading(false)
  }

  const handlePlay = async () => {
    if (!audioRef.current || !currentTrack) return
    
    try {
      setIsLoading(true)
      setError(null)
      await audioRef.current.play()
      setIsPlaying(true)
    } catch (err) {
      setError('Playback failed')
      setIsPlaying(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePause = () => {
    if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }

  const handlePlayPause = () => {
    if (isPlaying) {
      handlePause()
    } else {
      handlePlay()
    }
  }

  const handleNext = () => {
    let nextIndex
    if (isShuffled) {
      nextIndex = Math.floor(Math.random() * playlist.length)
    } else {
      nextIndex = (currentTrackIndex + 1) % playlist.length
    }
    setCurrentTrackIndex(nextIndex)
    if (isPlaying) {
      setTimeout(handlePlay, 100)
    }
  }

  const handlePrevious = () => {
    let prevIndex
    if (currentTime > 3) {
      // If more than 3 seconds played, restart current track
      if (audioRef.current) {
        audioRef.current.currentTime = 0
      }
      return
    }
    
    if (isShuffled) {
      prevIndex = Math.floor(Math.random() * playlist.length)
    } else {
      prevIndex = currentTrackIndex === 0 ? playlist.length - 1 : currentTrackIndex - 1
    }
    setCurrentTrackIndex(prevIndex)
    if (isPlaying) {
      setTimeout(handlePlay, 100)
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = Number(e.target.value)
    setCurrentTime(newTime)
    if (audioRef.current) {
      audioRef.current.currentTime = newTime
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number(e.target.value)
    setVolume(newVolume)
  }

  const toggleShuffle = () => {
    setIsShuffled(!isShuffled)
  }

  const toggleRepeat = () => {
    setIsRepeating(!isRepeating)
  }

  const toggleFavorite = (trackId: string) => {
    setFavorites(prev => 
      prev.includes(trackId) 
        ? prev.filter(id => id !== trackId)
        : [...prev, trackId]
    )
  }

  const selectTrack = (index: number) => {
    setCurrentTrackIndex(index)
    if (isPlaying) {
      setTimeout(handlePlay, 100)
    }
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const getGenreColor = (genre?: string) => {
    const colors: { [key: string]: string } = {
      'Lofi': 'bg-purple-500',
      'Jazz': 'bg-gold-foil',
    'Ambient': 'bg-harvest-gold',
      'Electronic': 'bg-pink-500',
      'Corporate': 'bg-orange-500',
      'Acoustic': 'bg-[var(--color-harvest-gold)]'
    }
    return colors[genre || ''] || 'bg-gray-500'
  }

  if (variant === 'mini') {
    return (
      <div className={`bg-gray-900 rounded-lg p-3 flex items-center space-x-3 ${className}`}>
        <button
          onClick={handlePlayPause}
          disabled={isLoading}
          className="text-gold-foil hover:text-amber-400 transition-colors"
        >
          {isLoading ? (
            <div className="animate-spin w-6 h-6 border-2 border-gold-foil border-t-transparent rounded-full" />
          ) : isPlaying ? (
            <FaPause size={20} />
          ) : (
            <FaPlay size={20} />
          )}
        </button>
        
        <div className="flex-1 min-w-0">
          <p className="text-white text-sm font-medium truncate">{currentTrack?.title}</p>
          <p className="text-gray-400 text-xs truncate">{currentTrack?.artist}</p>
        </div>
        
        <div className="text-xs text-gray-400">
          {formatTime(currentTime)} / {formatTime(duration)}
        </div>
        
        <audio
          ref={audioRef}
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          onError={handleError}
        />
      </div>
    )
  }

  if (isMinimized) {
    return (
      <div className={`bg-gray-900 rounded-lg p-2 flex items-center space-x-2 ${className}`}>
        <button
          onClick={handlePlayPause}
          className="text-gold-foil hover:text-amber-400"
        >
          {isPlaying ? <FaPause size={16} /> : <FaPlay size={16} />}
        </button>
        
        <div className="flex-1 min-w-0">
          <p className="text-white text-xs truncate">{currentTrack?.title}</p>
        </div>
        
        <button
          onClick={() => setIsMinimized(false)}
          className="text-gray-400 hover:text-white"
        >
          <FaExpand size={12} />
        </button>
      </div>
    )
  }

  return (
    <div className={`bg-gradient-to-br from-gray-900 to-black rounded-xl border border-gray-700 shadow-2xl ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-700">
        <h3 className="text-white font-bold text-lg flex items-center">
          <FaList className="mr-2 text-gold-foil" />
          Music Player
        </h3>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsCompact(!isCompact)}
            className="text-gray-400 hover:text-white transition-colors"
            title={isCompact ? 'Expand' : 'Compact'}
          >
            {isCompact ? <FaExpand size={14} /> : <FaCompress size={14} />}
          </button>
          
          <button
            onClick={() => setIsMinimized(true)}
            className="text-gray-400 hover:text-white transition-colors"
            title="Minimize"
          >
            <FaMinus size={14} />
          </button>
        </div>
      </div>

      <div className={`p-6 ${isCompact ? 'space-y-4' : 'space-y-6'}`}>
        {/* Playlist Selector */}
        <div className="space-y-3">
          <h4 className="text-white font-semibold text-sm">Select Playlist</h4>
          <div className="grid grid-cols-3 gap-2">
            {playlists.map((playlistOption) => (
              <button
                key={playlistOption.id}
                onClick={() => {
                  setCurrentPlaylistId(playlistOption.id)
                  setCurrentTrackIndex(0)
                  if (isPlaying) {
                    setTimeout(handlePlay, 100)
                  }
                }}
                className={`p-3 rounded-lg border transition-all duration-300 ${
                  currentPlaylistId === playlistOption.id
                    ? `bg-gradient-to-r ${playlistOption.color} border-transparent text-white shadow-lg`
                    : 'bg-gray-800 border-gray-600 text-gray-300 hover:border-gray-500 hover:bg-gray-700'
                }`}
              >
                <div className="text-center">
                  <p className="font-semibold text-sm">{playlistOption.name}</p>
                  <p className="text-xs opacity-80 mt-1">{playlistOption.tracks.length} tracks</p>
                </div>
              </button>
            ))}
          </div>
          
          {/* Current Playlist Info */}
          <div className={`p-3 rounded-lg bg-gradient-to-r ${currentPlaylist.color} bg-opacity-20 border border-opacity-30`}>
            <p className="text-white font-medium">{currentPlaylist.name}</p>
            <p className="text-gray-300 text-sm">{currentPlaylist.description}</p>
          </div>
        </div>

        {/* Current Track Info */}
        {!isCompact && (
          <div className="flex items-center space-x-4">
            <div className="relative">
              <img
                src={currentTrack?.coverImage || '/placeholder.jpg'}
                alt={currentTrack?.title}
                className="w-20 h-20 rounded-lg object-cover"
              />
              {currentTrack?.genre && (
                <span className={`absolute -top-2 -right-2 text-xs px-2 py-1 rounded-full text-white ${getGenreColor(currentTrack.genre)}`}>
                  {currentTrack.genre}
                </span>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <h4 className="text-white font-bold text-lg truncate">{currentTrack?.title}</h4>
              <p className="text-gray-400 truncate">{currentTrack?.artist}</p>
              
              <div className="flex items-center mt-2 space-x-2">
                <button
                  onClick={() => currentTrack && toggleFavorite(currentTrack.id)}
                  className={`transition-colors ${
                    currentTrack && favorites.includes(currentTrack.id)
                      ? 'text-[var(--color-harvest-gold)] hover:text-[var(--color-harvest-gold)]'
        : 'text-gray-400 hover:text-[var(--color-harvest-gold)]'
                  }`}
                >
                  {currentTrack && favorites.includes(currentTrack.id) ? (
                    <FaHeart size={16} />
                  ) : (
                    <FaRegHeart size={16} />
                  )}
                </button>
                
                <span className="text-xs text-gray-500">
                  Track {currentTrackIndex + 1} of {playlist.length}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <span className="text-xs text-gray-400 w-12">{formatTime(currentTime)}</span>
            
            <div className="flex-1 relative">
              <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-gold-foil to-amber-400 transition-all duration-300"
                  style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
                />
              </div>
              
              <input
                type="range"
                min={0}
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </div>
            
            <span className="text-xs text-gray-400 w-12">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center space-x-6">
          <button
            onClick={toggleShuffle}
            className={`transition-colors ${
              isShuffled ? 'text-gold-foil' : 'text-gray-400 hover:text-white'
            }`}
            title="Shuffle"
          >
            <FaRandom size={18} />
          </button>
          
          <button
            onClick={handlePrevious}
            className="text-white hover:text-gold-foil transition-colors"
            title="Previous"
          >
            <FaBackward size={20} />
          </button>
          
          <button
            onClick={handlePlayPause}
            disabled={isLoading}
            className="bg-gradient-to-r from-gold-foil to-amber-500 text-black p-3 rounded-full hover:from-amber-400 hover:to-gold-foil transition-all duration-300 disabled:opacity-50"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isLoading ? (
              <div className="animate-spin w-6 h-6 border-2 border-black border-t-transparent rounded-full" />
            ) : isPlaying ? (
              <FaPause size={24} />
            ) : (
              <FaPlay size={24} />
            )}
          </button>
          
          <button
            onClick={handleNext}
            className="text-white hover:text-gold-foil transition-colors"
            title="Next"
          >
            <FaForward size={20} />
          </button>
          
          <button
            onClick={toggleRepeat}
            className={`transition-colors ${
              isRepeating ? 'text-gold-foil' : 'text-gray-400 hover:text-white'
            }`}
            title="Repeat"
          >
            <FaRedoAlt size={18} />
          </button>
        </div>

        {/* Volume Control */}
        <div className="flex items-center space-x-3">
          <FaVolumeDown className="text-gray-400" size={16} />
          
          <div className="flex-1 relative">
            <div className="h-1 bg-gray-700 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-gold-foil to-amber-400"
                style={{ width: `${volume * 100}%` }}
              />
            </div>
            
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={handleVolumeChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
          </div>
          
          <FaVolumeUp className="text-gray-400" size={16} />
          <span className="text-xs text-gray-400 w-8">{Math.round(volume * 100)}%</span>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-gold-foil/20 border border-gold-foil/30 rounded-lg p-3">
            <p className="text-[var(--color-harvest-gold)] text-sm">{error}</p>
          </div>
        )}

        {/* Playlist */}
        {showPlaylistPanel && !isCompact && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-white font-semibold">Playlist</h4>
              <button
                onClick={() => setShowPlaylistPanel(false)}
                className="text-gray-400 hover:text-white text-sm"
              >
                Hide
              </button>
            </div>
            
            <div className="max-h-48 overflow-y-auto space-y-2">
              {playlist.map((track, index) => (
                <div
                  key={track.id}
                  onClick={() => selectTrack(index)}
                  className={`flex items-center space-x-3 p-2 rounded-lg cursor-pointer transition-colors ${
                    index === currentTrackIndex
                      ? 'bg-gold-foil/20 border border-gold-foil/30'
                      : 'hover:bg-gray-800'
                  }`}
                >
                  <div className="w-8 h-8 rounded bg-gray-700 flex items-center justify-center">
                    {index === currentTrackIndex && isPlaying ? (
                      <div className="w-2 h-2 bg-gold-foil rounded-full animate-pulse" />
                    ) : (
                      <span className="text-xs text-gray-400">{index + 1}</span>
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${
                      index === currentTrackIndex ? 'text-gold-foil' : 'text-white'
                    }`}>
                      {track.title}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{track.artist}</p>
                  </div>
                  
                  {track.genre && (
                    <span className={`text-xs px-2 py-1 rounded-full text-white ${getGenreColor(track.genre)}`}>
                      {track.genre}
                    </span>
                  )}
                  
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleFavorite(track.id)
                    }}
                    className={`transition-colors ${
                      favorites.includes(track.id)
                        ? 'text-[var(--color-harvest-gold)] hover:text-[var(--color-harvest-gold)]'
          : 'text-gray-400 hover:text-[var(--color-harvest-gold)]'
                    }`}
                  >
                    {favorites.includes(track.id) ? (
                      <FaHeart size={12} />
                    ) : (
                      <FaRegHeart size={12} />
                    )}
                  </button>
                  
                  <span className="text-xs text-gray-500">
                    {track.duration ? formatTime(track.duration) : '--:--'}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {!showPlaylistPanel && !isCompact && (
          <button
            onClick={() => setShowPlaylistPanel(true)}
            className="w-full text-center text-gray-400 hover:text-white text-sm py-2 border border-gray-700 rounded-lg hover:border-gray-600 transition-colors"
          >
            Show Playlist ({playlist.length} tracks)
          </button>
        )}
      </div>

      {/* Audio Element */}
      <audio
        ref={audioRef}
        onLoadedMetadata={handleLoadedMetadata}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        onError={handleError}
        preload="metadata"
      />
    </div>
  )
}

export default MUSICPLERAY