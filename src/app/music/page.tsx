"use client"

import React from "react"
import MUSICPLERAY from "../../components/common/MUSICPLERAY"

const MusicPage = () => {
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
              Choose from our three carefully curated playlists: Chill Vibes for relaxation, 
              Upbeat Energy for motivation, and Jazz Collection for sophisticated ambiance.
            </p>
          </div>
          
          {/* Enhanced Music Player */}
          <MUSICPLERAY 
            variant="full" 
            showPlaylist={true} 
            autoPlay={false}
            defaultPlaylist="chill"
            className="w-full"
          />
        </div>
      </div>

      {/* Features Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-gradient-to-br from-blue-500/20 to-purple-600/20 rounded-xl p-6 border border-blue-500/30">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎵</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Chill Vibes</h3>
              <p className="text-gray-300 text-sm">
                Relaxing and ambient tracks perfect for unwinding and creating a peaceful atmosphere.
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-orange-500/20 to-red-600/20 rounded-xl p-6 border border-orange-500/30">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-orange-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎸</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Upbeat Energy</h3>
              <p className="text-gray-300 text-sm">
                Energetic and motivating tracks to boost your mood and create an uplifting environment.
              </p>
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-500/20 to-teal-600/20 rounded-xl p-6 border border-green-500/30">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-teal-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">🎷</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-3">Jazz Collection</h3>
              <p className="text-gray-300 text-sm">
                Smooth jazz and sophisticated melodies for an elegant and refined dining experience.
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
              Whether you're looking to relax with our Chill Vibes playlist, energize with Upbeat tracks, 
              or enjoy sophisticated Jazz melodies, our music player offers the perfect soundtrack for 
              your culinary journey.
            </p>
            <div className="grid md:grid-cols-2 gap-6 mt-6">
              <div>
                <h4 className="font-semibold text-white mb-2">Features:</h4>
                <ul className="space-y-1 text-sm">
                  <li>• High-quality royalty-free music</li>
                  <li>• Three curated playlists</li>
                  <li>• Shuffle and repeat modes</li>
                  <li>• Volume control</li>
                  <li>• Favorite tracks system</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold text-white mb-2">Music Genres:</h4>
                <ul className="space-y-1 text-sm">
                  <li>• Ambient & Lofi</li>
                  <li>• Jazz & Smooth Jazz</li>
                  <li>• Electronic & Corporate</li>
                  <li>• Acoustic & Nature Sounds</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MusicPage