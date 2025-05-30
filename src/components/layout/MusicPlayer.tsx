"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { FaPlay, FaPause, FaForward, FaBackward, FaVolumeUp, FaVolumeDown, FaRandom, FaRedoAlt } from "react-icons/fa"
import { useMediaPlayer } from "../../lib/context/MediaPlayerContext"
import type { Track } from "../../types"

const MusicPlayer = () => {
  const { isPlaying, currentTrack, playTrack, pauseTrack, nextTrack, previousTrack, volume, setVolume } =
    useMediaPlayer()
  const audioRef = useRef<HTMLAudioElement>(null)

  // Royalty-free music tracks
  const chillLofi: Track[] = [
    {
      id: "1",
      title: "Chill Lofi Beat",
      artist: "Royalty Free Music",
      url: "/music/chill-lofi-beat.mp3",
      coverImage: "/images/lofi-study-beats.jpg",
    },
    {
      id: "2",
      title: "Peaceful Piano",
      artist: "Ambient Sounds",
      url: "/music/peaceful-piano.mp3",
      coverImage: "/images/relaxing-piano.jpg",
    },
    {
      id: "3",
      title: "Jazzy Abstract",
      artist: "Creative Commons",
      url: "/music/jazzy-abstract.mp3",
      coverImage: "/images/chilled-vibes.jpg",
    },
    {
      id: "4",
      title: "Ambient Nature",
      artist: "Nature Sounds",
      url: "/music/ambient-nature.mp3",
      coverImage: "/images/relaxing-piano.jpg",
    },
    {
      id: "8",
      title: "Dreamy Synthwave",
      artist: "Retro Vibes",
      url: "/music/dreamy-synthwave.mp3",
      coverImage: "/images/chilled-vibes.jpg",
    },
    {
      id: "9",
      title: "Midnight Study Session",
      artist: "Lo-Fi Collective",
      url: "/music/midnight-study.mp3",
      coverImage: "/images/lofi-study-beats.jpg",
    },
    {
      id: "10",
      title: "Rainy Day Vibes",
      artist: "Ambient Sounds",
      url: "/music/rainy-day-vibes.mp3",
      coverImage: "/images/relaxing-piano.jpg",
    },
    {
      id: "11",
      title: "Coffee Shop Atmosphere",
      artist: "Urban Sounds",
      url: "/music/coffee-shop-atmosphere.mp3",
      coverImage: "/images/chilled-vibes.jpg",
    },
    {
      id: "12",
      title: "Sunset Meditation",
      artist: "Zen Masters",
      url: "/music/sunset-meditation.mp3",
      coverImage: "/images/relaxing-piano.jpg",
    },
  ]

  const upbeatTracks: Track[] = [
    {
      id: "5",
      title: "Uplifting Corporate",
      artist: "Royalty Free Music",
      url: "/music/uplifting-corporate.mp3",
      coverImage: "/images/lofi-study-beats.jpg",
    },
    {
      id: "6",
      title: "Smooth Jazz",
      artist: "Jazz Collective",
      url: "/music/smooth-jazz.mp3",
      coverImage: "/images/chilled-vibes.jpg",
    },
    {
      id: "7",
      title: "Electronic Future",
      artist: "Digital Beats",
      url: "/music/electronic-future.mp3",
      coverImage: "/images/lofi-study-beats.jpg",
    },
    {
      id: "13",
      title: "Funky Groove",
      artist: "Funk Masters",
      url: "/music/funky-groove.mp3",
      coverImage: "/images/chilled-vibes.jpg",
    },
    {
      id: "14",
      title: "Energetic Pop",
      artist: "Pop Collective",
      url: "/music/energetic-pop.mp3",
      coverImage: "/images/lofi-study-beats.jpg",
    },
    {
      id: "15",
      title: "Hip Hop Beats",
      artist: "Urban Rhythms",
      url: "/music/hip-hop-beats.mp3",
      coverImage: "/images/chilled-vibes.jpg",
    },
    {
      id: "16",
      title: "Dance Floor Anthem",
      artist: "Electronic Vibes",
      url: "/music/dance-floor-anthem.mp3",
      coverImage: "/images/lofi-study-beats.jpg",
    },
    {
      id: "17",
      title: "Rock Energy",
      artist: "Rock Collective",
      url: "/music/rock-energy.mp3",
      coverImage: "/images/chilled-vibes.jpg",
    },
    {
      id: "18",
      title: "Latin Fiesta",
      artist: "Tropical Sounds",
      url: "/music/latin-fiesta.mp3",
      coverImage: "/images/lofi-study-beats.jpg",
    },
  ]

  const dinnerJazz: Track[] = [
    {
      id: "19",
      title: "Smooth Dinner Jazz",
      artist: "Jazz Ensemble",
      url: "/music/smooth-dinner-jazz.mp3",
      coverImage: "/images/chilled-vibes.jpg",
    },
    {
      id: "20",
      title: "Elegant Piano Lounge",
      artist: "Piano Masters",
      url: "/music/elegant-piano-lounge.mp3",
      coverImage: "/images/relaxing-piano.jpg",
    },
    {
      id: "21",
      title: "Sophisticated Saxophone",
      artist: "Sax Collective",
      url: "/music/sophisticated-saxophone.mp3",
      coverImage: "/images/chilled-vibes.jpg",
    },
    {
      id: "22",
      title: "Vintage Swing",
      artist: "Swing Orchestra",
      url: "/music/vintage-swing.mp3",
      coverImage: "/images/lofi-study-beats.jpg",
    },
    {
      id: "23",
      title: "Bossa Nova Nights",
      artist: "Brazilian Sounds",
      url: "/music/bossa-nova-nights.mp3",
      coverImage: "/images/relaxing-piano.jpg",
    },
    {
      id: "24",
      title: "Cocktail Hour Blues",
      artist: "Blues Society",
      url: "/music/cocktail-hour-blues.mp3",
      coverImage: "/images/chilled-vibes.jpg",
    },
  ]

  const [currentPlaylist, setCurrentPlaylist] = useState(chillLofi)
  const [isShuffled, setIsShuffled] = useState(false)
  const [isRepeating, setIsRepeating] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  // Sync audio element with context state
  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(console.error)
      } else {
        audioRef.current.pause()
      }
    }
  }, [isPlaying, currentTrack])

  // Update volume when context volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])

  const handlePlayPause = () => {
    if (currentTrack) {
      isPlaying ? pauseTrack() : playTrack(currentTrack)
    } else {
      playTrack(currentPlaylist[0])
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(Number(e.target.value))
  }

  const handlePlaylistSwitch = (playlist: Track[]) => {
    setCurrentPlaylist(playlist)
    if (isPlaying) {
      pauseTrack()
    }
  }

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime)
    }
  }

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration)
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = Number(e.target.value)
    setCurrentTime(newTime)
    if (audioRef.current) {
      audioRef.current.currentTime = newTime
    }
  }

  const handleTrackEnd = () => {
    if (isRepeating) {
      if (audioRef.current) {
        audioRef.current.currentTime = 0
        audioRef.current.play().catch(console.error)
      }
    } else {
      nextTrack()
    }
  }

  const toggleShuffle = () => {
    setIsShuffled(!isShuffled)
  }

  const toggleRepeat = () => {
    setIsRepeating(!isRepeating)
  }

  const formatTime = (time: number) => {
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="fixed bottom-0 left-0 w-full bg-gradient-to-r from-[#0F0F0F] to-[#1A1A1A] border-t border-[#333333] p-4 z-50 shadow-lg">
      <div className="container mx-auto max-w-6xl">
        {/* Progress Bar */}
        {currentTrack && (
          <div className="flex items-center mb-3 text-xs text-gray-400">
            <span className="w-10 text-right font-medium">{formatTime(currentTime)}</span>
            <div className="relative flex-1 mx-3">
              <div className="h-1 bg-gray-700 rounded-full w-full"></div>
              <div 
                className="absolute top-0 left-0 h-1 bg-gradient-to-r from-gold-foil to-amber-400 rounded-full" 
                style={{ width: `${(currentTime / (duration || 1)) * 100}%` }}
              ></div>
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={currentTime}
                onChange={handleSeek}
                className="absolute top-0 left-0 w-full h-1 opacity-0 cursor-pointer"
              />
            </div>
            <span className="w-10 font-medium">{formatTime(duration)}</span>
          </div>
        )}
        
        <div className="flex flex-wrap md:flex-nowrap items-center justify-between gap-4">
          {/* Track Info */}
          <div className="flex items-center flex-1 min-w-[200px]">
            {currentTrack && currentTrack.coverImage ? (
              <div className="relative w-14 h-14 mr-4 rounded-lg overflow-hidden shadow-md group">
                <img
                  src={currentTrack.coverImage || "/placeholder.svg"}
                  alt={currentTrack.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                {isPlaying && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40">
                    <div className="flex space-x-1">
                      <span className="w-1 h-6 bg-gold-foil animate-[soundbar_1s_ease-in-out_infinite]" style={{animationDelay: '0.2s'}}></span>
                      <span className="w-1 h-4 bg-gold-foil animate-[soundbar_0.8s_ease-in-out_infinite]" style={{animationDelay: '0s'}}></span>
                      <span className="w-1 h-8 bg-gold-foil animate-[soundbar_1.2s_ease-in-out_infinite]" style={{animationDelay: '0.4s'}}></span>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="w-14 h-14 mr-4 rounded-lg bg-gray-800 flex items-center justify-center shadow-md">
                <FaPlay className="text-gray-600" size={20} />
              </div>
            )}
            <div className="min-w-0">
              <p className="text-white font-bold truncate text-base">
                {currentTrack ? currentTrack.title : "No track selected"}
              </p>
              <p className="text-gray-400 text-sm truncate">
                {currentTrack ? currentTrack.artist : ""}
              </p>
            </div>
          </div>

          {/* Main Controls */}
          <div className="flex items-center justify-center space-x-3 md:space-x-4">
            <button 
              onClick={toggleShuffle} 
              className={`text-white hover:text-gold-foil transition-colors p-2 opacity-80 hover:opacity-100 ${
                isShuffled ? 'text-gold-foil' : ''
              }`}
              aria-label="Toggle shuffle"
            >
              <FaRandom size={14} />
            </button>
            <button 
              onClick={previousTrack} 
              className="text-white hover:text-gold-foil transition-colors p-2 opacity-80 hover:opacity-100"
              aria-label="Previous track"
            >
              <FaBackward size={16} />
            </button>
            <button 
              onClick={handlePlayPause} 
              className="text-white hover:text-gold-foil transition-all p-4 bg-gradient-to-br from-gold-foil to-amber-600 hover:from-amber-500 hover:to-gold-foil rounded-full shadow-lg transform hover:scale-105 active:scale-95"
              aria-label={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <FaPause size={18} /> : <FaPlay size={18} className="ml-1" />}
            </button>
            <button 
              onClick={nextTrack} 
              className="text-white hover:text-gold-foil transition-colors p-2 opacity-80 hover:opacity-100"
              aria-label="Next track"
            >
              <FaForward size={16} />
            </button>
            <button 
              onClick={toggleRepeat} 
              className={`text-white hover:text-gold-foil transition-colors p-2 opacity-80 hover:opacity-100 ${
                isRepeating ? 'text-gold-foil' : ''
              }`}
              aria-label="Toggle repeat"
            >
              <FaRedoAlt size={14} />
            </button>
          </div>

          {/* Volume Control */}
          <div className="flex items-center space-x-2">
            <FaVolumeDown className="text-white opacity-80" size={14} />
            <div className="relative w-24 h-6 flex items-center">
              <div className="h-1 bg-gray-700 rounded-full w-full"></div>
              <div 
                className="absolute top-[10px] left-0 h-1 bg-gradient-to-r from-gold-foil to-amber-400 rounded-full" 
                style={{ width: `${volume * 100}%` }}
              ></div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={volume}
                onChange={handleVolumeChange}
                className="absolute top-0 left-0 w-full h-6 opacity-0 cursor-pointer"
                aria-label="Volume control"
              />
            </div>
            <FaVolumeUp className="text-white opacity-80" size={14} />
          </div>

          {/* Playlist Switch */}
          <div className="flex items-center space-x-2 ml-auto">
            <button
              className={`text-white text-xs px-3 py-2 rounded-full transition-all duration-300 ${
                currentPlaylist === chillLofi 
                  ? "bg-gradient-to-r from-gold-foil to-amber-500 text-black font-medium shadow-md" 
                  : "hover:text-gold-foil border border-gray-600 hover:border-gold-foil"
              }`}
              onClick={() => handlePlaylistSwitch(chillLofi)}
            >
              Chill
            </button>
            <button
              className={`text-white text-xs px-3 py-2 rounded-full transition-all duration-300 ${
                currentPlaylist === upbeatTracks 
                  ? "bg-gradient-to-r from-gold-foil to-amber-500 text-black font-medium shadow-md" 
                  : "hover:text-gold-foil border border-gray-600 hover:border-gold-foil"
              }`}
              onClick={() => handlePlaylistSwitch(upbeatTracks)}
            >
              Upbeat
            </button>
            <button
              className={`text-white text-xs px-3 py-2 rounded-full transition-all duration-300 ${
                currentPlaylist === dinnerJazz 
                  ? "bg-gradient-to-r from-gold-foil to-amber-500 text-black font-medium shadow-md" 
                  : "hover:text-gold-foil border border-gray-600 hover:border-gold-foil"
              }`}
              onClick={() => handlePlaylistSwitch(dinnerJazz)}
            >
              Jazz
            </button>
          </div>
        </div>

        {/* Audio Element */}
        {currentTrack && (
          <audio 
            ref={audioRef} 
            src={currentTrack.url} 
            onTimeUpdate={handleTimeUpdate}
            onLoadedMetadata={handleLoadedMetadata}
            onEnded={handleTrackEnd}
          />
        )}
      </div>
    </div>
  )
}

export default MusicPlayer
