"use client"

import React, { createContext, useState, useContext, type ReactNode } from "react"
import type { MediaPlayerContextType, Track } from "@/types"

// Create the context with a default undefined value
const MediaPlayerContext = createContext<MediaPlayerContextType | undefined>(undefined)

// Provider component
export const MediaPlayerProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false)
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null)
  const [volume, setVolumeState] = useState<number>(0.7) // Default volume 70%
  const [playlist, setPlaylist] = useState<Track[]>([])

  // Play a track
  const playTrack = (track: Track) => {
    setCurrentTrack(track)
    setIsPlaying(true)
    // Add track to playlist if not already there
    if (!playlist.some((t) => t.id === track.id)) {
      setPlaylist((current) => [...current, track])
    }
  }

  // Pause the current track
  const pauseTrack = () => {
    setIsPlaying(false)
  }

  // Play the next track in the playlist
  const nextTrack = () => {
    if (!currentTrack || playlist.length === 0) return

    const currentIndex = playlist.findIndex((track) => track.id === currentTrack.id)

    if (currentIndex === -1 || currentIndex === playlist.length - 1) {
      // If current track not in playlist or is the last track, play the first track
      playTrack(playlist[0])
    } else {
      // Play the next track
      playTrack(playlist[currentIndex + 1])
    }
  }

  // Play the previous track in the playlist
  const previousTrack = () => {
    if (!currentTrack || playlist.length === 0) return

    const currentIndex = playlist.findIndex((track) => track.id === currentTrack.id)

    if (currentIndex === -1 || currentIndex === 0) {
      // If current track not in playlist or is the first track, play the last track
      playTrack(playlist[playlist.length - 1])
    } else {
      // Play the previous track
      playTrack(playlist[currentIndex - 1])
    }
  }

  // Set the volume (0 to 1)
  const setVolume = (newVolume: number) => {
    setVolumeState(Math.max(0, Math.min(1, newVolume)))
  }

  // Set the entire playlist
  const setPlaylistTracks = (tracks: Track[]) => {
    setPlaylist(tracks)
  }

  // Add a track to the playlist
  const addToPlaylist = (track: Track) => {
    // Check if track already exists in playlist
    if (!playlist.some((t) => t.id === track.id)) {
      setPlaylist((current) => [...current, track])
    }
  }

  // Remove a track from the playlist
  const removeFromPlaylist = (id: string) => {
    setPlaylist((current) => current.filter((track) => track.id !== id))

    // If the removed track is currently playing, play the next track or stop
    if (currentTrack?.id === id) {
      const remainingTracks = playlist.filter((track) => track.id !== id)
      if (remainingTracks.length > 0) {
        nextTrack()
      } else {
        setCurrentTrack(null)
        setIsPlaying(false)
      }
    }
  }

  return (
    <MediaPlayerContext.Provider
      value={{
        isPlaying,
        currentTrack,
        volume,
        playlist,
        playTrack,
        pauseTrack,
        nextTrack,
        previousTrack,
        setVolume,
        setPlaylistTracks,
        addToPlaylist,
        removeFromPlaylist,
      }}
    >
      {children}
    </MediaPlayerContext.Provider>
  )
}

// Custom hook to use the media player context
export const useMediaPlayer = (): MediaPlayerContextType => {
  const context = useContext(MediaPlayerContext)

  if (context === undefined) {
    throw new Error("useMediaPlayer must be used within a MediaPlayerProvider")
  }

  return context
}
