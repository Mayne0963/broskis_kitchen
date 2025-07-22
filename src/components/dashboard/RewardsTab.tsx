"use client"

import { useEffect, useState } from 'react'
import { Star, Gift, Trophy, Clock, TrendingUp } from 'lucide-react'
import PointsDisplay from './PointsDisplay'
import OffersGrid from './OffersGrid'
import TierProgress from './TierProgress'
import RedemptionHistory from './RedemptionHistory'

interface RewardsTabProps {
  userId: string
}

interface RewardsData {
  points: number
  tier: string
  nextTier: string
  pointsToNextTier: number
  totalSpent: number
  ordersCount: number
  offers: Offer[]
  redemptions: Redemption[]
}

interface Offer {
  id: string
  title: string
  description: string
  pointsCost: number
  type: 'discount' | 'free_item' | 'upgrade'
  value: string
  expiresAt?: Date
  isAvailable: boolean
}

interface Redemption {
  id: string
  offerTitle: string
  pointsUsed: number
  redeemedAt: Date
  status: 'used' | 'expired' | 'active'
}

// Mock data - replace with actual API calls
const mockRewardsData: RewardsData = {
  points: 1250,
  tier: 'Gold',
  nextTier: 'Platinum',
  pointsToNextTier: 750,
  totalSpent: 485.50,
  ordersCount: 23,
  offers: [
    {
      id: '1',
      title: 'Free Appetizer',
      description: 'Get any appetizer free with your next order',
      pointsCost: 500,
      type: 'free_item',
      value: 'Up to $12 value',
      isAvailable: true
    },
    {
      id: '2',
      title: '20% Off Next Order',
      description: 'Save 20% on your entire next order',
      pointsCost: 800,
      type: 'discount',
      value: '20% off',
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      isAvailable: true
    },
    {
      id: '3',
      title: 'Premium Upgrade',
      description: 'Upgrade any burger to wagyu beef',
      pointsCost: 1200,
      type: 'upgrade',
      value: 'Premium upgrade',
      isAvailable: true
    },
    {
      id: '4',
      title: 'Free Dessert',
      description: 'Choose any dessert on the house',
      pointsCost: 600,
      type: 'free_item',
      value: 'Up to $8 value',
      isAvailable: false // Not enough points
    }
  ],
  redemptions: [
    {
      id: '1',
      offerTitle: 'Free Side Dish',
      pointsUsed: 300,
      redeemedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      status: 'used'
    },
    {
      id: '2',
      offerTitle: '15% Off Order',
      pointsUsed: 600,
      redeemedAt: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000),
      status: 'used'
    }
  ]
}

export default function RewardsTab({ userId }: RewardsTabProps) {
  const [rewardsData, setRewardsData] = useState<RewardsData | null>(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    const fetchRewardsData = async () => {
      try {
        // TODO: Replace with actual API call
        // const response = await fetch(`/api/rewards/points?userId=${userId}`, { 
        //   cache: 'no-store' 
        // })
        // const data = await response.json()
        
        // Mock delay to simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000))
        setRewardsData(mockRewardsData)
      } catch (error) {
        console.error('Failed to fetch rewards data:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchRewardsData()
  }, [userId])
  
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-gray-700 rounded w-1/3"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-32 bg-gray-700 rounded"></div>
          <div className="h-32 bg-gray-700 rounded"></div>
          <div className="h-32 bg-gray-700 rounded"></div>
        </div>
        <div className="h-48 bg-gray-700 rounded"></div>
      </div>
    )
  }
  
  if (!rewardsData) {
    return (
      <div className="text-center py-8 text-gray-400">
        <Gift className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p className="text-lg">Unable to load rewards data. Please try again.</p>
      </div>
    )
  }
  
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-[var(--color-harvest-gold)] flex items-center">
            <Trophy className="w-8 h-8 mr-3" />
            Rewards & Loyalty
          </h2>
          <p className="text-gray-400 mt-2">
            Earn points with every order and unlock exclusive rewards
          </p>
        </div>
        <div className="text-right">
          <div className="text-sm text-gray-400">Member since</div>
          <div className="text-lg font-semibold text-white">{new Date().getFullYear()}</div>
        </div>
      </div>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[var(--color-dark-charcoal)] rounded-lg p-6 border border-[var(--color-harvest-gold)]/20">
          <div className="flex items-center justify-between mb-4">
            <Star className="w-8 h-8 text-[var(--color-harvest-gold)]" />
            <span className="text-2xl font-bold text-white">{rewardsData.points}</span>
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">Total Points</h3>
          <p className="text-gray-400 text-sm">Available to redeem</p>
        </div>
        
        <div className="bg-[var(--color-dark-charcoal)] rounded-lg p-6 border border-[var(--color-harvest-gold)]/20">
          <div className="flex items-center justify-between mb-4">
            <TrendingUp className="w-8 h-8 text-green-400" />
            <span className="text-2xl font-bold text-white">${rewardsData.totalSpent.toFixed(2)}</span>
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">Total Spent</h3>
          <p className="text-gray-400 text-sm">{rewardsData.ordersCount} orders</p>
        </div>
        
        <div className="bg-[var(--color-dark-charcoal)] rounded-lg p-6 border border-[var(--color-harvest-gold)]/20">
          <div className="flex items-center justify-between mb-4">
            <Trophy className="w-8 h-8 text-purple-400" />
            <span className="text-2xl font-bold text-[var(--color-harvest-gold)]">{rewardsData.tier}</span>
          </div>
          <h3 className="text-lg font-semibold text-white mb-1">Current Tier</h3>
          <p className="text-gray-400 text-sm">{rewardsData.pointsToNextTier} to {rewardsData.nextTier}</p>
        </div>
      </div>
      
      {/* Points and Tier Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <PointsDisplay 
          points={rewardsData.points}
          tier={rewardsData.tier}
        />
        <TierProgress 
          currentTier={rewardsData.tier}
          nextTier={rewardsData.nextTier}
          pointsToNext={rewardsData.pointsToNextTier}
        />
      </div>
      
      {/* Available Offers */}
      <div>
        <h3 className="text-2xl font-bold text-[var(--color-harvest-gold)] mb-6 flex items-center">
          <Gift className="w-6 h-6 mr-2" />
          Available Rewards
        </h3>
        <OffersGrid 
          offers={rewardsData.offers}
          userPoints={rewardsData.points}
          onRedeem={(offerId) => {
            console.log('Redeeming offer:', offerId)
            // TODO: Implement redemption logic
          }}
        />
      </div>
      
      {/* Redemption History */}
      <div>
        <h3 className="text-2xl font-bold text-[var(--color-harvest-gold)] mb-6 flex items-center">
          <Clock className="w-6 h-6 mr-2" />
          Redemption History
        </h3>
        <RedemptionHistory redemptions={rewardsData.redemptions} />
      </div>
    </div>
  )
}