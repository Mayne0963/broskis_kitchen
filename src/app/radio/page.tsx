"use client"

import type React from "react"
import { FaRadio, FaMusic, FaHeadphones } from "react-icons/fa"
import RadioStreaming from "../../components/radio/RadioStreaming"
import { useAuth } from "../../lib/context/AuthContext"

const RadioPage = () => {
  const { user } = useAuth()

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 to-transparent z-10"></div>
        <div className="relative z-20 container mx-auto px-4 py-20">
          <div className="max-w-4xl">
            <div className="flex items-center mb-6">
              <FaRadio className="text-gold-foil mr-4" size={48} />
              <div>
                <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
                  Broski's Radio
                </h1>
                <p className="text-xl text-gray-300 leading-relaxed">
                  Tune into our curated selection of live radio stations, perfectly chosen to complement your dining experience.
                </p>
              </div>
            </div>
            
            {user && (
              <div className="bg-gradient-to-r from-gold-foil/20 to-amber-500/20 border border-gold-foil/30 rounded-lg p-4 mb-8">
                <p className="text-white">
                  Welcome back, <span className="font-bold text-gold-foil">{user.name}</span>! 
                  Enjoy our premium radio streaming experience.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          <div className="text-center">
            <div className="bg-gradient-to-br from-gold-foil to-amber-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaMusic className="text-black" size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Curated Stations</h3>
            <p className="text-gray-400">
              Hand-picked radio stations that perfectly match our restaurant's atmosphere and vibe.
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-gradient-to-br from-gold-foil to-amber-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaRadio className="text-black" size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">Live Streaming</h3>
            <p className="text-gray-400">
              Real-time radio streams from around the world, bringing you the latest in jazz, lounge, and chill music.
            </p>
          </div>
          
          <div className="text-center">
            <div className="bg-gradient-to-br from-gold-foil to-amber-500 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <FaHeadphones className="text-black" size={24} />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">High Quality</h3>
            <p className="text-gray-400">
              Crystal clear audio streaming to enhance your dining experience with premium sound quality.
            </p>
          </div>
        </div>

        {/* Radio Streaming Component */}
        <RadioStreaming />

        {/* Additional Info */}
        <div className="mt-12 bg-gray-800 rounded-xl p-8">
          <h2 className="text-2xl font-bold text-white mb-4">About Broski's Radio</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gold-foil mb-3">Perfect for Dining</h3>
              <p className="text-gray-300 mb-4">
                Our radio stations are carefully selected to create the perfect ambiance for your meal. 
                From smooth jazz during dinner service to upbeat lounge music for our happy hour, 
                we've got the soundtrack to your Broski's experience.
              </p>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gold-foil mb-3">Global Sounds</h3>
              <p className="text-gray-300 mb-4">
                Discover music from around the world with our international radio stations. 
                Whether you're in the mood for Brazilian bossa nova, New York jazz, or California chill vibes, 
                we bring the world's best music to your table.
              </p>
            </div>
          </div>
          
          <div className="mt-6 p-4 bg-gradient-to-r from-gold-foil/10 to-amber-500/10 border border-gold-foil/20 rounded-lg">
            <p className="text-sm text-gray-300">
              <strong className="text-gold-foil">Pro Tip:</strong> Use the volume controls to find your perfect listening level, 
              and don't forget to try different stations throughout your visit for a varied musical journey.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default RadioPage