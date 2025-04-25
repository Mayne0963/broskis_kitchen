"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { FaPlay } from "react-icons/fa"
import { useRewards } from "../../lib/context/RewardsContext"

interface SpinGameProps {
  onComplete: (points: number) => void
}

const SpinGame: React.FC<SpinGameProps> = ({ onComplete }) => {
  const { addPoints } = useRewards()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isSpinning, setIsSpinning] = useState(false)
  const [result, setResult] = useState<number | null>(null)
  const [canSpin, setCanSpin] = useState(true)
  const [spinAngle, setSpinAngle] = useState(0)
  const [targetAngle, setTargetAngle] = useState(0)
  const [finalPoints, setFinalPoints] = useState(0)

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

  // Function to handle the spinning animation
  const spinTheWheel = () => {
    if (!canSpin || isSpinning) return

    setIsSpinning(true)
    setResult(null)

    // Determine a random segment to land on
    const randomSegmentIndex = Math.floor(Math.random() * segments.length)
    const points = segments[randomSegmentIndex]
    setFinalPoints(points)

    // Calculate the exact stop angle based on the segment
    const segmentAngle = 360 / segments.length
    const targetRotation = 360 * 5 - (randomSegmentIndex * segmentAngle + segmentAngle / 2)
    setTargetAngle(targetRotation)

    // Animation duration
    const animationDuration = 5000 // 5 seconds

    // Easing function for smooth deceleration
    const easeOutCubic = (t: number): number => {
      return 1 - Math.pow(1 - t, 3)
    }

    let start = 0
    const startAngle = spinAngle

    const animate = (timestamp: number) => {
      if (!start) start = timestamp
      const progress = timestamp - start
      const time = Math.min(progress / animationDuration, 1) // Ensure time doesn't exceed 1
      const easedTime = easeOutCubic(time)

      // Calculate the new angle
      const newAngle = startAngle + (targetRotation - startAngle) * easedTime
      setSpinAngle(newAngle)

      // Redraw the wheel
      const canvas = canvasRef.current
      if (canvas && canvas.getContext("2d")) {
        drawWheel(canvas.getContext("2d"), canvas.width, canvas.height, newAngle)
      }

      if (time < 1) {
        requestAnimationFrame(animate)
      } else {
        setIsSpinning(false)
        setResult(points)
        setCanSpin(false)
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

  // Handle claiming points
  const handleClaim = () => {
    if (result !== null) {
      addPoints(result)
      onComplete(result)
    }
  }

  return (
    <div className="text-center">
      <div className="relative mb-6">
        <canvas ref={canvasRef} width={300} height={300} className="mx-auto" />

        {!isSpinning && !result && (
          <button
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-gold-foil text-black w-16 h-16 rounded-full flex items-center justify-center hover:bg-opacity-90 transition-colors"
            onClick={spinTheWheel}
            disabled={!canSpin}
          >
            <FaPlay size={20} />
          </button>
        )}
      </div>

      {result !== null ? (
        <div className="animate-fade-in">
          <h3 className="text-xl font-bold mb-2">Congratulations!</h3>
          <p className="text-gray-300 mb-4">
            You won <span className="text-gold-foil font-bold">{finalPoints} points</span>!
          </p>
          <button className="btn-primary w-full" onClick={handleClaim}>
            Claim Points
          </button>
        </div>
      ) : (
        <div>
          {isSpinning ? (
            <p className="text-gray-300">Spinning the wheel...</p>
          ) : (
            <p className="text-gray-300">
              {canSpin
                ? "Click the wheel to spin and win points!"
                : "You've used your daily spin. Come back tomorrow for another chance to win!"}
            </p>
          )}
        </div>
      )}
    </div>
  )
}

export default SpinGame
