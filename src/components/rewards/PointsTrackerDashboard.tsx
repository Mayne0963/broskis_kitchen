"use client"

import React from 'react'
import { motion } from 'framer-motion'
import { Coins, Clock, TrendingUp, Crown, Zap } from 'lucide-react'

interface PointsTrackerDashboardProps {
  currentPoints: number
  expiringPoints?: number
  expiryDate?: string
  totalEarned: number
  tier: string
  nextTier?: string
  pointsToNextTier?: number
  canSpin: boolean
  spinCost?: number
}

export const PointsTrackerDashboard: React.FC<PointsTrackerDashboardProps> = ({
  currentPoints,
  expiringPoints = 0,
  expiryDate,
  totalEarned,
  tier,
  nextTier,
  pointsToNextTier = 0,
  canSpin,
  spinCost = 0
}) => {
  const tierProgress = pointsToNextTier > 0 ? ((totalEarned % 1000) / 1000) * 100 : 100
  const spinProgress = spinCost > 0 ? Math.min((currentPoints / spinCost) * 100, 100) : 100

  const getTierColor = (tierName: string) => {
    switch (tierName.toLowerCase()) {
      case 'bronze': return 'from-amber-600 to-amber-800'
      case 'silver': return 'from-gray-400 to-gray-600'
      case 'gold': return 'from-yellow-400 to-yellow-600'
      case 'platinum': return 'from-purple-400 to-purple-600'
      case 'senior': return 'from-emerald-400 to-emerald-600'
      case 'volunteer': return 'from-blue-400 to-blue-600'
      default: return 'from-gray-400 to-gray-600'
    }
  }

  const getTierIcon = (tierName: string) => {
    switch (tierName.toLowerCase()) {
      case 'senior':
      case 'volunteer':
      case 'gold':
      case 'platinum':
        return <Crown className="w-5 h-5" />
      default:
        return <TrendingUp className="w-5 h-5" />
    }
  }

  return (
    <div className="bg-black border border-gray-800 rounded-xl p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Coins className="w-6 h-6 text-yellow-400" />
          Your Points
        </h2>
        <div className={`px-3 py-1 rounded-full bg-gradient-to-r ${getTierColor(tier)} text-white text-sm font-semibold flex items-center gap-1`}>
          {getTierIcon(tier)}
          {tier}
        </div>
      </div>

      {/* Main Points Display */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Current Balance */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg p-4 border border-gray-700"
        >
          <div className="flex items-center gap-2 mb-2">
            <Coins className="w-5 h-5 text-yellow-400" />
            <span className="text-sm text-gray-400">Available</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {currentPoints.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">points</div>
        </motion.div>

        {/* Lifetime Earned */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg p-4 border border-gray-700"
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-turquoise-400" />
            <span className="text-sm text-gray-400">Lifetime</span>
          </div>
          <div className="text-2xl font-bold text-white">
            {totalEarned.toLocaleString()}
          </div>
          <div className="text-xs text-gray-500">earned</div>
        </motion.div>

        {/* Expiring Points */}
        {expiringPoints > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-gradient-to-br from-red-900/50 to-red-800/50 rounded-lg p-4 border border-red-700/50"
          >
            <div className="flex items-center gap-2 mb-2">
              <Clock className="w-5 h-5 text-red-400" />
              <span className="text-sm text-red-300">Expiring</span>
            </div>
            <div className="text-2xl font-bold text-red-200">
              {expiringPoints.toLocaleString()}
            </div>
            <div className="text-xs text-red-400">
              {expiryDate ? `by ${expiryDate}` : 'soon'}
            </div>
          </motion.div>
        )}
      </div>

      {/* Progress Bars */}
      <div className="space-y-4">
        {/* Spin Eligibility */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400 flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Spin Eligibility
            </span>
            <span className="text-sm text-gray-300">
              {spinCost > 0 ? `${currentPoints}/${spinCost}` : 'Ready'}
            </span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${spinProgress}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className={`h-2 rounded-full ${
                canSpin 
                  ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' 
                  : 'bg-gradient-to-r from-gray-500 to-gray-600'
              }`}
            />
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {canSpin ? 'Ready to spin!' : `Need ${spinCost - currentPoints} more points`}
          </div>
        </div>

        {/* Tier Progress */}
        {nextTier && pointsToNextTier > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-400 flex items-center gap-2">
                <Crown className="w-4 h-4" />
                Progress to {nextTier}
              </span>
              <span className="text-sm text-gray-300">
                {pointsToNextTier} points needed
              </span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${tierProgress}%` }}
                transition={{ duration: 1, ease: "easeOut", delay: 0.2 }}
                className={`h-2 rounded-full bg-gradient-to-r ${getTierColor(nextTier)}`}
              />
            </div>
            <div className="text-xs text-gray-500 mt-1">
              {Math.round(tierProgress)}% complete
            </div>
          </div>
        )}
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-800">
        <div className="text-center">
          <div className="text-lg font-semibold text-turquoise-400">
            {Math.floor(totalEarned / 100)}
          </div>
          <div className="text-xs text-gray-500">Orders Rewarded</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-semibold text-yellow-400">
            ${Math.floor(currentPoints / 10)}
          </div>
          <div className="text-xs text-gray-500">Reward Value</div>
        </div>
      </div>
    </div>
  )
}

export default PointsTrackerDashboard