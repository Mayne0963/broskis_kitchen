"use client"

import { Trophy, ArrowUp } from 'lucide-react'

interface TierProgressProps {
  currentTier: string
  nextTier: string
  pointsToNext: number
}

const tierData = {
  bronze: { color: 'text-orange-400', bgColor: 'bg-orange-400', points: 0 },
  silver: { color: 'text-gray-300', bgColor: 'bg-gray-300', points: 500 },
  gold: { color: 'text-[var(--color-harvest-gold)]', bgColor: 'bg-[var(--color-harvest-gold)]', points: 1500 },
  platinum: { color: 'text-purple-400', bgColor: 'bg-purple-400', points: 3000 }
}

export default function TierProgress({ currentTier, nextTier, pointsToNext }: TierProgressProps) {
  const currentTierData = tierData[currentTier.toLowerCase() as keyof typeof tierData]
  const nextTierData = tierData[nextTier.toLowerCase() as keyof typeof tierData]
  
  const currentTierPoints = currentTierData?.points || 0
  const nextTierPoints = nextTierData?.points || 0
  const totalPointsNeeded = nextTierPoints - currentTierPoints
  const currentProgress = totalPointsNeeded - pointsToNext
  const progressPercentage = Math.max(0, Math.min(100, (currentProgress / totalPointsNeeded) * 100))
  
  const getTierBenefits = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'silver':
        return ['5% off all orders', 'Birthday reward', 'Early access to menu drops']
      case 'gold':
        return ['10% off all orders', 'Free delivery', 'Exclusive menu items', 'Priority support']
      case 'platinum':
        return ['15% off all orders', 'Free premium upgrades', 'VIP events access', 'Personal chef consultation']
      default:
        return ['Points on every purchase', 'Member-only offers']
    }
  }
  
  return (
    <div className="bg-[var(--color-dark-charcoal)] rounded-lg p-6 border border-[var(--color-harvest-gold)]/20">
      <div className="mb-6">
        <h4 className="text-lg font-semibold text-white flex items-center mb-4">
          <Trophy className="w-5 h-5 mr-2 text-[var(--color-harvest-gold)]" />
          Tier Progress
        </h4>
        
        {/* Current and Next Tier Display */}
        <div className="flex items-center justify-between mb-4">
          <div className="text-center">
            <div className={`text-2xl font-bold ${currentTierData?.color || 'text-white'} mb-1`}>
              {currentTier}
            </div>
            <div className="text-sm text-gray-400">Current</div>
          </div>
          
          <div className="flex-1 mx-6">
            <div className="relative">
              <div className="w-full bg-gray-700 rounded-full h-3">
                <div 
                  className={`h-3 rounded-full transition-all duration-500 ${nextTierData?.bgColor || 'bg-gray-400'}`}
                  style={{ width: `${progressPercentage}%` }}
                ></div>
              </div>
              <div className="absolute -top-8 left-1/2 transform -translate-x-1/2">
                <ArrowUp className="w-4 h-4 text-[var(--color-harvest-gold)]" />
              </div>
            </div>
            <div className="text-center mt-2 text-sm text-gray-400">
              {pointsToNext} points to go
            </div>
          </div>
          
          <div className="text-center">
            <div className={`text-2xl font-bold ${nextTierData?.color || 'text-white'} mb-1`}>
              {nextTier}
            </div>
            <div className="text-sm text-gray-400">Next</div>
          </div>
        </div>
        
        {/* Progress Stats */}
        <div className="text-center mb-6">
          <div className="text-sm text-gray-400 mb-1">
            Progress: {currentProgress.toLocaleString()} / {totalPointsNeeded.toLocaleString()} points
          </div>
          <div className="text-lg font-semibold text-white">
            {Math.round(progressPercentage)}% Complete
          </div>
        </div>
      </div>
      
      {/* Next Tier Benefits */}
      <div>
        <h5 className="text-md font-semibold text-white mb-3">
          Unlock with <span className={nextTierData?.color || 'text-white'}>{nextTier}</span>:
        </h5>
        
        <div className="space-y-2">
          {getTierBenefits(nextTier).map((benefit, index) => (
            <div key={index} className="flex items-center py-2 px-3 bg-black/30 rounded-lg">
              <div className="w-2 h-2 rounded-full bg-[var(--color-harvest-gold)] mr-3 flex-shrink-0"></div>
              <span className="text-gray-300 text-sm">{benefit}</span>
            </div>
          ))}
        </div>
        
        {pointsToNext <= 100 && (
          <div className="mt-4 p-3 bg-gold-foil/20 border border-gold-foil/30 rounded-lg">
            <div className="text-sm">
              <p className="text-green-300 font-medium mb-1">Almost there!</p>
              <p className="text-green-200/80">
                You're just {pointsToNext} points away from {nextTier} tier. 
                Place your next order to unlock these amazing benefits!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}