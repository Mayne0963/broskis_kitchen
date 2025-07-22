"use client"

import { Star, Plus, Info } from 'lucide-react'

interface PointsDisplayProps {
  points: number
  tier: string
}

export default function PointsDisplay({ points, tier }: PointsDisplayProps) {
  const formatPoints = (points: number) => {
    return points.toLocaleString()
  }
  
  const getTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'bronze':
        return 'text-orange-400'
      case 'silver':
        return 'text-gray-300'
      case 'gold':
        return 'text-[var(--color-harvest-gold)]'
      case 'platinum':
        return 'text-purple-400'
      default:
        return 'text-white'
    }
  }
  
  return (
    <div className="bg-[var(--color-dark-charcoal)] rounded-lg p-6 border border-[var(--color-harvest-gold)]/20">
      <div className="text-center mb-6">
        <div className="flex items-center justify-center mb-4">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[var(--color-harvest-gold)] to-yellow-600 flex items-center justify-center">
              <Star className="w-10 h-10 text-white fill-current" />
            </div>
            <div className="absolute -top-2 -right-2 bg-[var(--color-harvest-gold)] text-black text-xs font-bold px-2 py-1 rounded-full">
              {tier}
            </div>
          </div>
        </div>
        
        <div className="mb-2">
          <span className="text-4xl font-bold text-white">{formatPoints(points)}</span>
          <span className="text-lg text-gray-400 ml-2">points</span>
        </div>
        
        <p className="text-gray-400 text-sm">
          You're a <span className={`font-semibold ${getTierColor(tier)}`}>{tier}</span> member
        </p>
      </div>
      
      {/* How to Earn Points */}
      <div className="space-y-4">
        <h4 className="text-lg font-semibold text-white flex items-center">
          <Plus className="w-5 h-5 mr-2 text-[var(--color-harvest-gold)]" />
          How to Earn Points
        </h4>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between py-2 px-3 bg-black/30 rounded-lg">
            <span className="text-gray-300">Every $1 spent</span>
            <span className="text-[var(--color-harvest-gold)] font-semibold">+10 points</span>
          </div>
          
          <div className="flex items-center justify-between py-2 px-3 bg-black/30 rounded-lg">
            <span className="text-gray-300">Order completion</span>
            <span className="text-[var(--color-harvest-gold)] font-semibold">+50 points</span>
          </div>
          
          <div className="flex items-center justify-between py-2 px-3 bg-black/30 rounded-lg">
            <span className="text-gray-300">Review & rating</span>
            <span className="text-[var(--color-harvest-gold)] font-semibold">+25 points</span>
          </div>
          
          <div className="flex items-center justify-between py-2 px-3 bg-black/30 rounded-lg">
            <span className="text-gray-300">Referral signup</span>
            <span className="text-[var(--color-harvest-gold)] font-semibold">+200 points</span>
          </div>
        </div>
        
        <div className="mt-4 p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
          <div className="flex items-start">
            <Info className="w-4 h-4 text-blue-400 mt-0.5 mr-2 flex-shrink-0" />
            <div className="text-sm">
              <p className="text-blue-300 font-medium mb-1">Bonus Point Events</p>
              <p className="text-blue-200/80">
                Watch for special promotions and double point days to maximize your earnings!
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}