"use client"

import { useState } from 'react'
import Image from 'next/image'
import { Clock, Users, ShoppingCart } from 'lucide-react'
import CountdownTimer from './CountdownTimer'
import NotifyButton from './NotifyButton'

interface DropCardProps {
  drop: {
    id: string
    name: string
    description: string
    image: string
    price: number
    availableQuantity?: number
    totalQuantity?: number
    endsAt?: Date
    scheduledFor?: Date
    notifyCount?: number
  }
  isActive: boolean
  userId?: string
}

export default function DropCard({ drop, isActive, userId }: DropCardProps) {
  const [isAdding, setIsAdding] = useState(false)
  const [quantity, setQuantity] = useState(1)
  
  const handleAddToCart = async () => {
    if (!userId) {
      // Redirect to login
      window.location.href = '/auth/login'
      return
    }
    
    setIsAdding(true)
    try {
      // TODO: Implement add to cart API call
      await new Promise(resolve => setTimeout(resolve, 1000)) // Mock delay
      console.log(`Added ${quantity} of ${drop.name} to cart`)
    } catch (error) {
      console.error('Failed to add to cart:', error)
    } finally {
      setIsAdding(false)
    }
  }
  
  const progressPercentage = drop.availableQuantity && drop.totalQuantity 
    ? ((drop.totalQuantity - drop.availableQuantity) / drop.totalQuantity) * 100
    : 0
    
  return (
    <div className="bg-[var(--color-dark-charcoal)] rounded-lg overflow-hidden border border-[var(--color-harvest-gold)]/20 hover:border-[var(--color-harvest-gold)]/40 transition-all duration-300 group">
      {/* Image */}
      <div className="relative h-48 overflow-hidden">
        <Image
          src={drop.image}
          alt={drop.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-300"
            unoptimized
        />
        {isActive && drop.endsAt && (
          <div className="absolute top-4 right-4 bg-gold-foil text-black px-2 py-1 rounded text-sm font-medium">
            <Clock className="w-3 h-3 inline mr-1" />
            Limited
          </div>
        )}
        {!isActive && (
          <div className="absolute top-4 right-4 bg-harvest-gold text-black px-2 py-1 rounded text-sm font-medium">
            Coming Soon
          </div>
        )}
      </div>
      
      {/* Content */}
      <div className="p-6">
        <h3 className="text-xl font-bold text-[var(--color-harvest-gold)] mb-2">
          {drop.name}
        </h3>
        <p className="text-gray-300 text-sm mb-4 line-clamp-2">
          {drop.description}
        </p>
        
        <div className="flex items-center justify-between mb-4">
          <span className="text-2xl font-bold text-white">
            ${drop.price.toFixed(2)}
          </span>
          {drop.notifyCount && (
            <div className="flex items-center text-sm text-gray-400">
              <Users className="w-4 h-4 mr-1" />
              {drop.notifyCount} waiting
            </div>
          )}
        </div>
        
        {/* Availability Progress */}
        {isActive && drop.availableQuantity !== undefined && drop.totalQuantity && (
          <div className="mb-4">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>{drop.availableQuantity} left</span>
              <span>{drop.totalQuantity} total</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-[var(--color-harvest-gold)] h-2 rounded-full transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
          </div>
        )}
        
        {/* Countdown Timer */}
        {isActive && drop.endsAt && (
          <div className="mb-4">
            <CountdownTimer endTime={drop.endsAt} />
          </div>
        )}
        
        {/* Action Buttons */}
        {isActive ? (
          <div className="space-y-3">
            {drop.availableQuantity && drop.availableQuantity > 0 ? (
              <>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 rounded border border-gray-600 flex items-center justify-center text-white hover:border-[var(--color-harvest-gold)] transition-colors"
                  >
                    -
                  </button>
                  <span className="text-white font-medium w-8 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity(Math.min(drop.availableQuantity || 1, quantity + 1))}
                    className="w-8 h-8 rounded border border-gray-600 flex items-center justify-center text-white hover:border-[var(--color-harvest-gold)] transition-colors"
                  >
                    +
                  </button>
                </div>
                <button
                  onClick={handleAddToCart}
                  disabled={isAdding}
                  className="w-full bg-[var(--color-harvest-gold)] text-black font-semibold py-3 rounded-lg hover:bg-[var(--color-harvest-gold)]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                >
                  {isAdding ? (
                    <div className="w-5 h-5 border-2 border-black border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <ShoppingCart className="w-5 h-5 mr-2" />
                      Add to Cart
                    </>
                  )}
                </button>
              </>
            ) : (
              <div className="text-center py-3 bg-gold-foil/20 border border-gold-foil/30 rounded-lg">
                <span className="text-[var(--color-harvest-gold)] font-medium">Sold Out</span>
              </div>
            )}
          </div>
        ) : (
          <NotifyButton dropId={drop.id} userId={userId} />
        )}
      </div>
    </div>
  )
}