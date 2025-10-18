"use client";

import React from "react"
import { useSafeGlobalAudio } from "../../providers/GlobalAudioProvider"

const MusicPlayer = () => {
  const globalAudio = useSafeGlobalAudio()

  // If GlobalAudioProvider is not available, return null (hidden)
  if (!globalAudio) {
    return null
  }

  // The GlobalAudioProvider handles all the music functionality
  // This component is now just a placeholder that ensures the audio system is available
  // The actual music controls are handled by other components like MiniNowPlaying
  
  return (
    <div className="hidden">
      {/* Hidden music player - actual controls are in MiniNowPlaying and other components */}
      <div className="sr-only">Music player active</div>
    </div>
  )
}

export default MusicPlayer