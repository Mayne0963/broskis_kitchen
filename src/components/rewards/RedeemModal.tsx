"use client"

import React, { useState } from "react"
import { FaTimes, FaSpinner, FaLock, FaUserPlus, FaGift, FaCheck, FaExclamationTriangle } from "react-icons/fa"
import { useAuth } from "../../lib/context/AuthContext"
import { useRewards } from "../../lib/context/RewardsContext"
import { createCoupon } from "../../lib/services/couponService"
import type { Reward } from "@/types/reward"
import Link from "next/link"
import Image from "next/image"

interface RedeemModalProps {
  reward: Reward
  userPoints: number
  onClose: () => void
}

const RedeemModal: React.FC<RedeemModalProps> = ({ reward, userPoints, onClose }) => {
  const { user } = useAuth()
  const { redeemPoints } = useRewards()
  const [isRedeeming, setIsRedeeming] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [couponCode, setCouponCode] = useState<string | null>(null)

  const isAuthenticated = !!user
  const hasEnoughPoints = userPoints >= reward.pointsRequired

  // Handle redemption
  const handleRedeem = async () => {
    if (!hasEnoughPoints) {
      setError("You don't have enough points to redeem this reward.")
      return
    }

    if (!user) {
      setError("You must be logged in to redeem rewards.")
      return
    }

    setIsRedeeming(true)
    setError(null)

    try {
      // Create a unique coupon for this reward
      const newCoupon = await createCoupon(reward, user.id)
      
      if (!newCoupon) {
        throw new Error('Failed to create coupon')
      }

      setCouponCode(newCoupon.code)

      // Deduct points
      redeemPoints(reward.pointsRequired)

      // Show success
      setSuccess(true)
    } catch (err) {
      console.error("Redemption error:", err)
      setError("An error occurred during redemption. Please try again.")
    } finally {
      setIsRedeeming(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-80">
      <div className="bg-[#1A1A1A] rounded-lg shadow-xl w-full max-w-md overflow-hidden animate-fade-in">
        <div className="relative p-6 border-b border-[#333333]">
          <h2 className="text-xl font-bold pr-8">{success ? "Redemption Successful" : "Redeem Reward"}</h2>
          <button
            onClick={onClose}
            className="absolute top-6 right-6 text-gray-400 hover:text-white"
            aria-label="Close"
          >
            <FaTimes />
          </button>
        </div>

        <div className="p-6">
          {!isAuthenticated ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-gold-foil bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaLock className="text-gold-foil text-2xl" />
              </div>
              <h3 className="text-xl font-bold mb-4">Login Required</h3>
              <p className="text-gray-300 mb-6">
                You need to be logged in to redeem rewards. Sign in to unlock exclusive benefits!
              </p>
              <div className="flex gap-3">
                <Link href="/auth/login" className="btn-outline flex-1 text-center">
                  Login
                </Link>
                <Link href="/auth/signup" className="btn-primary flex-1 text-center flex items-center justify-center">
                  <FaUserPlus className="mr-2" />
                  Sign Up
                </Link>
              </div>
            </div>
          ) : success ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-green bg-opacity-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FaCheck className="text-emerald-green text-2xl" />
              </div>
              <h3 className="text-xl font-bold mb-4">Reward Redeemed!</h3>
              <p className="text-gray-300 mb-6">
                You&apos;ve successfully redeemed {reward.name} for {reward.pointsRequired} points.
              </p>
              {couponCode && (
                <div className="bg-[#111111] p-4 rounded-md mb-6">
                  <p className="text-sm text-gray-300 mb-2">Your coupon code:</p>
                  <p className="text-lg font-bold text-gold-foil">{couponCode}</p>
                </div>
              )}
              <button className="btn-primary w-full" onClick={onClose}>
                Close
              </button>
            </div>
          ) : (
            <>
              <div className="flex items-center mb-6">
                <div className="w-20 h-20 bg-cover bg-center rounded-md overflow-hidden flex-shrink-0 mr-4">
                  <Image
                    src={reward.image || "/placeholder.svg"}
                    alt={reward.name}
                    className="w-full h-full object-cover"
                    width={80}
                    height={80}
            unoptimized
                  />
                </div>
                <div>
                  <h3 className="text-lg font-bold">{reward.name}</h3>
                  <p className="text-sm text-gray-400">{reward.categoryName}</p>
                  <div className="flex items-center mt-1 text-gold-foil">
                    <FaGift className="mr-1" />
                    <span>{reward.pointsRequired} points</span>
                  </div>
                </div>
              </div>

              <p className="text-gray-300 mb-6">{reward.description}</p>

              {reward.expirationDays && (
                <div className="bg-[#111111] p-4 rounded-md mb-6">
                  <p className="text-sm text-gray-300">
                    <FaExclamationTriangle className="inline-block mr-2 text-citrus-orange" />
                    This reward must be used within {reward.expirationDays} days after redemption.
                  </p>
                </div>
              )}

              <div className="flex items-center justify-between mb-6">
                <span className="text-gray-400">Your Points:</span>
                <span className="font-bold">{userPoints}</span>
              </div>

              <div className="flex items-center justify-between mb-6">
                <span className="text-gray-400">Points Required:</span>
                <span className="font-bold">{reward.pointsRequired}</span>
              </div>

              <div className="flex items-center justify-between mb-6">
                <span className="text-gray-400">Remaining Points:</span>
                <span className={`font-bold ${hasEnoughPoints ? "" : "text-blood-red"}`}>
                  {userPoints - reward.pointsRequired}
                </span>
              </div>

              {error && <div className="bg-blood-red bg-opacity-20 text-blood-red p-4 rounded-md mb-6">{error}</div>}

              <div className="flex gap-3">
                <button className="btn-outline flex-1" onClick={onClose}>
                  Cancel
                </button>
                <button
                  className="btn-primary flex-1"
                  onClick={handleRedeem}
                  disabled={!hasEnoughPoints || isRedeeming}
                >
                  {isRedeeming ? (
                    <span className="flex items-center justify-center">
                      <svg
                        className="animate-spin -ml-1 mr-3 h-5 w-5 text-black"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                        ></path>
                      </svg>
                      Redeeming...
                    </span>
                  ) : (
                    "Redeem Reward"
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default RedeemModal
