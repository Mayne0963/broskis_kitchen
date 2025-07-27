"use client"

import { useState } from 'react'
import { Gift, Star, Clock, Check, Lock } from 'lucide-react'

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

interface OffersGridProps {
  offers: Offer[]
  userPoints: number
  onRedeem: (offerId: string) => void
  redeeming?: string | null
}

export default function OffersGrid({ offers, userPoints, onRedeem, redeeming }: OffersGridProps) {
  const handleRedeem = (offerId: string) => {
    onRedeem(offerId)
  }
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'discount':
        return <Star className="w-5 h-5" />
      case 'free_item':
        return <Gift className="w-5 h-5" />
      case 'upgrade':
        return <Check className="w-5 h-5" />
      default:
        return <Gift className="w-5 h-5" />
    }
  }
  
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'discount':
        return 'text-gold-foil bg-gold-foil/20'
      case 'free_item':
        return 'text-harvest-gold bg-harvest-gold/20'
      case 'upgrade':
        return 'text-purple-400 bg-purple-400/20'
      default:
        return 'text-gray-400 bg-gray-400/20'
    }
  }
  
  const formatTimeRemaining = (expiresAt: Date) => {
    const now = new Date()
    const diff = expiresAt.getTime() - now.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    
    if (days > 0) {
      return `${days}d ${hours}h left`
    } else if (hours > 0) {
      return `${hours}h left`
    } else {
      return 'Expires soon'
    }
  }
  
  const canAfford = (pointsCost: number) => userPoints >= pointsCost
  
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {offers.map((offer) => {
        const affordable = canAfford(offer.pointsCost)
        const available = offer.isAvailable && affordable
        const isRedeeming = redeeming === offer.id
        
        return (
          <div 
            key={offer.id}
            className={`
              bg-[var(--color-dark-charcoal)] rounded-lg p-6 border transition-all duration-200
              ${
                available 
                  ? 'border-[var(--color-harvest-gold)]/40 hover:border-[var(--color-harvest-gold)] hover:shadow-lg hover:shadow-[var(--color-harvest-gold)]/20' 
                  : 'border-gray-600/40 opacity-75'
              }
            `}
          >
            {/* Offer Header */}
            <div className="flex items-start justify-between mb-4">
              <div className={`p-2 rounded-lg ${getTypeColor(offer.type)}`}>
                {getTypeIcon(offer.type)}
              </div>
              
              <div className="text-right">
                <div className="flex items-center text-[var(--color-harvest-gold)]">
                  <Star className="w-4 h-4 mr-1" />
                  <span className="font-bold">{offer.pointsCost.toLocaleString()}</span>
                </div>
                <div className="text-xs text-gray-400">points</div>
              </div>
            </div>
            
            {/* Offer Content */}
            <div className="mb-4">
              <h4 className="text-lg font-semibold text-white mb-2">{offer.title}</h4>
              <p className="text-gray-400 text-sm mb-3">{offer.description}</p>
              
              <div className="flex items-center justify-between mb-3">
                <span className="text-[var(--color-harvest-gold)] font-semibold">{offer.value}</span>
                {offer.expiresAt && (
                  <div className="flex items-center text-orange-400 text-xs">
                    <Clock className="w-3 h-3 mr-1" />
                    {formatTimeRemaining(offer.expiresAt)}
                  </div>
                )}
              </div>
            </div>
            
            {/* Action Button */}
            <button
              onClick={() => handleRedeem(offer.id)}
              disabled={!available || isRedeeming}
              className={`
                w-full py-3 px-4 rounded-lg font-semibold transition-all duration-200 flex items-center justify-center
                ${
                  available
                    ? 'bg-[var(--color-harvest-gold)] text-black hover:bg-[var(--color-harvest-gold)]/90 hover:shadow-lg'
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }
              `}
            >
              {isRedeeming ? (
                <>
                  <div className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin mr-2"></div>
                  Redeeming...
                </>
              ) : !affordable ? (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Need {(offer.pointsCost - userPoints).toLocaleString()} more points
                </>
              ) : !offer.isAvailable ? (
                <>
                  <Lock className="w-4 h-4 mr-2" />
                  Not Available
                </>
              ) : (
                <>
                  <Gift className="w-4 h-4 mr-2" />
                  Redeem Now
                </>
              )}
            </button>
            
            {/* Insufficient Points Warning */}
            {!affordable && (
              <div className="mt-3 p-2 bg-gold-foil/20 border border-gold-foil/30 rounded text-xs text-gold-foil">
                You need {(offer.pointsCost - userPoints).toLocaleString()} more points to redeem this offer.
              </div>
            )}
          </div>
        )
      })}
      
      {offers.length === 0 && (
        <div className="col-span-full text-center py-12">
          <Gift className="w-16 h-16 mx-auto mb-4 text-gray-600" />
          <h3 className="text-xl font-semibold text-gray-400 mb-2">No Rewards Available</h3>
          <p className="text-gray-500">Check back later for new rewards and offers!</p>
        </div>
      )}
    </div>
  )
}