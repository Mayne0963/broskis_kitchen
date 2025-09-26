"use client"

import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Utensils, 
  Percent, 
  ShoppingBag, 
  Star, 
  Lock, 
  CheckCircle,
  Crown,
  Zap
} from 'lucide-react'
import Image from 'next/image'

interface Reward {
  id: string
  name: string
  description: string
  pointsCost: number
  category: 'food' | 'discounts' | 'merchandise' | 'experiences'
  type: 'fixed_item' | 'percentage_discount' | 'merchandise' | 'experience'
  image?: string
  isActive: boolean
  tierRequired?: string
  maxCogsValue?: number
  discountPercent?: number
}

interface RewardsGridProps {
  rewards: Reward[]
  currentPoints: number
  userTier: string
  onRedeem: (rewardId: string) => void
  isLoading?: boolean
}

const CATEGORIES = [
  { id: 'food', label: 'Food', icon: Utensils, color: 'text-yellow-400' },
  { id: 'discounts', label: 'Discounts', icon: Percent, color: 'text-turquoise-400' },
  { id: 'merchandise', label: 'Merch', icon: ShoppingBag, color: 'text-purple-400' },
  { id: 'experiences', label: 'Experiences', icon: Star, color: 'text-pink-400' }
] as const

const TIER_HIERARCHY = ['bronze', 'silver', 'gold', 'platinum', 'senior', 'volunteer']

export const RewardsGrid: React.FC<RewardsGridProps> = ({
  rewards,
  currentPoints,
  userTier,
  onRedeem,
  isLoading = false
}) => {
  const [activeCategory, setActiveCategory] = useState<string>('food')

  const filteredRewards = rewards.filter(reward => 
    reward.category === activeCategory && reward.isActive
  )

  const canRedeemReward = (reward: Reward) => {
    const hasEnoughPoints = currentPoints >= reward.pointsCost
    const hasTierAccess = !reward.tierRequired || 
      TIER_HIERARCHY.indexOf(userTier.toLowerCase()) >= 
      TIER_HIERARCHY.indexOf(reward.tierRequired.toLowerCase())
    
    return hasEnoughPoints && hasTierAccess
  }

  const getRewardStatusColor = (reward: Reward) => {
    if (!reward.tierRequired || 
        TIER_HIERARCHY.indexOf(userTier.toLowerCase()) >= 
        TIER_HIERARCHY.indexOf(reward.tierRequired.toLowerCase())) {
      if (currentPoints >= reward.pointsCost) {
        return 'border-turquoise-400 bg-turquoise-400/10'
      } else {
        return 'border-gray-600 bg-gray-800/50'
      }
    } else {
      return 'border-red-600 bg-red-900/20'
    }
  }

  const getButtonState = (reward: Reward) => {
    if (!reward.tierRequired || 
        TIER_HIERARCHY.indexOf(userTier.toLowerCase()) >= 
        TIER_HIERARCHY.indexOf(reward.tierRequired.toLowerCase())) {
      if (currentPoints >= reward.pointsCost) {
        return {
          text: 'Redeem',
          className: 'bg-gradient-to-r from-turquoise-400 to-turquoise-500 text-black hover:from-turquoise-300 hover:to-turquoise-400 hover:scale-105',
          disabled: false,
          icon: <CheckCircle className="w-4 h-4" />
        }
      } else {
        return {
          text: `Need ${(reward.pointsCost - currentPoints).toLocaleString()} more`,
          className: 'bg-gray-700 text-gray-400 cursor-not-allowed',
          disabled: true,
          icon: <Zap className="w-4 h-4" />
        }
      }
    } else {
      return {
        text: `${reward.tierRequired} Required`,
        className: 'bg-red-900/50 text-red-400 cursor-not-allowed',
        disabled: true,
        icon: <Lock className="w-4 h-4" />
      }
    }
  }

  return (
    <div className="bg-black border border-gray-800 rounded-xl p-6">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">Rewards Catalog</h2>
        <p className="text-gray-400">
          Redeem your points for exclusive rewards and experiences
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-gray-800 pb-4">
        {CATEGORIES.map((category) => {
          const Icon = category.icon
          const isActive = activeCategory === category.id
          
          return (
            <button
              key={category.id}
              onClick={() => setActiveCategory(category.id)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all duration-200
                ${isActive 
                  ? 'bg-gradient-to-r from-gray-800 to-gray-700 text-white border border-gray-600' 
                  : 'text-gray-400 hover:text-white hover:bg-gray-800/50'
                }
              `}
            >
              <Icon className={`w-4 h-4 ${isActive ? category.color : 'text-gray-500'}`} />
              {category.label}
              <span className={`
                text-xs px-2 py-1 rounded-full
                ${isActive ? 'bg-gray-700 text-gray-300' : 'bg-gray-800 text-gray-500'}
              `}>
                {rewards.filter(r => r.category === category.id && r.isActive).length}
              </span>
            </button>
          )
        })}
      </div>

      {/* Rewards Grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {filteredRewards.length > 0 ? (
            filteredRewards.map((reward, index) => {
              const buttonState = getButtonState(reward)
              
              return (
                <motion.div
                  key={reward.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className={`
                    relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg p-4 border transition-all duration-200 hover:scale-105
                    ${getRewardStatusColor(reward)}
                  `}
                >
                  {/* Tier Badge */}
                  {reward.tierRequired && (
                    <div className="absolute top-2 right-2">
                      <div className="flex items-center gap-1 px-2 py-1 bg-black/50 rounded-full text-xs">
                        <Crown className="w-3 h-3 text-yellow-400" />
                        <span className="text-yellow-400">{reward.tierRequired}</span>
                      </div>
                    </div>
                  )}

                  {/* Reward Image */}
                  {reward.image ? (
                    <div className="relative w-full h-32 mb-4 rounded-lg overflow-hidden bg-gray-800">
                      <Image
                        src={reward.image}
                        alt={reward.name}
                        fill
                        className="object-cover"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-32 mb-4 rounded-lg bg-gradient-to-br from-gray-700 to-gray-800 flex items-center justify-center">
                      <div className="text-4xl text-gray-500">
                        {activeCategory === 'food' && '🍔'}
                        {activeCategory === 'discounts' && '💰'}
                        {activeCategory === 'merchandise' && '👕'}
                        {activeCategory === 'experiences' && '🎉'}
                      </div>
                    </div>
                  )}

                  {/* Reward Info */}
                  <div className="mb-4">
                    <h3 className="text-lg font-semibold text-white mb-1">
                      {reward.name}
                    </h3>
                    <p className="text-sm text-gray-400 mb-3">
                      {reward.description}
                    </p>
                    
                    {/* Points Cost */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Zap className="w-4 h-4 text-yellow-400" />
                        <span className="text-lg font-bold text-yellow-400">
                          {reward.pointsCost.toLocaleString()}
                        </span>
                        <span className="text-sm text-gray-500">points</span>
                      </div>
                      
                      {reward.discountPercent && (
                        <div className="text-sm text-turquoise-400 font-semibold">
                          {reward.discountPercent}% OFF
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Redeem Button */}
                  <button
                    onClick={() => !buttonState.disabled && onRedeem(reward.id)}
                    disabled={buttonState.disabled || isLoading}
                    className={`
                      w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-200
                      ${buttonState.className}
                    `}
                  >
                    {buttonState.icon}
                    {buttonState.text}
                  </button>
                </motion.div>
              )
            })
          ) : (
            <div className="col-span-full text-center py-12">
              <div className="text-gray-500 mb-2">
                <ShoppingBag className="w-12 h-12 mx-auto mb-4 opacity-50" />
              </div>
              <h3 className="text-lg font-semibold text-gray-400 mb-2">
                No rewards available
              </h3>
              <p className="text-gray-500">
                Check back soon for new {activeCategory} rewards!
              </p>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm rounded-xl flex items-center justify-center">
          <div className="flex items-center gap-3 text-white">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            >
              <Zap className="w-6 h-6 text-yellow-400" />
            </motion.div>
            <span>Processing redemption...</span>
          </div>
        </div>
      )}
    </div>
  )
}

export default RewardsGrid