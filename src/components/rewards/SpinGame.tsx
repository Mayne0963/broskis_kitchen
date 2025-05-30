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
  const [canSpin, setCanSpin] = useState(() => {
    // Check if user has already spun today
    const lastSpinDate = localStorage.getItem('lastSpinDate')
    const today = new Date().toDateString()
    return lastSpinDate !== today
  })
  const [spinAngle, setSpinAngle] = useState(0)
  const [targetAngle, setTargetAngle] = useState(0)
  const [finalPoints, setFinalPoints] = useState(0)

  // Define wheel segments with better distribution and more segments
  const segments = [10, 25, 50, 75, 100, 150, 200, 300, 15, 35, 60, 90]
  const colors = [
    "#D4AF37", // gold-foil
    "#880808", // blood-red
    "#50C878", // emerald-green
    "#7851A9", // royal-purple
    "#FF6B35", // orange
    "#4ECDC4", // teal
    "#45B7D1", // blue
    "#96CEB4", // mint
    "#FFEAA7", // yellow
    "#DDA0DD", // plum
    "#98D8C8", // seafoam
    "#F7DC6F", // light gold
  ]

  // Function to draw the wheel
  const drawWheel = (ctx: CanvasRenderingContext2D, width: number, height: number, angle: number) => {
    ctx.clearRect(0, 0, width, height)
    const centerX = width / 2
    const centerY = height / 2
    const radius = Math.min(centerX, centerY) - 20
    const segmentAngle = (2 * Math.PI) / segments.length

    // Draw segments
    for (let i = 0; i < segments.length; i++) {
      const startAngle = i * segmentAngle + (angle * Math.PI) / 180
      const endAngle = (i + 1) * segmentAngle + (angle * Math.PI) / 180

      ctx.beginPath()
      ctx.moveTo(centerX, centerY)
      ctx.arc(centerX, centerY, radius, startAngle, endAngle)
      ctx.closePath()

      ctx.fillStyle = colors[i % colors.length]
      ctx.fill()
      ctx.strokeStyle = "#000"
      ctx.lineWidth = 2
      ctx.stroke()

      // Draw text (numbers)
      ctx.save()
      ctx.translate(centerX, centerY)
      ctx.rotate(startAngle + segmentAngle / 2)
      ctx.textAlign = "center"
      ctx.textBaseline = "middle"
      ctx.fillStyle = "white"
      ctx.strokeStyle = "black"
      ctx.lineWidth = 3
      ctx.font = "bold 18px Arial"
      
      // Add text stroke for better visibility
      ctx.strokeText(segments[i].toString(), radius * 0.75, 0)
      ctx.fillText(segments[i].toString(), radius * 0.75, 0)
      ctx.restore()
    }

    // Draw outer border
    ctx.beginPath()
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI)
    ctx.strokeStyle = "#D4AF37"
    ctx.lineWidth = 4
    ctx.stroke()

    // Draw center circle
    ctx.beginPath()
    ctx.arc(centerX, centerY, 20, 0, 2 * Math.PI)
    ctx.fillStyle = "#1A1A1A"
    ctx.fill()
    ctx.strokeStyle = "#D4AF37"
    ctx.lineWidth = 3
    ctx.stroke()

    // Draw pointer (triangle pointing down)
    ctx.beginPath()
    ctx.moveTo(centerX, centerY - radius - 15)
    ctx.lineTo(centerX - 15, centerY - radius + 5)
    ctx.lineTo(centerX + 15, centerY - radius + 5)
    ctx.closePath()
    ctx.fillStyle = "#D4AF37"
    ctx.fill()
    ctx.strokeStyle = "#000"
    ctx.lineWidth = 2
    ctx.stroke()
  }

  // Function to calculate which segment the wheel lands on
  const calculateWinningSegment = (finalAngle: number): number => {
    const segmentAngle = 360 / segments.length
    // Normalize the angle to 0-360 range
    const normalizedAngle = ((finalAngle % 360) + 360) % 360
    // The pointer is at the top, pointing down into the wheel
    // We need to find which segment the pointer is pointing to
    // Add half segment angle to center the calculation on segment midpoints
    const adjustedAngle = (normalizedAngle + (segmentAngle / 2)) % 360
    const segmentIndex = Math.floor(adjustedAngle / segmentAngle) % segments.length
    return segmentIndex
  }

  // Function to handle the spinning animation
  const spinTheWheel = () => {
    if (!canSpin || isSpinning) return

    setIsSpinning(true)
    setResult(null)

    // Pre-determine the winning segment for better control
    const winningSegmentIndex = Math.floor(Math.random() * segments.length)
    const segmentAngle = 360 / segments.length
    
    // Calculate the target angle to land on the winning segment
    // We want the pointer (at top) to point to the center of the winning segment
    const targetSegmentAngle = winningSegmentIndex * segmentAngle + (segmentAngle / 2)
    
    // Add multiple full rotations for dramatic effect
    const minRotations = 4
    const maxRotations = 8
    const randomRotations = Math.random() * (maxRotations - minRotations) + minRotations
    const totalRotation = randomRotations * 360 + targetSegmentAngle
    
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
        // Use the pre-determined winning segment
        const points = segments[winningSegmentIndex]
        
        setFinalPoints(points)
        setIsSpinning(false)
        setResult(points)
        setCanSpin(false)
        
        console.log(`Wheel stopped at angle: ${newAngle}, Winning segment: ${winningSegmentIndex}, Points: ${points}`)
        
        // Verify the calculation matches
        const calculatedWinner = calculateWinningSegment(newAngle)
        console.log(`Calculated winner: ${calculatedWinner}, Expected: ${winningSegmentIndex}`)
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
      // Set daily spin cooldown (24 hours)
      const tomorrow = new Date()
      tomorrow.setDate(tomorrow.getDate() + 1)
      tomorrow.setHours(0, 0, 0, 0)
      localStorage.setItem('lastSpinDate', new Date().toDateString())
      onComplete(result)
    }
  }

  return (
    <div className="text-center">
      <div className="relative mb-6">
        <canvas ref={canvasRef} width={350} height={350} className="mx-auto border-2 border-gold-foil rounded-full" />

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
