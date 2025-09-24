"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useAuth } from "../../lib/context/AuthContext"
import { useRewards } from "../../lib/context/RewardsContext"
import { rewards } from "../../data/rewards-data"
import RewardCard from "../../components/rewards/RewardCard"
import PointsTracker from "../../components/rewards/PointsTracker"
import RewardHistory from "../../components/rewards/RewardHistory"
import SpinGame from "../../components/rewards/SpinGame"
import RedeemModal from "../../components/rewards/RedeemModal"
import { FaTrophy, FaGift, FaHistory, FaGamepad, FaLock, FaUserPlus, FaStar, FaCrown, FaFire } from "react-icons/fa"
import { Sparkles, Zap, Gift } from "lucide-react"
import Link from "next/link"

export default function RewardsPage() {
  const { user } = useAuth()
  const { status, rewards, loading, error, refreshStatus, spinWheel, redeemReward } = useRewards()
  const [activeTab, setActiveTab] = useState("rewards")
  const [selectedReward, setSelectedReward] = useState(null)
  const [showRedeemModal, setShowRedeemModal] = useState(false)
  const [showSpinGame, setShowSpinGame] = useState(false)

  // Check if user is authenticated
  const isAuthenticated = !!user

  // Get current status or defaults
  const currentPoints = status?.currentPoints || 0
  const currentTier = status?.tier || "Bronze"
  const nextTier = status?.nextTier
  const pointsToNextTier = status?.pointsToNextTier || 0
  const canSpin = status?.canSpin || false
  const pointsExpiring = status?.pointsExpiring || 0

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

  // Sacred Geometry Background Component
  const SacredGeometry = () => (
    <div className="absolute inset-0 overflow-hidden opacity-20">
      {/* Flower of Life Pattern */}
      <div className="absolute top-20 left-20 w-64 h-64">
        <svg viewBox="0 0 200 200" className="w-full h-full animate-spin-slow">
          <circle cx="100" cy="100" r="30" fill="none" stroke="#FFD700" strokeWidth="1" opacity="0.6" />
          <circle cx="126" cy="85" r="30" fill="none" stroke="#40E0D0" strokeWidth="1" opacity="0.6" />
          <circle cx="126" cy="115" r="30" fill="none" stroke="#FFD700" strokeWidth="1" opacity="0.6" />
          <circle cx="100" cy="130" r="30" fill="none" stroke="#40E0D0" strokeWidth="1" opacity="0.6" />
          <circle cx="74" cy="115" r="30" fill="none" stroke="#FFD700" strokeWidth="1" opacity="0.6" />
          <circle cx="74" cy="85" r="30" fill="none" stroke="#40E0D0" strokeWidth="1" opacity="0.6" />
        </svg>
      </div>
      
      {/* Metatron's Cube */}
      <div className="absolute bottom-20 right-20 w-48 h-48">
        <svg viewBox="0 0 200 200" className="w-full h-full animate-pulse">
          <polygon points="100,20 180,60 180,140 100,180 20,140 20,60" fill="none" stroke="#40E0D0" strokeWidth="1" opacity="0.4" />
          <polygon points="100,50 150,75 150,125 100,150 50,125 50,75" fill="none" stroke="#FFD700" strokeWidth="1" opacity="0.4" />
          <circle cx="100" cy="100" r="25" fill="none" stroke="#FFD700" strokeWidth="2" opacity="0.6" />
        </svg>
      </div>
      
      {/* Golden Ratio Spiral */}
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96">
        <svg viewBox="0 0 300 300" className="w-full h-full animate-spin-reverse">
          <path d="M150,150 Q200,100 250,150 Q200,200 150,150 Q100,100 150,50 Q250,50 250,150 Q250,250 150,250 Q50,250 50,150 Q50,50 150,50" 
                fill="none" stroke="#40E0D0" strokeWidth="1" opacity="0.3" />
        </svg>
      </div>
    </div>
  )

  // Hero Section with Street-Luxury Design
  const heroSection = (
    <section className="relative bg-gradient-to-br from-black via-gray-900 to-black py-24 overflow-hidden border-b-4 border-gradient-to-r from-[#FFD700] to-[#40E0D0]">
      <SacredGeometry />
      
      {/* Animated Background Glow */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#FFD700] rounded-full blur-3xl opacity-10 animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#40E0D0] rounded-full blur-3xl opacity-10 animate-pulse delay-1000"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center max-w-6xl mx-auto">
          {/* Main Title with Glow Effect */}
          <div className="relative mb-8">
            <h1 className="text-6xl md:text-8xl font-black mb-4 relative">
              <span className="bg-gradient-to-r from-[#FFD700] via-white to-[#40E0D0] bg-clip-text text-transparent drop-shadow-2xl">
                BROSKI'S
              </span>
              <br />
              <span className="bg-gradient-to-r from-[#40E0D0] via-[#FFD700] to-white bg-clip-text text-transparent">
                REWARDS
              </span>
            </h1>
            {/* Glow effect behind text */}
            <div className="absolute inset-0 text-6xl md:text-8xl font-black text-[#FFD700] opacity-20 blur-sm">
              BROSKI'S<br />REWARDS
            </div>
          </div>
          
          {/* Tagline */}
          <div className="relative mb-12">
            <p className="text-2xl md:text-4xl font-bold text-white mb-4 tracking-wider">
              EAT. EARN. SPIN. WIN.
            </p>
            <div className="flex justify-center items-center gap-4 text-lg md:text-xl text-gray-300">
              <Sparkles className="text-[#FFD700] animate-pulse" size={24} />
              <span>Your loyalty deserves luxury</span>
              <Sparkles className="text-[#40E0D0] animate-pulse" size={24} />
            </div>
          </div>
          
          {/* Stats Row */}
          <div className="grid grid-cols-3 gap-8 mb-12 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-[#FFD700] mb-2">10%</div>
              <div className="text-sm text-gray-400 uppercase tracking-wide">Points Back</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-[#40E0D0] mb-2">Daily</div>
              <div className="text-sm text-gray-400 uppercase tracking-wide">Free Spins</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-[#FFD700] mb-2">VIP</div>
              <div className="text-sm text-gray-400 uppercase tracking-wide">Rewards</div>
            </div>
          </div>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <button 
              onClick={() => setShowSpinGame(true)}
              disabled={!canSpin || loading}
              className={`group relative px-10 py-5 rounded-xl font-black text-xl transition-all duration-500 transform hover:scale-110 flex items-center gap-3 overflow-hidden ${
                canSpin && !loading
                  ? 'bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-black hover:shadow-2xl hover:shadow-[#FFD700]/50'
                  : 'bg-gray-600 text-gray-400 cursor-not-allowed'
              }`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-[#FFA500] to-[#FFD700] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <Zap className={`relative z-10 ${canSpin && !loading ? 'animate-bounce' : ''}`} size={24} />
              <span className="relative z-10">
                {loading ? 'SPINNING...' : canSpin ? 'SPIN TO WIN' : 'SPIN COOLDOWN'}
              </span>
            </button>
            <Link 
              href="#rewards" 
              className="group relative border-3 border-[#40E0D0] text-[#40E0D0] px-10 py-5 rounded-xl font-black text-xl hover:bg-[#40E0D0] hover:text-black transition-all duration-500 flex items-center gap-3 hover:shadow-2xl hover:shadow-[#40E0D0]/50 transform hover:scale-110"
            >
              <Gift className="group-hover:animate-pulse" size={24} />
              <span>CLAIM REWARDS</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )

  return (
    <div className="min-h-screen pb-20">
      {heroSection}

      {/* Points Status - Street Luxury Design */}
      <section className="bg-gradient-to-r from-black via-gray-900 to-black py-12 border-b border-[#FFD700]/30">
        <div className="container mx-auto px-4">
          <div className="bg-gradient-to-br from-gray-900/80 via-black/90 to-gray-900/80 backdrop-blur-sm rounded-2xl p-8 border border-[#FFD700]/20 shadow-2xl relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#FFD700]/5 to-[#40E0D0]/5 rounded-2xl"></div>
            
            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-8 items-center">
              {/* Points Display */}
              <div className="text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start gap-4 mb-4">
                  <div className="relative">
                    <div className="bg-gradient-to-br from-[#FFD700] to-[#FFA500] p-4 rounded-full shadow-lg">
                      <FaTrophy className="text-black text-3xl" />
                    </div>
                    <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#40E0D0] rounded-full flex items-center justify-center">
                      <FaStar className="text-black text-xs" />
                    </div>
                  </div>
                  <div>
                    <h2 className="text-4xl font-black bg-gradient-to-r from-[#FFD700] to-[#FFA500] bg-clip-text text-transparent">
                      {currentPoints.toLocaleString()}
                    </h2>
                    <p className="text-gray-400 font-medium uppercase tracking-wide text-sm">Available Points</p>
                  </div>
                </div>
                
                {/* Tier Badge */}
                <div className="inline-flex items-center gap-2 bg-gradient-to-r from-[#40E0D0]/20 to-[#FFD700]/20 px-4 py-2 rounded-full border border-[#40E0D0]/30">
                  {currentTier === 'Gold' ? <FaCrown className="text-[#FFD700]" /> : 
                   currentTier === 'Silver' ? <FaStar className="text-gray-300" /> : 
                   <FaFire className="text-[#40E0D0]" />}
                  <span className="text-white font-bold text-sm uppercase tracking-wider">{currentTier} Member</span>
                </div>
              </div>

              {/* Progress Tracker */}
              <div className="lg:col-span-1">
                <PointsTracker currentPoints={currentPoints} nextTierPoints={pointsToNextTier} nextTierName={nextTier} />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-4">
                <button 
                  onClick={() => setShowSpinGame(true)} 
                  disabled={!canSpin || loading}
                  className={`group relative px-6 py-4 rounded-xl font-bold text-lg transition-all duration-300 transform hover:scale-105 flex items-center justify-center gap-3 overflow-hidden ${
                    canSpin && !loading
                      ? 'bg-gradient-to-r from-[#40E0D0] to-[#20B2AA] text-white hover:shadow-2xl hover:shadow-[#40E0D0]/50'
                      : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-[#20B2AA] to-[#40E0D0] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <FaGamepad className={`relative z-10 text-xl ${canSpin && !loading ? 'group-hover:animate-pulse' : ''}`} />
                  <span className="relative z-10">
                    {loading ? 'SPINNING...' : canSpin ? 'DAILY SPIN' : 'SPIN USED'}
                  </span>
                </button>
                
                <div className="text-center text-sm text-gray-400">
                  <Sparkles className="inline mr-2 text-[#FFD700]" size={16} />
                  {canSpin ? 'Free spin available!' : status?.nextSpinTime ? `Next spin: ${new Date(status.nextSpinTime).toLocaleTimeString()}` : 'Spin used today'}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Tabs Section - Street Luxury Design */}
      {isAuthenticated && (
        <section className="py-8 bg-gradient-to-r from-black via-gray-900 to-black sticky top-0 z-30 border-b border-[#FFD700]/20 backdrop-blur-md">
          <div className="container mx-auto px-4">
            <div className="flex justify-center">
              <div className="bg-gray-900/50 backdrop-blur-sm rounded-2xl p-2 border border-[#FFD700]/20">
                <div className="flex gap-2">
                  <button
                    className={`relative px-8 py-4 font-bold text-lg whitespace-nowrap rounded-xl transition-all duration-300 flex items-center gap-3 ${
                      activeTab === "rewards"
                        ? "bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-black shadow-lg shadow-[#FFD700]/50"
                        : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                    }`}
                    onClick={() => setActiveTab("rewards")}
                  >
                    <FaGift className={`text-xl ${activeTab === "rewards" ? "animate-pulse" : ""}`} />
                    <span>REWARDS</span>
                    {activeTab === "rewards" && (
                      <div className="absolute inset-0 bg-gradient-to-r from-[#FFA500] to-[#FFD700] rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                    )}
                  </button>
                  <button
                    className={`relative px-8 py-4 font-bold text-lg whitespace-nowrap rounded-xl transition-all duration-300 flex items-center gap-3 ${
                      activeTab === "history"
                        ? "bg-gradient-to-r from-[#40E0D0] to-[#20B2AA] text-white shadow-lg shadow-[#40E0D0]/50"
                        : "text-gray-400 hover:text-white hover:bg-gray-800/50"
                    }`}
                    onClick={() => setActiveTab("history")}
                  >
                    <FaHistory className={`text-xl ${activeTab === "history" ? "animate-pulse" : ""}`} />
                    <span>HISTORY</span>
                    {activeTab === "history" && (
                      <div className="absolute inset-0 bg-gradient-to-r from-[#20B2AA] to-[#40E0D0] rounded-xl opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Content Section - Street Luxury Design */}
      <section className="py-16 bg-gradient-to-br from-black via-gray-900 to-black min-h-screen" id="rewards">
        <div className="container mx-auto px-4">
          {/* Authentication Required Message */}
          {!isAuthenticated ? (
            <div className="max-w-4xl mx-auto text-center py-20">
              <div className="bg-gradient-to-br from-gray-900/80 via-black/90 to-gray-900/80 backdrop-blur-sm border border-[#FFD700]/20 rounded-3xl p-12 mb-12 relative overflow-hidden">
                {/* Background glow */}
                <div className="absolute inset-0 bg-gradient-to-r from-[#FFD700]/5 to-[#40E0D0]/5 rounded-3xl"></div>
                
                <div className="relative z-10">
                  <div className="relative mb-8">
                    <FaLock className="text-8xl text-[#FFD700] mx-auto mb-6 animate-pulse" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-32 h-32 bg-[#FFD700] rounded-full blur-3xl opacity-20 animate-pulse"></div>
                    </div>
                  </div>
                  
                  <h2 className="text-4xl font-black text-white mb-6 tracking-wider">
                    UNLOCK THE <span className="bg-gradient-to-r from-[#FFD700] to-[#40E0D0] bg-clip-text text-transparent">VAULT</span>
                  </h2>
                  <p className="text-xl text-gray-300 mb-10 leading-relaxed max-w-2xl mx-auto">
                    Join the elite circle and access our exclusive rewards program with daily spins, 
                    VIP perks, and luxury experiences that money can't buy.
                  </p>
                  
                  <div className="flex flex-col sm:flex-row gap-6 justify-center mb-12">
                    <Link href="/auth/signup" className="group relative bg-gradient-to-r from-[#FFD700] to-[#FFA500] text-black px-10 py-5 rounded-xl font-black text-xl hover:shadow-2xl hover:shadow-[#FFD700]/50 transition-all duration-500 transform hover:scale-110 flex items-center justify-center gap-3 overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-[#FFA500] to-[#FFD700] opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                      <FaUserPlus className="relative z-10" />
                      <span className="relative z-10">JOIN THE ELITE</span>
                    </Link>
                    <Link href="/auth/login" className="group relative border-3 border-[#40E0D0] text-[#40E0D0] px-10 py-5 rounded-xl font-black text-xl hover:bg-[#40E0D0] hover:text-black transition-all duration-500 flex items-center justify-center gap-3 hover:shadow-2xl hover:shadow-[#40E0D0]/50 transform hover:scale-110">
                      <FaLock className="group-hover:animate-pulse" />
                      <span>SIGN IN</span>
                    </Link>
                  </div>
                </div>
              </div>
              
              {/* Preview Benefits */}
              <div className="text-left">
                <h3 className="text-3xl font-black text-center text-white mb-12 tracking-wider">
                  EXCLUSIVE <span className="bg-gradient-to-r from-[#FFD700] to-[#40E0D0] bg-clip-text text-transparent">BENEFITS</span>
                </h3>
                <div className="grid md:grid-cols-2 gap-8">
                  <div className="group bg-gradient-to-br from-gray-900/80 via-black/90 to-gray-900/80 backdrop-blur-sm border border-[#FFD700]/20 rounded-2xl p-8 hover:border-[#FFD700]/40 transition-all duration-500 hover:transform hover:scale-105 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#FFD700]/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative z-10">
                      <div className="bg-gradient-to-br from-[#FFD700] to-[#FFA500] p-4 rounded-full w-fit mb-6">
                        <FaGift className="text-3xl text-black" />
                      </div>
                      <h4 className="font-black text-white mb-4 text-xl tracking-wide">LUXURY REWARDS</h4>
                      <p className="text-gray-300 leading-relaxed">
                        Redeem points for premium menu items, exclusive discounts, and VIP dining experiences.
                      </p>
                    </div>
                  </div>
                  <div className="group bg-gradient-to-br from-gray-900/80 via-black/90 to-gray-900/80 backdrop-blur-sm border border-[#40E0D0]/20 rounded-2xl p-8 hover:border-[#40E0D0]/40 transition-all duration-500 hover:transform hover:scale-105 relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-r from-[#40E0D0]/5 to-transparent rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="relative z-10">
                      <div className="bg-gradient-to-br from-[#40E0D0] to-[#20B2AA] p-4 rounded-full w-fit mb-6">
                        <FaGamepad className="text-3xl text-white" />
                      </div>
                      <h4 className="font-black text-white mb-4 text-xl tracking-wide">DAILY FORTUNE</h4>
                      <p className="text-gray-300 leading-relaxed">
                        Spin the wheel of fortune daily to win bonus points, surprise rewards, and jackpot prizes.
                      </p>
                    </div>
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
                  <div key={category} className="mb-16">
                    <div className="text-center mb-12">
                      <h2 className="text-4xl font-black text-white mb-4 tracking-wider">
                        {category.toUpperCase()} <span className="bg-gradient-to-r from-[#FFD700] to-[#40E0D0] bg-clip-text text-transparent">COLLECTION</span>
                      </h2>
                      <div className="w-24 h-1 bg-gradient-to-r from-[#FFD700] to-[#40E0D0] mx-auto rounded-full"></div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                      {categoryRewards.map((reward) => (
                        <RewardCard
                          key={reward.id}
                          reward={reward}
                          userPoints={currentPoints}
                          onSelect={() => handleSelectReward(reward)}
                          userTier={currentTier.toLowerCase()}
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
                <div className="text-center mb-12">
                  <h2 className="text-4xl font-black text-white mb-4 tracking-wider">
                    POINTS <span className="bg-gradient-to-r from-[#FFD700] to-[#40E0D0] bg-clip-text text-transparent">HISTORY</span>
                  </h2>
                  <div className="w-24 h-1 bg-gradient-to-r from-[#FFD700] to-[#40E0D0] mx-auto rounded-full"></div>
                </div>
                <RewardHistory history={status?.history || []} />
              </div>
            )}
          </>
          )}
        </div>
      </section>

      {/* Modals - Street Luxury Design */}
      {selectedReward && showRedeemModal && (
        <RedeemModal 
          reward={selectedReward} 
          userPoints={currentPoints} 
          onClose={handleCloseRedeemModal}
          onRedeem={async (reward) => {
            console.log('Redeeming reward:', reward)
            // For demo purposes, using mock order data
            const mockOrderId = `order-${Date.now()}`
            const mockOrderSubtotal = 50.00 // Mock order subtotal
            
            const success = await redeemReward(
              reward.id,
              mockOrderId,
              mockOrderSubtotal,
              reward.type,
              reward.pointsRequired * 0.1, // Mock reward value (10% of points cost)
              reward.pointsRequired
            )
            
            if (success) {
              console.log('Redemption successful')
            }
            handleCloseRedeemModal()
          }}
        />
      )}

      {/* Spin Game Modal */}
      {showSpinGame && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900/95 via-black/95 to-gray-900/95 backdrop-blur-lg border border-[#FFD700]/30 rounded-3xl p-8 max-w-lg w-full relative overflow-hidden">
            {/* Background glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-[#FFD700]/10 to-[#40E0D0]/10 rounded-3xl"></div>
            
            <div className="relative z-10">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-3xl font-black text-white tracking-wider">
                  DAILY <span className="bg-gradient-to-r from-[#FFD700] to-[#40E0D0] bg-clip-text text-transparent">FORTUNE</span>
                </h3>
                <button
                  onClick={() => setShowSpinGame(false)}
                  className="text-gray-400 hover:text-[#FFD700] transition-colors duration-300 text-2xl"
                >
                  <FaTimes />
                </button>
              </div>
              <SpinGame 
                 onClose={() => setShowSpinGame(false)}
                 onSpin={async (result) => {
                   console.log('Spin result:', result)
                   const spinResult = await spinWheel()
                   if (spinResult) {
                     console.log('Spin successful:', spinResult)
                   }
                 }}
               />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
