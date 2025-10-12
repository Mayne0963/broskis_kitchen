// Metadata is handled by the root layout.tsx using the default template
// This page uses the "Broski's Music" template

"use client"

import React, { useState, useEffect } from "react"
import type { Metadata } from "next"
import { useAudioUnlock } from "@/hooks/useAudioUnlock"
import { AudioUnlockOverlay } from "@/components/music/AudioUnlockOverlay"
import dynamic from 'next/dynamic';

const GlobalMusicPlayer = dynamic(() => import('@/components/music/GlobalMusicPlayer'), {
  ssr: false,
  loading: () => <div className="animate-pulse bg-gray-800 rounded-lg h-96 flex items-center justify-center">
    <div className="text-gray-400">Loading music player...</div>
  </div>
});
import { MusicErrorBoundary } from "@/components/music/MusicErrorBoundary"
import { useMusicStore } from "@/store/useMusicStore"
import { useGlobalAudio } from "@/providers/GlobalAudioProvider"
import { initAnalytics } from "@/lib/analytics"

// Note: Metadata export not needed as this is a client component
// Metadata is handled by the layout.tsx file

const MusicPage = () => {
  console.log('🎵 MUSIC PAGE: Component is rendering! Timestamp:', Date.now());
  console.log('🎵 MUSIC PAGE: Component is rendering!');
  const { unlocked, needsUnlock, unlock, setAudioRef } = useAudioUnlock()
  const { loadAllMusicData, tracks, playlists, isLoading, error, clearState } = useMusicStore()
  
  // Safely get global audio context
  let globalAudio = null;
  try {
    globalAudio = useGlobalAudio();
  } catch (error) {
    console.warn('🎵 MUSIC PAGE: GlobalAudioProvider not available', error);
  }
  
  const [showUnlockOverlay, setShowUnlockOverlay] = useState(false)
  
  console.log('🎵 MUSIC PAGE: Current state - tracks:', tracks?.length, 'playlists:', playlists?.length, 'isLoading:', isLoading);

  // Initialize analytics and clear old state on mount
  useEffect(() => {
    console.log('🎵 MUSIC PAGE: Initializing analytics and clearing state...');
    initAnalytics();
    clearState();
  }, []);

  // Load tracks and playlists from JSON when component mounts
  useEffect(() => {
    const loadMusicData = async () => {
      console.log('🎵 MUSIC PAGE: About to call loadAllMusicData...');
      console.log('🎵 MUSIC PAGE: loadAllMusicData function:', typeof loadAllMusicData);
      console.log('🎵 MUSIC PAGE: loadAllMusicData function reference:', loadAllMusicData);
      try {
        console.log('🎵 MUSIC PAGE: Calling loadAllMusicData...');
        await loadAllMusicData();
        console.log('🎵 MUSIC PAGE: Successfully loaded all music data');
      } catch (error) {
        console.error('🎵 MUSIC PAGE: Failed to load music data:', error);
        console.error('🎵 MUSIC PAGE: Error stack:', error instanceof Error ? error.stack : 'No stack trace');
      }
    };
    
    console.log('🎵 MUSIC PAGE: useEffect triggered, about to call loadMusicData');
    loadMusicData();
  }, [loadAllMusicData]);

  // Validate tracks after loading
  useEffect(() => {
    if (!Array.isArray(tracks) || tracks.length === 0) {
      console.warn("No tracks loaded");
      return;
    }
    
    // Validate each track has required audio source
    const validTracks = tracks.filter(track => track.src_mp3);
    if (validTracks.length !== tracks.length) {
      console.warn(`${tracks.length - validTracks.length} tracks missing audio source`);
    }
    
    console.log(`✅ Validated ${validTracks.length} tracks with audio sources`);
  }, [tracks]);

  // Show unlock overlay for iOS devices that need unlock
  useEffect(() => {
    if (needsUnlock) {
      setShowUnlockOverlay(true)
    }
  }, [needsUnlock])

  const handleUnlock = async () => {
    const success = await unlock()
    if (success) {
      setShowUnlockOverlay(false)
    }
    return success
  }

  const handleRetry = async () => {
    await loadAllMusicData();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800">
      {/* Hero Section */}
      <div className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="absolute inset-0 bg-gradient-to-r from-gold-foil/10 to-amber-500/10" />
        <div className="relative max-w-7xl mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6">
            Broski's Music
          </h1>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Immerse yourself in our curated collection of royalty-free music, perfectly crafted to enhance your dining experience.
          </p>
        </div>
      </div>

      {/* Music Player Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-white mb-4">Music Player</h2>
            <p className="text-gray-300 max-w-2xl mx-auto">
              Choose from our curated playlists featuring local tracks: {playlists.map(p => p.title).join(', ')}.
              All music is sourced locally for the best listening experience.
            </p>
          </div>
          
          {/* Enhanced Music Player */}
          {<MusicErrorBoundary>
              <GlobalMusicPlayer 
                variant="full" 
                showPlaylist={true}
                className="w-full"
              />
            </MusicErrorBoundary> 
          }
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-xl p-6 border border-blue-500/30">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">&#127925;</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Chill Lofi</h3>
              <p className="text-gray-300 text-sm">
                Relaxing and ambient tracks perfect for unwinding and creating a peaceful atmosphere.
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-[var(--color-harvest-gold)]/20 to-[var(--color-harvest-gold)]/20 rounded-xl p-6 border border-[var(--color-harvest-gold)]/30">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-[var(--color-harvest-gold)] to-[var(--color-harvest-gold)] rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">&#127928;</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Broski Mix</h3>
              <p className="text-gray-300 text-sm">
                Energetic and motivating tracks to boost your mood and create an uplifting environment.
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500/20 to-teal-600/20 rounded-xl p-6 border border-green-500/30">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">&#127927;</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Acoustic Guitar</h3>
              <p className="text-gray-300 text-sm">
                Smooth acoustic melodies for an elegant and refined dining experience.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Music Info Section */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl border border-gray-700 p-8">
          <h2 className="text-2xl font-bold text-white mb-4">About Our Music</h2>
          <div className="space-y-4 text-gray-300">
            <p>
              All music featured in our player is royalty-free and carefully selected to enhance your 
              dining experience at Broski's Kitchen. Our curated playlists are designed to complement 
              different moods and moments throughout your visit.
            </p>
            <p>
              Whether you're looking to relax with our Chill Lofi playlist, energize with our Broski Mix, 
              or enjoy acoustic guitar melodies, our music player offers the perfect soundtrack for 
              your culinary journey. All tracks are served locally for optimal performance.
            </p>
            <div className="grid md:grid-cols-2 gap-6 mt-6">
              <div>
                <h4 className="font-semibold text-white mb-2">Features:</h4>
                <ul className="space-y-1 text-sm">
                  <li>• High-quality royalty-free music</li>
                  <li>• Local audio file serving</li>
                  <li>• Auto-generated playlists</li>
                  <li>• Shuffle and repeat modes</li>
                  <li>• Volume control</li>
                  <li>• Favorite tracks system</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-2">Music Genres:</h4>
                <ul className="space-y-1 text-sm">
                  <li>• Ambient & Lofi</li>
                  <li>• Acoustic Guitar</li>
                  <li>• Electronic & Corporate</li>
                  <li>• Chill & Relaxation</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* iOS Audio Unlock Overlay */}
      {showUnlockOverlay && (
        <AudioUnlockOverlay
          onUnlock={handleUnlock}
          onHide={() => setShowUnlockOverlay(false)}
        />
      )}
    </div>
  )
}

export default MusicPage