"use client"

import type React from "react"

interface PointsTrackerProps {
  currentPoints: number
  nextTierPoints: number
  nextTierName: string
}

const PointsTracker: React.FC<PointsTrackerProps> = ({ currentPoints, nextTierPoints, nextTierName }) => {
  // Calculate percentage progress
  const progressPercentage = Math.min((currentPoints / nextTierPoints) * 100, 100)
  const pointsNeeded = nextTierPoints - currentPoints

  return (
    <div>
      <div className="flex justify-between text-sm mb-1">
        <span className="text-gray-400">Progress to {nextTierName}</span>
        <span className="text-gray-300">
          {currentPoints}/{nextTierPoints} points
        </span>
      </div>

      <div className="w-full h-3 bg-[#333333] rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-gold-foil to-blood-red transition-all duration-300"
          style={{ width: `${progressPercentage}%` }}
        ></div>
      </div>

      <p className="text-sm text-gray-400 mt-1">
        {pointsNeeded > 0
          ? `${pointsNeeded} more points needed to reach ${nextTierName} tier`
          : `You've reached ${nextTierName} tier!`}
      </p>
    </div>
  )
}

export default PointsTracker
