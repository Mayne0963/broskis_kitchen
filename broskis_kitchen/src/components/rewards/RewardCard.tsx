"use client"

import type React from "react"

import { FaGift, FaLock, FaCrown, FaUtensils, FaPercent, FaStar, FaTshirt } from "react-icons/fa"
import type { Reward } from "@/types/reward"

interface RewardCardProps {
  reward: Reward
  userPoints: number
  onSelect: (reward: Reward) => void
  userTier: string
}

const RewardCard: React.FC<RewardCardProps> = ({ reward, userPoints, onSelect, userTier }) => {
  // Check if user has enough points
  const hasEnoughPoints = userPoints >= reward.pointsRequired

  // Check if user has required tier
  const hasTierAccess =
    !reward.tierRequired ||
    userTier === reward.tierRequired ||
    (reward.tierRequired === "silver" && userTier === "gold") ||
    (reward.tierRequired === "bronze" && (userTier === "silver" || userTier === "gold"))

  // Get category icon and color
  const getCategoryDetails = () => {
    switch (reward.category) {
      case "food":
        return { icon: <FaUtensils />, color: "bg-emerald-green" }
      case "discount":
        return { icon: <FaPercent />, color: "bg-citrus-orange" }
      case "experience":
        return { icon: <FaStar />, color: "bg-royal-purple" }
      case "merchandise":
        return { icon: <FaTshirt />, color: "bg-blood-red" }
      default:
        return { icon: <FaGift />, color: "bg-gold-foil" }
    }
  }

  const { icon, color } = getCategoryDetails()

  return (
    <div
      className={`bg-[#1A1A1A] rounded-lg overflow-hidden shadow-lg border ${
        hasEnoughPoints && hasTierAccess ? "border-[#333333] hover:border-gold-foil" : "border-[#333333] opacity-80"
      } transition-colors`}
    >
      <div className="h-48 bg-cover bg-center relative" style={{ backgroundImage: `url(${reward.image})` }}>
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent"></div>

        {/* Category Badge */}
        <div className="absolute top-3 left-3">
          <span className={`${color} text-white text-xs px-3 py-1 rounded-full flex items-center gap-1`}>
            {icon} {reward.categoryName}
          </span>
        </div>

        {/* Points Badge */}
        <div className="absolute bottom-3 left-3 bg-black bg-opacity-70 text-white text-sm px-3 py-1 rounded flex items-center gap-1">
          <FaGift className="text-gold-foil" /> {reward.pointsRequired} points
        </div>

        {/* Tier Badge (if required) */}
        {reward.tierRequired && (
          <div className="absolute top-3 right-3">
            <span
              className={`bg-black bg-opacity-70 text-xs px-3 py-1 rounded-full flex items-center gap-1 ${
                reward.tierRequired === "bronze"
                  ? "text-[#CD7F32]"
                  : reward.tierRequired === "silver"
                    ? "text-gray-400"
                    : "text-gold-foil"
              }`}
            >
              <FaCrown /> {reward.tierRequired.charAt(0).toUpperCase() + reward.tierRequired.slice(1)} Tier
            </span>
          </div>
        )}
      </div>

      <div className="p-5">
        <h3 className="text-xl font-bold mb-2">{reward.name}</h3>
        <p className="text-gray-400 mb-4 line-clamp-2">{reward.description}</p>

        {!hasTierAccess ? (
          <button className="btn-secondary w-full flex items-center justify-center gap-2" disabled>
            <FaLock size={12} />{" "}
            {`Requires ${reward.tierRequired?.charAt(0).toUpperCase()}${reward.tierRequired?.slice(1)} Tier`}
          </button>
        ) : hasEnoughPoints ? (
          <button className="btn-primary w-full" onClick={() => onSelect(reward)}>
            Redeem Reward
          </button>
        ) : (
          <button className="btn-outline w-full" disabled>
            {userPoints > 0 ? `${reward.pointsRequired - userPoints} more points needed` : "Earn points to redeem"}
          </button>
        )}
      </div>
    </div>
  )
}

export default RewardCard
