"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import type { Reward, RewardHistory } from "@/types"
import { rewards as rewardsData } from "@/data/rewards-data"

interface RewardsContextType {
  points: number
  tier: string
  rewards: Reward[]
  history: RewardHistory[]
  addPoints: (amount: number) => void
  redeemReward: (reward: Reward) => boolean
  spinWheel: () => number
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
  const [points, setPoints] = useState(0)
  const [tier, setTier] = useState("Bronze")
  const [rewards, setRewards] = useState<Reward[]>([])
  const [history, setHistory] = useState<RewardHistory[]>([])

  // Load rewards data from localStorage on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedPoints = localStorage.getItem("rewardsPoints")
      const savedTier = localStorage.getItem("rewardsTier")
      const savedHistory = localStorage.getItem("rewardsHistory")

      if (savedPoints) setPoints(Number.parseInt(savedPoints, 10))
      if (savedTier) setTier(savedTier)
      if (savedHistory) setHistory(JSON.parse(savedHistory))

      // Load static rewards data
      setRewards(rewardsData)
    }
  }, [])

  // Update localStorage when state changes
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.setItem("rewardsPoints", points.toString())
      localStorage.setItem("rewardsTier", tier)
      localStorage.setItem("rewardsHistory", JSON.stringify(history))
    }
  }, [points, tier, history])

  // Update tier based on points
  useEffect(() => {
    if (points >= 1000) {
      setTier("Gold")
    } else if (points >= 500) {
      setTier("Silver")
    } else {
      setTier("Bronze")
    }
  }, [points])

  const addPoints = (amount: number) => {
    setPoints((prevPoints) => prevPoints + amount)

    // Add to history
    const newHistoryItem: RewardHistory = {
      id: `history-${Date.now()}`,
      date: new Date().toISOString(),
      action: "earned",
      points: amount,
    }

    setHistory((prevHistory) => [newHistoryItem, ...prevHistory])
  }

  const redeemReward = (reward: Reward): boolean => {
    if (points >= reward.pointsRequired) {
      setPoints((prevPoints) => prevPoints - reward.pointsRequired)

      // Add to history
      const newHistoryItem: RewardHistory = {
        id: `history-${Date.now()}`,
        date: new Date().toISOString(),
        action: "redeemed",
        points: -reward.pointsRequired,
      }

      setHistory((prevHistory) => [newHistoryItem, ...prevHistory])
      return true
    }
    return false
  }

  const spinWheel = (): number => {
    // Generate a random number of points between 10 and 100
    const randomPoints = Math.floor(Math.random() * 91) + 10
    addPoints(randomPoints)
    return randomPoints
  }

  return (
    <RewardsContext.Provider
      value={{
        points,
        tier,
        rewards,
        history,
        addPoints,
        redeemReward,
        spinWheel,
      }}
    >
      {children}
    </RewardsContext.Provider>
  )
}
