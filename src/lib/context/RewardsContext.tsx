"use client"

import React, { createContext, useContext, useState, useEffect, useCallback } from "react"
import type { Reward, RewardHistory } from "@/types"
import { rewards as rewardsData } from "@/data/rewards-data"
import { useAuth } from "./AuthContext"

interface RewardsStatus {
  currentPoints: number
  tier: string
  nextTier: string | null
  pointsToNextTier: number
  totalPointsEarned: number
  canSpin: boolean
  nextSpinTime?: string
  pointsExpiring: number
  expiryDate?: string
  recentActivity: any[]
}

interface SpinResult {
  result: string
  pointsAwarded: number
  newBalance: number
  isJackpot: boolean
}

interface RewardsContextType {
  status: RewardsStatus | null
  rewards: Reward[]
  history: RewardHistory[]
  loading: boolean
  error: string | null
  refreshStatus: () => Promise<void>
  spinWheel: () => Promise<SpinResult | null>
  redeemReward: (rewardId: string, orderId: string, orderSubtotal: number, rewardType: string, rewardValue: number, pointsCost: number) => Promise<boolean>
}

const RewardsContext = createContext<RewardsContextType | undefined>(undefined)

export const useRewards = () => {
  const context = useContext(RewardsContext)
  if (context === undefined) {
    throw new Error("useRewards must be used within a RewardsProvider")
  }
  return context
}

interface RewardsProviderProps {
  children: React.ReactNode
}

export const RewardsProvider: React.FC<RewardsProviderProps> = ({ children }) => {
  const { user } = useAuth()
  const [status, setStatus] = useState<RewardsStatus | null>(null)
  const [rewards, setRewards] = useState<Reward[]>([])
  const [history, setHistory] = useState<RewardHistory[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load rewards status from API
  const refreshStatus = useCallback(async () => {
    if (!user) return
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/rewards/status')
      if (!response.ok) {
        throw new Error('Failed to fetch rewards status')
      }
      
      const data = await response.json()
      if (data.success) {
        setStatus(data.status)
      } else {
        throw new Error(data.error || 'Failed to load rewards status')
      }
    } catch (err) {
      console.error('Error fetching rewards status:', err)
      setError(err instanceof Error ? err.message : 'Failed to load rewards')
    } finally {
      setLoading(false)
    }
  }, [user])

  // Load rewards data on mount and when user changes
  useEffect(() => {
    if (user) {
      refreshStatus()
      setRewards(rewardsData)
    } else {
      setStatus(null)
      setRewards([])
      setHistory([])
    }
  }, [user, refreshStatus])

  // Spin wheel function
  const spinWheel = async (): Promise<SpinResult | null> => {
    if (!user) {
      setError('Must be logged in to spin')
      return null
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/rewards/spin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          idempotencyKey: `spin-${Date.now()}-${Math.random()}`
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Refresh status to get updated points
        await refreshStatus()
        return {
          result: data.result,
          pointsAwarded: data.pointsAwarded,
          newBalance: data.newBalance,
          isJackpot: data.isJackpot
        }
      } else {
        throw new Error(data.error || 'Spin failed')
      }
    } catch (err) {
      console.error('Error spinning wheel:', err)
      setError(err instanceof Error ? err.message : 'Spin failed')
      return null
    } finally {
      setLoading(false)
    }
  }

  // Redeem reward function
  const redeemReward = async (
    rewardId: string,
    orderId: string,
    orderSubtotal: number,
    rewardType: string,
    rewardValue: number,
    pointsCost: number
  ): Promise<boolean> => {
    if (!user) {
      setError('Must be logged in to redeem rewards')
      return false
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/rewards/redeem', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rewardId,
          orderId,
          orderSubtotal,
          rewardType,
          rewardValue,
          pointsCost,
          idempotencyKey: `redeem-${Date.now()}-${Math.random()}`
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Refresh status to get updated points
        await refreshStatus()
        return true
      } else {
        throw new Error(data.error || 'Redemption failed')
      }
    } catch (err) {
      console.error('Error redeeming reward:', err)
      setError(err instanceof Error ? err.message : 'Redemption failed')
      return false
    } finally {
      setLoading(false)
    }
  }

  return (
    <RewardsContext.Provider
      value={{
        status,
        rewards,
        history,
        loading,
        error,
        refreshStatus,
        spinWheel,
        redeemReward,
      }}
    >
      {children}
    </RewardsContext.Provider>
  )
}
