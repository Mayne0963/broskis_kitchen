"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { FaPlay, FaPause, FaVolumeUp, FaVolumeDown, FaRadio, FaSignal } from "react-icons/fa"

interface RadioStation {
  id: string
  name: string
  genre: string
  url: string
  description: string
  location: string
  isLive: boolean
}

const RadioStreaming = () => {
  const audioRef = useRef<HTMLAudioElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentStation, setCurrentStation] = useState<RadioStation | null>(null)
  const [volume, setVolume] = useState(0.7)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Curated radio stations for restaurant atmosphere
  const radioStations: RadioStation[] = [
    {
      id: "jazz-cafe",
      name: "Jazz Café Radio",
      genre: "Jazz",
      url: "https://streaming.live365.com/a16077", // Example jazz stream
      description: "Smooth jazz perfect for dining",
      location: "New York",
      isLive: true,
    },
    {
      id: "lounge-fm",
      name: "Lounge FM",
      genre: "Lounge",
      url: "https://streaming.live365.com/a05765", // Example lounge stream
      description: "Sophisticated lounge music",
      location: "Los Angeles",
      isLive: true,
    },
    {
      id: "chill-vibes",
      name: "Chill Vibes Radio",
      genre: "Chill",
      url: "https://streaming.live365.com/a89432", // Example chill stream
      description: "Relaxing background music",
      location: "San Francisco",
      isLive: true,
    },
    {
      id: "soul-kitchen",
      name: "Soul Kitchen",
      genre: "Soul/R&B",
      url: "https://streaming.live365.com/a12345", // Example soul stream
      description: "Classic soul and R&B hits",
      location: "Detroit",
      isLive: true,
    },
    {
      id: "bossa-nova",
      name: "Bossa Nova Café",
      genre: "Bossa Nova",
      url: "https://streaming.live365.com/a67890", // Example bossa nova stream
      description: "Brazilian bossa nova classics",
      location: "Rio de Janeiro",
      isLive: true,
    },
    {
      id: "ambient-space",
      name: "Ambient Space",
      genre: "Ambient",
      url: "https://streaming.live365.com/a54321", // Example ambient stream
      description: "Atmospheric ambient soundscapes",
      location: "Global",
      isLive: true,
    },
  ]

  // Update volume when context volume changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume
    }
  }, [volume])

  const handleStationSelect = async (station: RadioStation) => {
    setError(null)
    setIsLoading(true)
    
    try {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = station.url
        setCurrentStation(station)
        
        // Wait for the audio to load
        await new Promise((resolve, reject) => {
          if (!audioRef.current) return reject(new Error('Audio element not found'))
          
          const handleCanPlay = () => {
            audioRef.current?.removeEventListener('canplay', handleCanPlay)
            audioRef.current?.removeEventListener('error', handleError)
            resolve(true)
          }
          
          const handleError = () => {
            audioRef.current?.removeEventListener('canplay', handleCanPlay)
            audioRef.current?.removeEventListener('error', handleError)
            reject(new Error('Failed to load radio stream'))
          }
          
          audioRef.current.addEventListener('canplay', handleCanPlay)
          audioRef.current.addEventListener('error', handleError)
          audioRef.current.load()
        })
        
        await audioRef.current.play()
        setIsPlaying(true)
      }
    } catch (err) {
      console.error('Error playing radio station:', err)
      setError('Failed to connect to radio station. Please try another station.')
      setIsPlaying(false)
    } finally {
      setIsLoading(false)
    }
  }

  const handlePlayPause = async () => {
    if (!currentStation || !audioRef.current) return
    
    try {
      if (isPlaying) {
        audioRef.current.pause()
        setIsPlaying(false)
      } else {
        await audioRef.current.play()
        setIsPlaying(true)
      }
    } catch (err) {
      console.error('Error toggling playback:', err)
      setError('Playback error occurred')
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = Number(e.target.value)
    setVolume(newVolume)
    if (audioRef.current) {
      audioRef.current.volume = newVolume
    }
  }

  const handleError = () => {
    setError('Connection lost. Please try reconnecting.')
    setIsPlaying(false)
  }

  return (
    <div className="bg-gradient-to-br from-gray-900 to-black p-6 rounded-xl border border-gray-700 shadow-2xl">
      <div className="flex items-center mb-6">
        <FaRadio className="text-gold-foil mr-3" size={24} />
        <h2 className="text-2xl font-bold text-white">Live Radio Streaming</h2>
        {currentStation?.isLive && (
          <div className="ml-3 flex items-center">
            <FaSignal className="text-red-500 animate-pulse mr-1" size={12} />
            <span className="text-red-500 text-xs font-medium">LIVE</span>
          </div>
        )}
      </div>

      {/* Current Station Info */}
      {currentStation && (
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-white font-bold text-lg">{currentStation.name}</h3>
              <p className="text-gray-400 text-sm">{currentStation.description}</p>
              <div className="flex items-center mt-2 text-xs text-gray-500">
                <span className="bg-gold-foil text-black px-2 py-1 rounded mr-2">
                  {currentStation.genre}
                </span>
                <span>{currentStation.location}</span>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {/* Volume Control */}
              <div className="flex items-center space-x-2">
                <FaVolumeDown className="text-white opacity-80" size={14} />
                <div className="relative w-20 h-6 flex items-center">
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
              
              {/* Play/Pause Button */}
              <button 
                onClick={handlePlayPause}
                disabled={isLoading}
                className="text-white hover:text-gold-foil transition-all p-3 bg-gradient-to-br from-gold-foil to-amber-600 hover:from-amber-500 hover:to-gold-foil rounded-full shadow-lg transform hover:scale-105 active:scale-95 disabled:opacity-50"
                aria-label={isPlaying ? "Pause" : "Play"}
              >
                {isLoading ? (
                  <div className="animate-spin w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                ) : isPlaying ? (
                  <FaPause size={16} />
                ) : (
                  <FaPlay size={16} className="ml-1" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="bg-red-900/50 border border-red-500 rounded-lg p-3 mb-4">
          <p className="text-red-300 text-sm">{error}</p>
        </div>
      )}

      {/* Station List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {radioStations.map((station) => (
          <button
            key={station.id}
            onClick={() => handleStationSelect(station)}
            disabled={isLoading}
            className={`text-left p-4 rounded-lg border transition-all duration-300 hover:scale-105 disabled:opacity-50 ${
              currentStation?.id === station.id
                ? "bg-gradient-to-br from-gold-foil/20 to-amber-500/20 border-gold-foil text-white"
                : "bg-gray-800 border-gray-600 text-gray-300 hover:border-gold-foil hover:bg-gray-700"
            }`}
          >
            <div className="flex items-center justify-between mb-2">
              <h3 className="font-bold text-sm">{station.name}</h3>
              {station.isLive && (
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-1"></div>
                  <span className="text-xs text-red-400">LIVE</span>
                </div>
              )}
            </div>
            <p className="text-xs opacity-80 mb-2">{station.description}</p>
            <div className="flex items-center justify-between">
              <span className="text-xs bg-gray-700 px-2 py-1 rounded">
                {station.genre}
              </span>
              <span className="text-xs opacity-60">{station.location}</span>
            </div>
          </button>
        ))}
      </div>

      {/* Audio Element */}
      <audio 
        ref={audioRef}
        onError={handleError}
        preload="none"
      />
    </div>
  )
}

export default RadioStreaming