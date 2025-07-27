"use client"

import { useEffect, useState } from 'react'
import { Star, Gift, Trophy, Clock, TrendingUp, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import PointsDisplay from './PointsDisplay'
import OffersGrid from './OffersGrid'
import TierProgress from './TierProgress'
import RedemptionHistory from './RedemptionHistory'
import { toast } from 'sonner'

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

export default function RewardsTab({ userId }: RewardsTabProps) {
  const [rewardsData, setRewardsData] = useState<RewardsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [redeeming, setRedeeming] = useState<string | null>(null)
  
  const fetchRewardsData = async () => {
    try {
      setLoading(true)
      // Fetch user rewards data and offers in parallel
      const [rewardsResponse, offersResponse] = await Promise.all([
        fetch('/api/rewards/points', { 
          cache: 'no-store',
          credentials: 'include'
        }),
        fetch('/api/rewards/offers', { 
          cache: 'no-store',
          credentials: 'include'
        })
      ])
      
      if (!rewardsResponse.ok || !offersResponse.ok) {
        throw new Error('Failed to fetch rewards data')
      }
      
      const rewardsData = await rewardsResponse.json()
      const offersData = await offersResponse.json()
      
      // Fetch redemption history
      const redemptionsResponse = await fetch('/api/rewards/offers/redemptions', {
        cache: 'no-store',
        credentials: 'include'
      })
      
      let redemptions = []
      if (redemptionsResponse.ok) {
        redemptions = await redemptionsResponse.json()
      }
      
      // Combine the data into the expected format
      const combinedData: RewardsData = {
        points: rewardsData.points || 0,
        tier: rewardsData.tier || 'Bronze',
        nextTier: rewardsData.nextTier || 'Silver',
        pointsToNextTier: rewardsData.pointsToNextTier || 0,
        totalSpent: rewardsData.totalSpent || 0,
        ordersCount: rewardsData.ordersCount || 0,
        offers: offersData.map((offer: any) => ({
          id: offer.id,
          title: offer.title,
          description: offer.description,
          pointsCost: offer.pointsCost,
          type: offer.type,
          value: offer.value || `Up to $${Math.floor(offer.pointsCost / 50)} value`,
          expiresAt: offer.validUntil ? new Date(offer.validUntil) : undefined,
          isAvailable: rewardsData.points >= offer.pointsCost && offer.isActive
        })) || [],
        redemptions: redemptions.map((redemption: any) => ({
          id: redemption.id,
          offerTitle: redemption.offerTitle,
          pointsUsed: redemption.pointsUsed,
          redeemedAt: new Date(redemption.redeemedAt),
          status: redemption.status
        })) || []
      }
      
      setRewardsData(combinedData)
    } catch (error) {
      console.error('Failed to fetch rewards data:', error)
      toast.error('Failed to load rewards data')
      // Set empty state on error
      setRewardsData({
        points: 0,
        tier: 'Bronze',
        nextTier: 'Silver',
        pointsToNextTier: 500,
        totalSpent: 0,
        ordersCount: 0,
        offers: [],
        redemptions: []
      })
    } finally {
      setLoading(false)
    }
  }
  
  useEffect(() => {
    fetchRewardsData()
  }, [userId])
  
  const handleRedeemOffer = async (offerId: string) => {
    if (!rewardsData) return
    
    setRedeeming(offerId)
    try {
      const response = await fetch('/api/rewards/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ offerId })
      })

      if (!response.ok) {
        throw new Error('Failed to redeem offer')
      }

      const result = await response.json()
      toast.success('Offer redeemed successfully!')
      
      // Refresh rewards data after successful redemption
      await fetchRewardsData()
    } catch (error) {
      console.error('Failed to redeem offer:', error)
      toast.error('Failed to redeem offer. Please try again.')
    } finally {
      setRedeeming(null)
    }
  }
  
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--color-harvest-gold)]" />
          <p className="text-gray-400">Loading rewards data...</p>
        </div>
      </div>
    )
  }
  
  if (!rewardsData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-400 mb-4">Failed to load rewards data</p>
          <Button 
             onClick={fetchRewardsData}
             className="bg-[var(--color-harvest-gold)] text-black hover:bg-[var(--color-harvest-gold)]/90"
           >
             Try Again
           </Button>
        </div>
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
          onRedeem={handleRedeemOffer}
          redeeming={redeeming}
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