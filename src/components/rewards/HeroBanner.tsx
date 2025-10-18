"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { Sparkles, Crown, Zap } from 'lucide-react'

interface HeroBannerProps {
  onSpinClick: () => void
  canSpin: boolean
  nextSpinTime?: string
}

export const HeroBanner: React.FC<HeroBannerProps> = ({ 
  onSpinClick, 
  canSpin, 
  nextSpinTime 
}) => {
  return (
    <div className="relative overflow-hidden bg-black text-white">
      {/* Sacred Geometry Background */}
      <div className="absolute inset-0 opacity-5">
        <svg 
          className="w-full h-full" 
          viewBox="0 0 800 400" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Flower of Life Pattern */}
          <g stroke="#FFD700" strokeWidth="1" fill="none">
            <circle cx="400" cy="200" r="60" />
            <circle cx="348" cy="170" r="60" />
            <circle cx="452" cy="170" r="60" />
            <circle cx="348" cy="230" r="60" />
            <circle cx="452" cy="230" r="60" />
            <circle cx="400" cy="140" r="60" />
            <circle cx="400" cy="260" r="60" />
          </g>
          
          {/* Metatron's Cube Elements */}
          <g stroke="#40E0D0" strokeWidth="0.5" fill="none">
            <polygon points="200,100 250,130 250,170 200,200 150,170 150,130" />
            <polygon points="550,100 600,130 600,170 550,200 500,170 500,130" />
            <polygon points="200,300 250,330 250,370 200,400 150,370 150,330" />
            <polygon points="550,300 600,330 600,370 550,400 500,370 500,330" />
          </g>
        </svg>
      </div>

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-black via-black/90 to-black/80" />

      <div className="relative z-10 px-6 py-16 md:py-24">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main Heading */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mb-8"
          >
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-4">
              <span className="bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 bg-clip-text text-transparent">
                Broski&apos;s
              </span>
              <br />
              <span className="text-white">Rewards</span>
            </h1>
            
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="flex items-center justify-center gap-4 text-lg md:text-xl text-gray-300 mb-8"
            >
              <span className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-400" />
                Eat
              </span>
              <span className="text-yellow-400">•</span>
              <span className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-turquoise-400" />
                Earn
              </span>
              <span className="text-turquoise-400">•</span>
              <span className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-400" />
                Spin
              </span>
              <span className="text-yellow-400">•</span>
              <span className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-turquoise-400" />
                Win
              </span>
            </motion.div>
          </motion.div>

          {/* Description */}
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-lg md:text-xl text-gray-300 mb-12 max-w-2xl mx-auto leading-relaxed"
          >
            Turn every order into rewards. Spin the wheel daily, unlock exclusive perks, 
            and experience the luxury of being a Broski.
          </motion.p>

          {/* CTA Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.6 }}
          >
            <button
              onClick={onSpinClick}
              disabled={!canSpin}
              className={`
                relative group px-8 py-4 text-lg font-semibold rounded-lg transition-all duration-300
                ${canSpin 
                  ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black hover:from-yellow-300 hover:to-yellow-400 hover:scale-105 shadow-lg hover:shadow-yellow-400/25' 
                  : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              {canSpin && (
                <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-yellow-400 to-yellow-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300" />
              )}
              
              <span className="relative flex items-center gap-2">
                <Zap className={`w-5 h-5 ${canSpin ? 'text-black' : 'text-gray-500'}`} />
                {canSpin ? 'Spin the Wheel' : 'Next Spin Available Soon'}
              </span>
              
              {canSpin && (
                <motion.div
                  className="absolute -inset-1 rounded-lg bg-gradient-to-r from-yellow-400 to-yellow-500 opacity-30 blur-sm"
                  animate={{
                    scale: [1, 1.05, 1],
                    opacity: [0.3, 0.5, 0.3]
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              )}
            </button>
            
            {!canSpin && nextSpinTime && (
              <p className="text-sm text-gray-400 mt-3">
                Next spin available: {nextSpinTime}
              </p>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  )
}

export default HeroBanner