"use client"

import type React from "react"
import { useState, useRef } from "react"
import { FaPlay, FaPause, FaForward, FaBackward, FaVolumeUp, FaVolumeDown } from "react-icons/fa"
import { useMediaPlayer } from "../../lib/context/MediaPlayerContext"
import type { Track } from "../../types"

const MusicPlayer = () => {
  const { isPlaying, currentTrack, playTrack, pauseTrack, nextTrack, previousTrack, volume, setVolume } =
    useMediaPlayer()
  const audioRef = useRef<HTMLAudioElement>(null)

  // Dummy track data
  const classicHipHop: Track[] = [
    {
      id: "1",
      title: "California Love",
      artist: "2Pac",
      url: "/music/tupac-california-love.mp3",
      coverImage: "/images/tupac.jpg",
    },
    {
      id: "2",
      title: "Hypnotize",
      artist: "The Notorious B.I.G.",
      url: "/music/biggie-hypnotize.mp3",
      coverImage: "/images/biggie.jpg",
    },
    {
      id: "3",
      title: "Still D.R.E.",
      artist: "Dr. Dre",
      url: "/music/dr-dre-still-dre.mp3",
      coverImage: "/images/dr-dre.jpg",
    },
    {
      id: "4",
      title: "Gin and Juice",
      artist: "Snoop Dogg",
      url: "/music/snoop-dogg-gin-and-juice.mp3",
      coverImage: "/images/snoop-dogg.jpg",
    },
  ]

  const chillBeats: Track[] = [
    {
      id: "5",
      title: "Lofi Study Beats",
      artist: "Various Artists",
      url: "/music/lofi-study-beats.mp3",
      coverImage: "/images/lofi-study-beats.jpg",
    },
    {
      id: "6",
      title: "Chilled Vibes",
      artist: "Various Artists",
      url: "/music/chilled-vibes.mp3",
      coverImage: "/images/chilled-vibes.jpg",
    },
    {
      id: "7",
      title: "Relaxing Piano",
      artist: "Various Artists",
      url: "/music/relaxing-piano.mp3",
      coverImage: "/images/relaxing-piano.jpg",
    },
  ]

  const [currentPlaylist, setCurrentPlaylist] = useState(classicHipHop)

  const handlePlayPause = () => {
    if (currentTrack) {
      isPlaying ? pauseTrack() : playTrack(currentTrack)
    } else {
      playTrack(currentPlaylist[0])
    }
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setVolume(Number(e.target.value))
    if (audioRef.current) {
      audioRef.current.volume = Number(e.target.value)
    }
  }

  const handlePlaylistSwitch = (playlist: Track[]) => {
    setCurrentPlaylist(playlist)
    if (isPlaying) {
      pauseTrack()
    }
  }

  return (
    <div className="fixed bottom-0 left-0 w-full bg-[#1A1A1A] border-t border-[#333333] p-4 z-50">
      <div className="container mx-auto flex items-center justify-between">
        {/* Track Info */}
        <div className="flex items-center">
          {currentTrack && currentTrack.coverImage && (
            <img
              src={currentTrack.coverImage || "/placeholder.svg"}
              alt={currentTrack.title}
              className="w-12 h-12 rounded object-cover mr-4"
            />
          )}
          <div>
            <p className="text-white font-bold">{currentTrack ? currentTrack.title : "No track selected"}</p>
            <p className="text-gray-400 text-sm">{currentTrack ? currentTrack.artist : ""}</p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center">
          <button onClick={previousTrack} className="text-white hover:text-gold-foil transition-colors p-2">
            <FaBackward />
          </button>
          <button onClick={handlePlayPause} className="text-white hover:text-gold-foil transition-colors p-2">
            {isPlaying ? <FaPause /> : <FaPlay />}
          </button>
          <button onClick={nextTrack} className="text-white hover:text-gold-foil transition-colors p-2">
            <FaForward />
          </button>
        </div>

        {/* Volume Control */}
        <div className="flex items-center">
          <FaVolumeDown className="text-white mr-2" />
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={volume}
            onChange={handleVolumeChange}
            className="w-24"
          />
          <FaVolumeUp className="text-white ml-2" />
        </div>

        {/* Playlist Switch */}
        <div className="flex items-center space-x-2">
          <button
            className={`text-white text-xs px-2 py-1 rounded ${
              currentPlaylist === classicHipHop ? "bg-gold-foil text-black" : "hover:text-gold-foil"
            }`}
            onClick={() => handlePlaylistSwitch(classicHipHop)}
          >
            Classic Hip Hop
          </button>
          <button
            className={`text-white text-xs px-2 py-1 rounded ${
              currentPlaylist === chillBeats ? "bg-gold-foil text-black" : "hover:text-gold-foil"
            }`}
            onClick={() => handlePlaylistSwitch(chillBeats)}
          >
            Chill Beats
          </button>
        </div>

        {/* Audio Element */}
        {currentTrack && (
          <audio ref={audioRef} src={currentTrack.url} autoPlay={isPlaying} onEnded={nextTrack} volume={volume} />
        )}
      </div>
    </div>
  )
}

export default MusicPlayer
