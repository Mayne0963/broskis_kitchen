"use client"

import React, { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Zap, Crown, Sparkles } from 'lucide-react'
import confetti from 'canvas-confetti'

interface SpinWheelModalProps {
  isOpen: boolean
  onClose: () => void
  onSpin: () => Promise<{ points: number; isJackpot: boolean } | null>
  currentPoints: number
  spinCost: number
}

interface WheelSegment {
  points: number
  color: string
  probability: number
  isJackpot?: boolean
}

const WHEEL_SEGMENTS: WheelSegment[] = [
  { points: 5, color: '#4B5563', probability: 0.4 },
  { points: 10, color: '#059669', probability: 0.25 },
  { points: 20, color: '#DC2626', probability: 0.15 },
  { points: 25, color: '#7C3AED', probability: 0.1 },
  { points: 50, color: '#EA580C', probability: 0.08 },
  { points: 100, color: '#FFD700', probability: 0.02, isJackpot: true }
]

export const SpinWheelModal: React.FC<SpinWheelModalProps> = ({
  isOpen,
  onClose,
  onSpin,
  currentPoints,
  spinCost
}) => {
  const [isSpinning, setIsSpinning] = useState(false)
  const [rotation, setRotation] = useState(0)
  const [result, setResult] = useState<{ points: number; isJackpot: boolean } | null>(null)
  const [showResult, setShowResult] = useState(false)
  const wheelRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  const segmentAngle = 360 / WHEEL_SEGMENTS.length

  useEffect(() => {
    if (result?.isJackpot) {
      // Jackpot confetti
      const duration = 3000
      const end = Date.now() + duration

      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#FFD700', '#FFA500', '#FF6347']
        })
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#FFD700', '#FFA500', '#FF6347']
        })

        if (Date.now() < end) {
          requestAnimationFrame(frame)
        }
      }
      frame()
    } else if (result) {
      // Regular win confetti
      confetti({
        particleCount: 50,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#40E0D0', '#FFD700', '#FFFFFF']
      })
    }
  }, [result])

  const handleSpin = async () => {
    if (isSpinning || currentPoints < spinCost) return

    setIsSpinning(true)
    setResult(null)
    setShowResult(false)

    try {
      // Start spinning animation
      const spins = 5 + Math.random() * 3 // 5-8 full rotations
      const finalAngle = Math.random() * 360
      const totalRotation = rotation + (spins * 360) + finalAngle
      
      setRotation(totalRotation)

      // Wait for spin animation to complete
      setTimeout(async () => {
        const spinResult = await onSpin()
        if (spinResult) {
          setResult(spinResult)
          setShowResult(true)
        }
        setIsSpinning(false)
      }, 3000)
    } catch (error) {
      console.error('Spin failed:', error)
      setIsSpinning(false)
    }
  }

  const drawWheel = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const centerX = canvas.width / 2
    const centerY = canvas.height / 2
    const radius = Math.min(centerX, centerY) - 10

    ctx.clearRect(0, 0, canvas.width, canvas.height)

    // Draw segments
    WHEEL_SEGMENTS.forEach((segment, index) => {
      const startAngle = (index * segmentAngle * Math.PI) / 180
      const endAngle = ((index + 1) * segmentAngle * Math.PI) / 180

      // Draw segment
      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.arc(centerX, centerY, radius, startAngle, endAngle)
      ctx.closePath()
      ctx.fillStyle = segment.color
      ctx.fill()
      ctx.strokeStyle = '#000'
      ctx.lineWidth = 2
      ctx.stroke()

      // Add glow effect for jackpot
      if (segment.isJackpot) {
        ctx.shadowColor = '#FFD700'
        ctx.shadowBlur = 20
        ctx.stroke()
        ctx.shadowBlur = 0
      }

      // Draw text
      const textAngle = startAngle + (endAngle - startAngle) / 2
      const textX = centerX + Math.cos(textAngle) * (radius * 0.7)
      const textY = centerY + Math.sin(textAngle) * (radius * 0.7)

      ctx.save()
      ctx.translate(textX, textY)
      ctx.rotate(textAngle + Math.PI / 2)
      ctx.fillStyle = '#FFFFFF'
      ctx.font = 'bold 16px Arial'
      ctx.textAlign = 'center'
      ctx.fillText(`${segment.points}`, 0, 0)
      
      if (segment.isJackpot) {
        ctx.fillStyle = '#FFD700'
        ctx.font = 'bold 12px Arial'
        ctx.fillText('JACKPOT!', 0, 20)
      }
      
      ctx.restore()
    })

    // Draw center circle
    ctx.beginPath()
    ctx.arc(centerX, centerY, 30, 0, 2 * Math.PI)
    ctx.fillStyle = '#000'
    ctx.fill()
    ctx.strokeStyle = '#FFD700'
    ctx.lineWidth = 3
    ctx.stroke()

    // Draw pointer
    ctx.beginPath()
    ctx.moveTo(centerX, centerY - radius - 10)
    ctx.lineTo(centerX - 15, centerY - radius + 10)
    ctx.lineTo(centerX + 15, centerY - radius + 10)
    ctx.closePath()
    ctx.fillStyle = '#FFD700'
    ctx.fill()
    ctx.strokeStyle = '#000'
    ctx.lineWidth = 2
    ctx.stroke()
  }

  useEffect(() => {
    if (isOpen) {
      drawWheel()
    }
  }, [isOpen, drawWheel])

  const closeModal = () => {
    if (!isSpinning) {
      setResult(null)
      setShowResult(false)
      onClose()
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={closeModal}
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="bg-black border border-gray-800 rounded-2xl p-8 max-w-lg w-full relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={closeModal}
              disabled={isSpinning}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Header */}
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold text-white mb-2 flex items-center justify-center gap-2">
                <Zap className="w-6 h-6 text-yellow-400" />
                Spin the Wheel
              </h2>
              <p className="text-gray-400">
                Cost: {spinCost} points • Balance: {currentPoints} points
              </p>
            </div>

            {/* Wheel */}
            <div className="relative mb-8">
              <div 
                ref={wheelRef}
                className="relative mx-auto"
                style={{ width: '300px', height: '300px' }}
              >
                <motion.canvas
                  ref={canvasRef}
                  width={300}
                  height={300}
                  className="absolute inset-0"
                  animate={{ rotate: rotation }}
                  transition={{
                    duration: isSpinning ? 3 : 0,
                    ease: isSpinning ? [0.25, 0.46, 0.45, 0.94] : "linear"
                  }}
                />
                
                {/* Jackpot Glow Effect */}
                {isSpinning && (
                  <motion.div
                    className="absolute inset-0 rounded-full"
                    animate={{
                      boxShadow: [
                        '0 0 20px rgba(255, 215, 0, 0.3)',
                        '0 0 40px rgba(255, 215, 0, 0.6)',
                        '0 0 20px rgba(255, 215, 0, 0.3)'
                      ]
                    }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                )}
              </div>
            </div>

            {/* Spin Button */}
            <div className="text-center">
              <button
                onClick={handleSpin}
                disabled={isSpinning || currentPoints < spinCost}
                className={`
                  px-8 py-3 rounded-lg font-semibold text-lg transition-all duration-300
                  ${isSpinning || currentPoints < spinCost
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-yellow-400 to-yellow-500 text-black hover:from-yellow-300 hover:to-yellow-400 hover:scale-105 shadow-lg hover:shadow-yellow-400/25'
                  }
                `}
              >
                {isSpinning ? (
                  <span className="flex items-center gap-2">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    >
                      <Zap className="w-5 h-5" />
                    </motion.div>
                    Spinning...
                  </span>
                ) : currentPoints < spinCost ? (
                  'Insufficient Points'
                ) : (
                  <span className="flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Spin Now
                  </span>
                )}
              </button>
            </div>

            {/* Result Display */}
            <AnimatePresence>
              {showResult && result && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`
                    mt-6 p-4 rounded-lg text-center
                    ${result.isJackpot 
                      ? 'bg-gradient-to-r from-yellow-400/20 to-yellow-500/20 border border-yellow-400' 
                      : 'bg-gradient-to-r from-turquoise-400/20 to-turquoise-500/20 border border-turquoise-400'
                    }
                  `}
                >
                  <div className="flex items-center justify-center gap-2 mb-2">
                    {result.isJackpot ? (
                      <Crown className="w-6 h-6 text-yellow-400" />
                    ) : (
                      <Sparkles className="w-6 h-6 text-turquoise-400" />
                    )}
                    <span className={`text-lg font-bold ${
                      result.isJackpot ? 'text-yellow-400' : 'text-turquoise-400'
                    }`}>
                      {result.isJackpot ? 'JACKPOT!' : 'You Won!'}
                    </span>
                  </div>
                  <div className="text-2xl font-bold text-white">
                    +{result.points} Points
                  </div>
                  {result.isJackpot && (
                    <div className="text-sm text-yellow-300 mt-1">
                      🎉 Incredible luck! 🎉
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default SpinWheelModal