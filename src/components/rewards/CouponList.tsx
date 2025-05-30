"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../../lib/context/AuthContext"
import { getUserCoupons, type Coupon } from "../../lib/services/couponService"
import { FaTicketAlt, FaClock, FaCheckCircle, FaTimesCircle, FaCopy } from "react-icons/fa"

export default function CouponList() {
  const { user } = useAuth()
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [copiedCode, setCopiedCode] = useState<string | null>(null)

  useEffect(() => {
    const fetchCoupons = async () => {
      if (!user?.id) {
        setLoading(false)
        return
      }

      try {
        const userCoupons = await getUserCoupons(user.id)
        // Sort coupons: unused first, then by creation date (newest first)
        const sortedCoupons = userCoupons.sort((a, b) => {
          if (a.isUsed !== b.isUsed) {
            return a.isUsed ? 1 : -1
          }
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        })
        setCoupons(sortedCoupons)
      } catch (error) {
        console.error('Error fetching coupons:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchCoupons()
  }, [user?.id])

  const copyToClipboard = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedCode(code)
      setTimeout(() => setCopiedCode(null), 2000)
    } catch (error) {
      console.error('Failed to copy code:', error)
    }
  }

  const isExpired = (expiresAt: Date) => {
    return new Date() > expiresAt
  }

  const getStatusIcon = (coupon: Coupon) => {
    if (coupon.isUsed) {
      return <FaCheckCircle className="text-green-500" />
    } else if (isExpired(coupon.expiresAt)) {
      return <FaTimesCircle className="text-red-500" />
    } else {
      return <FaClock className="text-yellow-500" />
    }
  }

  const getStatusText = (coupon: Coupon) => {
    if (coupon.isUsed) {
      return "Used"
    } else if (isExpired(coupon.expiresAt)) {
      return "Expired"
    } else {
      return "Active"
    }
  }

  const getStatusColor = (coupon: Coupon) => {
    if (coupon.isUsed) {
      return "text-green-500"
    } else if (isExpired(coupon.expiresAt)) {
      return "text-red-500"
    } else {
      return "text-yellow-500"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gold-foil"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-400">Please log in to view your coupons.</p>
      </div>
    )
  }

  if (coupons.length === 0) {
    return (
      <div className="text-center py-8">
        <FaTicketAlt className="text-4xl text-gray-600 mx-auto mb-4" />
        <p className="text-gray-400">No coupons yet. Redeem rewards to get coupon codes!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
        <FaTicketAlt className="text-gold-foil" />
        My Coupons ({coupons.length})
      </h3>
      
      <div className="grid gap-4">
        {coupons.map((coupon) => (
          <div
            key={coupon.id}
            className={`bg-[#1A1A1A] border rounded-lg p-4 transition-all duration-200 ${
              coupon.isUsed || isExpired(coupon.expiresAt)
                ? 'border-gray-600 opacity-60'
                : 'border-[#333333] hover:border-gold-foil'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {getStatusIcon(coupon)}
                  <h4 className="font-semibold text-white">{coupon.rewardName}</h4>
                  <span className={`text-sm font-medium ${getStatusColor(coupon)}`}>
                    {getStatusText(coupon)}
                  </span>
                </div>
                
                <div className="bg-[#0F0F0F] border border-[#333333] rounded p-3 mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-mono font-bold text-gold-foil tracking-wider">
                      {coupon.code}
                    </span>
                    <button
                      onClick={() => copyToClipboard(coupon.code)}
                      className="text-gray-400 hover:text-gold-foil transition-colors p-1"
                      title="Copy code"
                    >
                      <FaCopy />
                    </button>
                  </div>
                  {copiedCode === coupon.code && (
                    <p className="text-xs text-green-500 mt-1">Copied to clipboard!</p>
                  )}
                </div>
                
                <div className="text-sm text-gray-400 space-y-1">
                  <p>
                    Created: {coupon.createdAt.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </p>
                  <p>
                    Expires: {coupon.expiresAt.toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </p>
                  {coupon.isUsed && coupon.usedAt && (
                    <p>
                      Used: {coupon.usedAt.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            {!coupon.isUsed && !isExpired(coupon.expiresAt) && (
              <div className="mt-3 p-2 bg-blue-900/20 border border-blue-700/30 rounded text-xs text-blue-300">
                💡 Present this code at checkout to redeem your reward. This is a single-use coupon.
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}