"use client"

import { useEffect, useState, useMemo } from 'react'
import { useAuth } from '@/lib/context/AuthContext'
import { useRewards } from '@/lib/context/RewardsContext'
import { getUserRewards } from '@/lib/services/rewardsService'
import { Reward } from '@/lib/services/rewardsService'
import { collection, getDocs } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { Loader2 } from 'lucide-react'
import { HeroBanner } from '@/components/rewards/HeroBanner'
import { PointsTrackerDashboard } from '@/components/rewards/PointsTrackerDashboard'
import { SpinWheelModal } from '@/components/rewards/SpinWheelModal'
import { RewardsGrid } from '@/components/rewards/RewardsGrid'
import { CommunitySection } from '@/components/rewards/CommunitySection'

// Check if we're in development mode
const isDevelopment = process.env.NODE_ENV === 'development'

export default function RewardsPage() {
  const { user } = useAuth()
  const { status, refreshStatus, spinWheel, redeemReward } = useRewards()
  const [rewards, setRewards] = useState<Reward[]>([])
  const [loading, setLoading] = useState(true)
  const [showSpinModal, setShowSpinModal] = useState(false)
  const [isSpinning, setIsSpinning] = useState(false)
  const [guestMode, setGuestMode] = useState(false)

  // Calculate derived values using useMemo to ensure proper initialization
  const canSpin = useMemo(() => {
    if (!status?.nextSpinTime) return true
    return new Date(status.nextSpinTime) <= new Date()
  }, [status?.nextSpinTime])

  const userTier = useMemo(() => {
    return status?.tier || 'bronze'
  }, [status?.tier])

  // Mock data for community features
  const mockEvents = [
    {
      id: '1',
      type: 'birthday' as const,
      title: 'Birthday Celebration',
      description: 'Claim your special birthday spin!',
      date: 'Today',
      reward: '50 bonus points',
      isActive: true
    }
  ]

  const mockAchievements = [
    {
      id: '1',
      name: 'First Order',
      description: 'Complete your first order',
      icon: '🎯',
      tier: 'Bronze',
      isUnlocked: true,
      unlockedAt: '2024-01-15'
    },
    {
      id: '2',
      name: 'Loyal Customer',
      description: 'Place 10 orders',
      icon: '❤️',
      tier: 'Silver',
      progress: 7,
      maxProgress: 10,
      isUnlocked: false
    }
  ]

  useEffect(() => {
    const loadData = async () => {
      try {
        // In development mode, allow guest access
        if (isDevelopment && !user) {
          setGuestMode(true)
          // Load rewards catalog for guest users
          const rewardsSnapshot = await getDocs(collection(db, 'rewards'))
          const rewardsData = rewardsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Reward[]
          setRewards(rewardsData)
          setLoading(false)
          return
        }
        
        // For authenticated users or production mode
        if (user) {
          setGuestMode(false)
          // Load user rewards status
          await refreshStatus()
          
          // Load rewards catalog
          const rewardsSnapshot = await getDocs(collection(db, 'rewards'))
          const rewardsData = rewardsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          })) as Reward[]
          
          setRewards(rewardsData)
        }
      } catch (error) {
        console.error('Error loading rewards data:', error)
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [user, refreshStatus])

  const handleSpinWheel = async () => {
    if (isSpinning) return
    
    // In development mode, allow guest users to spin
    if (isDevelopment && guestMode) {
      setIsSpinning(true)
      try {
        // Make direct API call for guest users
        const response = await fetch('/api/rewards/spin', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
        })
        
        if (response.ok) {
          const result = await response.json()
          console.log('Guest spin result:', result)
          // Show success message or update UI as needed
        }
      } catch (error) {
        console.error('Error spinning wheel (guest mode):', error)
      } finally {
        setIsSpinning(false)
        setShowSpinModal(false)
      }
      return
    }
    
    // For authenticated users
    if (!user) return
    
    setIsSpinning(true)
    try {
      await spinWheel()
      await refreshStatus()
    } catch (error) {
      console.error('Error spinning wheel:', error)
    } finally {
      setIsSpinning(false)
      setShowSpinModal(false)
    }
  }

  const handleRedeemReward = async (rewardId: string) => {
    // In development mode, allow guest users to redeem
    if (isDevelopment && guestMode) {
      try {
        // Make direct API call for guest users
        const response = await fetch('/api/rewards/redeem', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ rewardId })
        })
        
        if (response.ok) {
          const result = await response.json()
          console.log('Guest redeem result:', result)
          // Show success message or update UI as needed
        }
      } catch (error) {
        console.error('Error redeeming reward (guest mode):', error)
      }
      return
    }
    
    // For authenticated users
    if (!user) return
    
    try {
      await redeemReward(rewardId)
      await refreshStatus()
    } catch (error) {
      console.error('Error redeeming reward:', error)
    }
  }

  const handleClaimBirthdaySpin = () => {
    setShowSpinModal(true)
  }

  const handleNominateAchievement = (achievementId: string) => {
    console.log('Nominating achievement:', achievementId)
    // TODO: Implement achievement nomination
  }

  // Only require authentication in production mode
  if (!user && !isDevelopment) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-4">Please sign in to view rewards</h1>
          <p className="text-gray-400">You need to be logged in to access the rewards program.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-turquoise-400" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-black">
      {/* Sacred Geometry Background Pattern */}
      <div className="fixed inset-0 opacity-5 pointer-events-none">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23FFD700' fill-opacity='0.1'%3E%3Cpath d='M30 30l15-15v30l-15-15zm0 0l-15 15h30l-15-15z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }} />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8 space-y-8">
        {/* Development Mode Notice */}
        {isDevelopment && guestMode && (
          <div className="bg-yellow-900/20 border border-yellow-500/30 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
              <h3 className="text-yellow-400 font-semibold">Development Mode - Guest Access</h3>
            </div>
            <p className="text-yellow-300/80 text-sm mt-1">
              You're viewing the rewards page in guest mode. API calls will work with mock authentication.
            </p>
          </div>
        )}

        {/* Hero Banner */}
        <HeroBanner 
          onSpinClick={() => setShowSpinModal(true)}
          canSpin={canSpin}
          nextSpinTime={status?.nextSpinTime}
        />

        {/* Points Tracker Dashboard */}
        <PointsTrackerDashboard 
          currentPoints={status?.currentPoints || 0}
          expiringPoints={status?.expiringPoints || 0}
          expiryDate={status?.expiryDate}
          tier={userTier}
          nextSpinTime={status?.nextSpinTime}
        />

        {/* Rewards Grid */}
        <RewardsGrid 
          rewards={rewards}
          userPoints={status?.currentPoints || 0}
          userTier={userTier}
          onRedeemReward={handleRedeemReward}
        />

        {/* Community Section */}
        <CommunitySection 
          userTier={userTier}
          upcomingEvents={mockEvents}
          achievements={mockAchievements}
          onClaimBirthdaySpin={handleClaimBirthdaySpin}
          onNominateAchievement={handleNominateAchievement}
        />
      </div>

      {/* Spin Wheel Modal */}
      {showSpinModal && (
        <SpinWheelModal 
          isOpen={showSpinModal}
          onClose={() => setShowSpinModal(false)}
          onSpin={handleSpinWheel}
          isSpinning={isSpinning}
          userPoints={status?.currentPoints || 0}
          userTier={userTier}
        />
      )}
    </div>
  )
}
