"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { FaPlay, FaLock } from "react-icons/fa"
import { useAuth } from "../../lib/context/AuthContext"
import { useRewards } from "../../lib/context/RewardsContext"
import Link from "next/link"

interface SpinGameProps {
  onComplete: (points: number) => void
}

const SpinGame: React.FC<SpinGameProps> = ({ onComplete }) => {
  const { user } = useAuth()
  const { addPoints } = useRewards()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isSpinning, setIsSpinning] = useState(false)
  const [result, setResult] = useState<number | null>(null)
  const [canSpin, setCanSpin] = useState(true)
  const [spinAngle, setSpinAngle] = useState(0)
  const [targetAngle, setTargetAngle] = useState(0)
  const [finalPoints, setFinalPoints] = useState(0)

  // Check if user is authenticated
  const isAuthenticated = !!user

  // Define wheel segments (points values between 50-200)
  const segments = [50, 75, 100, 125, 150, 175, 200, 65, 85, 110, 135, 160]
  const colors = [
    "#D4AF37", // gold-foil
    "#880808", // blood-red
    "#50C878", // emerald-green
    "#7851A9", // royal-purple
    "#D4AF37", // gold-foil
    "#880808", // blood-red
    "#50C878", // emerald-green
    "#7851A9", // royal-purple
    "#D4AF37", // gold-foil
    "#880808", // blood-red
    "#50C878", // emerald-green
    "#7851A9", // royal-purple
  ]

  // Function to draw the wheel
  const drawWheel = (ctx: CanvasRenderingContext2D, width: number, height: number, angle: number) => {
    ctx.clearRect(0, 0, width, height)
    const centerX = width / 2
    const centerY = height / 2
    const radius = Math.min(centerX, centerY) - 10
    const segmentAngle = (2 * Math.PI) / segments.length

    for (let i = 0; i < segments.length; i++) {
      const startAngle = i * segmentAngle + (angle * Math.PI) / 180
      const endAngle = (i + 1) * segmentAngle + (angle * Math.PI) / 180

      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.arc(centerX, centerY, radius, startAngle, endAngle)
      ctx.closePath()

      ctx.fillStyle = colors[i]
      ctx.fill()
      ctx.strokeStyle = "#000"
      ctx.lineWidth = 1
      ctx.stroke()

      ctx.save()
      ctx.translate(centerX, centerY)
      ctx.rotate(startAngle + segmentAngle / 2)
      ctx.textAlign = "right"
      ctx.fillStyle = "white"
      ctx.font = "bold 16px sans-serif"
      ctx.fillText(segments[i].toString(), radius - 20, 5)
      ctx.restore()
    }

    // Draw center circle
    ctx.beginPath()
    ctx.arc(centerX, centerY, 15, 0, 2 * Math.PI)
    ctx.fillStyle = "#1A1A1A"
    ctx.fill()
    ctx.strokeStyle = "#333333"
    ctx.lineWidth = 2
    ctx.stroke()

    // Draw pointer
    ctx.beginPath()
    ctx.moveTo(centerX, centerY - radius - 10)
    ctx.lineTo(centerX - 10, centerY - radius + 10)
    ctx.lineTo(centerX + 10, centerY - radius + 10)
    ctx.closePath()
    ctx.fillStyle = "#D4AF37"
    ctx.fill()
  }

  // Function to calculate which segment the wheel lands on
  const calculateWinningSegment = (finalAngle: number): number => {
    const segmentAngle = 360 / segments.length
    // Normalize the angle to 0-360 range
    const normalizedAngle = ((finalAngle % 360) + 360) % 360
    // The pointer is at the top (0 degrees), so we need to account for that
    // Since the wheel rotates clockwise, we calculate from the top
    const pointerAngle = (360 - normalizedAngle) % 360
    const segmentIndex = Math.floor(pointerAngle / segmentAngle) % segments.length
    return segmentIndex
  }

  // Function to handle claiming points
  const handleClaim = () => {
    if (result) {
      addPoints(result)
      onComplete(result)
    }
  }

  // Function to handle the spinning animation
  const spinTheWheel = () => {
    if (!canSpin || isSpinning) return

    setIsSpinning(true)
    setResult(null)

    // Generate random spin: 3-7 full rotations plus random angle
    const minRotations = 3
    const maxRotations = 7
    const randomRotations = Math.random() * (maxRotations - minRotations) + minRotations
    const randomAngle = Math.random() * 360
    const totalRotation = randomRotations * 360 + randomAngle
    
    const finalAngle = spinAngle + totalRotation
    setTargetAngle(finalAngle)

    // Animation duration
    const animationDuration = 4000 // 4 seconds

    // Easing function for smooth deceleration
    const easeOutCubic = (t: number): number => {
      return 1 - Math.pow(1 - t, 3)
    }

    let start = 0
    const startAngle = spinAngle

    const animate = (timestamp: number) => {
      if (!start) start = timestamp
      const progress = timestamp - start
      const time = Math.min(progress / animationDuration, 1)
      const easedTime = easeOutCubic(time)

      // Calculate the new angle
      const newAngle = startAngle + (totalRotation * easedTime)
      setSpinAngle(newAngle)

      // Redraw the wheel
      const canvas = canvasRef.current
      if (canvas && canvas.getContext("2d")) {
        drawWheel(canvas.getContext("2d"), canvas.width, canvas.height, newAngle)
      }

      if (time < 1) {
        requestAnimationFrame(animate)
      } else {
        // Calculate the winning segment based on final position
        const winningSegmentIndex = calculateWinningSegment(newAngle)
        const points = segments[winningSegmentIndex]
        
        setFinalPoints(points)
        setIsSpinning(false)
        setResult(points)
        setCanSpin(false)
        
        console.log(`Wheel stopped at angle: ${newAngle}, Winning segment: ${winningSegmentIndex}, Points: ${points}`)
      }
    }

    requestAnimationFrame(animate)
  }

  // Initialize wheel on component mount
  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas && canvas.getContext("2d")) {
      drawWheel(canvas.getContext("2d"), canvas.width, canvas.height, spinAngle)
    }
  }, [])



  // Show authentication required message if user is not authenticated
  if (!isAuthenticated) {
    return (
      <div className="bg-[#1A1A1A] rounded-lg p-8 text-center">
        <div className="w-16 h-16 bg-gold-foil bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
          <FaLock className="text-gold-foil text-2xl" />
        </div>
        <h3 className="text-xl font-bold mb-4">Login Required</h3>
        <p className="text-gray-300 mb-6">
          You need to be logged in to spin the wheel and earn points. Sign in to unlock this exciting feature!
        </p>
        <div className="flex gap-3 justify-center">
          <Link href="/auth/login" className="btn-outline">
            Login
          </Link>
          <Link href="/auth/signup" className="btn-primary flex items-center">
            <FaUserPlus className="mr-2" />
            Sign Up
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col items-center space-y-6 p-6">
      {/* Wheel Canvas */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={300}
          height={300}
          className="border-4 border-gold-foil rounded-full shadow-lg"
        />
        {/* Pointer */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2">
          <div className="w-0 h-0 border-l-4 border-r-4 border-b-8 border-l-transparent border-r-transparent border-b-gold-foil"></div>
        </div>
      </div>

      {/* Spin Button */}
      <div className="text-center">
        {!isSpinning && !result && (
          <button
            className="btn-primary flex items-center gap-2 text-lg px-8 py-4"
            onClick={spinTheWheel}
            disabled={!canSpin}
          >
            <FaPlay /> Spin the Wheel
          </button>
        )}

        {/* Status Messages */}
        <div className="mt-4">
          {result ? (
            <div className="text-center">
              <p className="text-2xl font-bold text-gold-foil mb-2">🎉 Congratulations! 🎉</p>
              <p className="text-lg text-white">You won {result} points!</p>
              <button className="btn-primary w-full mt-4" onClick={handleClaim}>
                Claim Points
              </button>
            </div>
          ) : (
            <p className="text-gray-300">
              {isSpinning ? (
                "Spinning the wheel..."
              ) : (
                canSpin
                  ? "Click the wheel to spin and win points!"
                  : "You've used your daily spin. Come back tomorrow for another chance to win!"
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default SpinGame
