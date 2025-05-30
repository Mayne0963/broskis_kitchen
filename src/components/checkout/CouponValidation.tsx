"use client"

import { useState } from "react"
import { validateCoupon, useCoupon, type Coupon } from "../../lib/services/couponService"
import { FaTicketAlt, FaCheck, FaTimes, FaSpinner } from "react-icons/fa"

interface CouponValidationProps {
  onCouponApplied?: (coupon: Coupon) => void
  onCouponRemoved?: () => void
  appliedCoupon?: Coupon | null
  disabled?: boolean
}

export default function CouponValidation({
  onCouponApplied,
  onCouponRemoved,
  appliedCoupon,
  disabled = false
}: CouponValidationProps) {
  const [couponCode, setCouponCode] = useState("")
  const [isValidating, setIsValidating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleValidateCoupon = async () => {
    if (!couponCode.trim()) {
      setError("Please enter a coupon code")
      return
    }

    setIsValidating(true)
    setError(null)
    setSuccess(null)

    try {
      const result = await validateCoupon(couponCode.trim().toUpperCase())
      
      if (result.valid && result.coupon) {
        setSuccess("Coupon is valid!")
        onCouponApplied?.(result.coupon)
        setCouponCode("")
      } else {
        setError(result.error || "Invalid coupon code")
      }
    } catch (error) {
      console.error('Error validating coupon:', error)
      setError("An error occurred while validating the coupon")
    } finally {
      setIsValidating(false)
    }
  }

  const handleRemoveCoupon = () => {
    onCouponRemoved?.()
    setError(null)
    setSuccess(null)
  }

  const handleUseCoupon = async (orderId: string): Promise<boolean> => {
    if (!appliedCoupon) return false

    try {
      const result = await useCoupon(appliedCoupon.code, orderId)
      return result.success
    } catch (error) {
      console.error('Error using coupon:', error)
      return false
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isValidating && !disabled) {
      handleValidateCoupon()
    }
  }

  // If a coupon is already applied, show the applied coupon info
  if (appliedCoupon) {
    return (
      <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FaCheck className="text-green-500" />
            <div>
              <p className="text-green-400 font-medium">Coupon Applied</p>
              <p className="text-sm text-gray-300">
                {appliedCoupon.rewardName} - Code: {appliedCoupon.code}
              </p>
            </div>
          </div>
          <button
            onClick={handleRemoveCoupon}
            className="text-red-400 hover:text-red-300 transition-colors p-2"
            title="Remove coupon"
            disabled={disabled}
          >
            <FaTimes />
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-[#1A1A1A] border border-[#333333] rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <FaTicketAlt className="text-gold-foil" />
        <h3 className="font-medium text-white">Have a Coupon?</h3>
      </div>
      
      <div className="space-y-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={couponCode}
            onChange={(e) => {
              setCouponCode(e.target.value.toUpperCase())
              setError(null)
              setSuccess(null)
            }}
            onKeyPress={handleKeyPress}
            placeholder="Enter coupon code"
            className="flex-1 bg-[#0F0F0F] border border-[#333333] rounded px-3 py-2 text-white placeholder-gray-500 focus:border-gold-foil focus:outline-none"
            disabled={disabled || isValidating}
          />
          <button
            onClick={handleValidateCoupon}
            disabled={disabled || isValidating || !couponCode.trim()}
            className="px-4 py-2 bg-gold-foil text-black font-medium rounded hover:bg-gold-foil/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {isValidating ? (
              <>
                <FaSpinner className="animate-spin" />
                Validating...
              </>
            ) : (
              'Apply'
            )}
          </button>
        </div>
        
        {error && (
          <div className="flex items-center gap-2 text-red-400 text-sm">
            <FaTimes />
            {error}
          </div>
        )}
        
        {success && (
          <div className="flex items-center gap-2 text-green-400 text-sm">
            <FaCheck />
            {success}
          </div>
        )}
        
        <p className="text-xs text-gray-500">
          Enter your coupon code to apply discounts or redeem rewards.
        </p>
      </div>
    </div>
  )
}

// Export the useCoupon function for use in checkout process
export { useCoupon } from "../../lib/services/couponService"