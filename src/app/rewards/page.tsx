"use client"

import { useState } from "react"
import Image from "next/image"
import { useAuth } from "../../lib/context/AuthContext"
import { useRewards } from "../../lib/context/RewardsContext"
import { rewards } from "../../data/rewards-data"
import RewardCard from "../../components/rewards/RewardCard"
import PointsTracker from "../../components/rewards/PointsTracker"
import RewardHistory from "../../components/rewards/RewardHistory"
import SpinGame from "../../components/rewards/SpinGame"
import RedeemModal from "../../components/rewards/RedeemModal"
import { FaTrophy, FaGift, FaHistory, FaGamepad, FaLock, FaUserPlus } from "react-icons/fa"
import Link from "next/link"

export default function RewardsPage() {
  const { user } = useAuth()
  const { points, tier, history } = useRewards()
  const [activeTab, setActiveTab] = useState("rewards")
  const [selectedReward, setSelectedReward] = useState(null)
  const [showRedeemModal, setShowRedeemModal] = useState(false)
  const [showSpinGame, setShowSpinGame] = useState(false)

  // Check if user is authenticated
  const isAuthenticated = !!user

  // Determine next tier details
  const getNextTierInfo = () => {
    if (tier === "Gold") {
      return { name: "Gold", points: 1000 }
    } else if (tier === "Silver") {
      return { name: "Gold", points: 1000 }
    } else {
      return { name: "Silver", points: 500 }
    }
  }

  const nextTier = getNextTierInfo()

  // Handle selecting a reward
  const handleSelectReward = (reward) => {
    setSelectedReward(reward)
    setShowRedeemModal(true)
  }

  // Handle closing the redeem modal
  const handleCloseRedeemModal = () => {
    setShowRedeemModal(false)
    setSelectedReward(null)
  }

  // Group rewards by category
  const categoryGroups = rewards.reduce((groups, reward) => {
    if (!groups[reward.category]) {
      groups[reward.category] = []
    }
    groups[reward.category].push(reward)
    return groups
  }, {})

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Section */}
      <section className="relative h-[40vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0 bg-black">
          <div className="absolute inset-0 bg-gradient-to-r from-black to-transparent opacity-70 z-10"></div>
          <Image 
            src="/images/rewards-hero.jpg" 
            alt="Rewards Program" 
            fill 
            className="object-cover" 
            priority
          />
        </div>
        <div className="container mx-auto px-4 z-10 text-center">
          <h1 className="heading-xl mb-4 text-white gritty-shadow">Rewards Program</h1>
          <p className="text-xl text-gray-200 max-w-2xl mx-auto">
            Earn points with every purchase and redeem them for exclusive rewards.
          </p>
        </div>
      </section>

      {/* Points Status */}
      <section className="bg-[#111111] py-8 border-b border-[#333333]">
        <div className="container mx-auto px-4">
          <div className="bg-[#1A1A1A] rounded-lg p-6 border border-[#333333]">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="bg-gold-foil bg-opacity-20 p-4 rounded-full">
                  <FaTrophy className="text-gold-foil text-2xl" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gold-foil">{points}</h2>
                  <p className="text-gray-400">Available Points</p>
                </div>
              </div>

              <div className="w-full md:w-1/2">
                <PointsTracker currentPoints={points} nextTierPoints={nextTier.points} nextTierName={nextTier.name} />
              </div>

              <div>
                <button onClick={() => setShowSpinGame(true)} className="btn-primary flex items-center gap-2">
                  <FaGamepad /> Daily Spin
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs Section - Only show for authenticated users */}
      {isAuthenticated && (
        <section className="py-8 bg-[#0A0A0A] sticky top-20 z-30 border-b border-[#333333]">
          <div className="container mx-auto px-4">
            <div className="flex overflow-x-auto pb-2 hide-scrollbar">
              <button
                className={`px-6 py-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === "rewards"
                    ? "text-gold-foil border-b-2 border-gold-foil"
                    : "text-gray-400 hover:text-white"
                }`}
                onClick={() => setActiveTab("rewards")}
              >
                <FaGift className="inline mr-2" /> Rewards
              </button>
              <button
                className={`px-6 py-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === "history"
                    ? "text-gold-foil border-b-2 border-gold-foil"
                    : "text-gray-400 hover:text-white"
                }`}
                onClick={() => setActiveTab("history")}
              >
                <FaHistory className="inline mr-2" /> History
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Content Section */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          {/* Authentication Required Message */}
          {!isAuthenticated ? (
            <div className="max-w-2xl mx-auto text-center py-16">
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-8 mb-8">
                <FaLock className="text-6xl text-gray-500 mx-auto mb-6" />
                <h2 className="text-2xl font-bold text-white mb-4">Login to Access Rewards</h2>
                <p className="text-gray-300 mb-6">
                  Sign in to your account to access our exclusive rewards program, daily spin games, 
                  and member-only discounts.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link href="/auth/signup" className="btn-primary flex items-center gap-2">
                    <FaUserPlus /> Create Account
                  </Link>
                  <Link href="/auth/login" className="btn-outline">
                    Sign In
                  </Link>
                </div>
              </div>
              
              {/* Preview of rewards for unauthenticated users */}
              <div className="text-left">
                <h3 className="text-xl font-bold text-white mb-4">What You'll Get:</h3>
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
                    <FaGift className="text-3xl text-gold-foil mb-3" />
                    <h4 className="font-bold text-white mb-2">Exclusive Rewards</h4>
                    <p className="text-gray-300 text-sm">
                      Redeem points for free menu items, discounts, and special experiences.
                    </p>
                  </div>
                  <div className="bg-gray-900 border border-gray-700 rounded-lg p-6">
                    <FaGamepad className="text-3xl text-gold-foil mb-3" />
                    <h4 className="font-bold text-white mb-2">Daily Spin Game</h4>
                    <p className="text-gray-300 text-sm">
                      Spin the wheel daily to win bonus points and surprise rewards.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <>
            {/* Rewards Tab */}
            {activeTab === "rewards" && (
              <div className="animate-fade-in">
                {Object.entries(categoryGroups).map(([category, categoryRewards]) => (
                  <div key={category} className="mb-12">
                    <h2 className="text-2xl font-bold mb-6">
                      {category.charAt(0).toUpperCase() + category.slice(1)} Rewards
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {categoryRewards.map((reward) => (
                        <RewardCard
                          key={reward.id}
                          reward={reward}
                          userPoints={points}
                          onSelect={() => handleSelectReward(reward)}
                          userTier={tier.toLowerCase()}
                        />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* History Tab */}
            {activeTab === "history" && (
              <div className="animate-fade-in">
                <h2 className="text-2xl font-bold mb-6">Points History</h2>
                <RewardHistory history={history} />
              </div>
            )}
          </>
          )}
        </div>
      </section>

      {/* Redeem Modal */}
      {selectedReward && showRedeemModal && (
        <RedeemModal reward={selectedReward} userPoints={points} onClose={handleCloseRedeemModal} />
      )}

      {/* Spin Game Modal */}
      {showSpinGame && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-80">
          <div className="bg-[#1A1A1A] rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-fade-in p-6">
            <h2 className="text-xl font-bold mb-6 text-center">Daily Spin</h2>
            <SpinGame onComplete={() => setShowSpinGame(false)} />
          </div>
        </div>
      )}
    </div>
  )
}
