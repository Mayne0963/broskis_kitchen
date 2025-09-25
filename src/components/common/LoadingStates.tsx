"use client"

import { motion } from 'framer-motion'
import { Loader2, Utensils, ShoppingCart, CreditCard } from 'lucide-react'

// Generic loading spinner
export function LoadingSpinner({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg', className?: string }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8'
  }

  return (
    <Loader2 className={`animate-spin ${sizeClasses[size]} ${className}`} />
  )
}

// Full page loading
export function PageLoading({ message = 'Loading...' }: { message?: string }) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-black">
      <motion.div
        className="text-center"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <motion.div
          className="mb-6"
          animate={{ rotate: 360 }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        >
          <Utensils className="w-12 h-12 text-[#FFD700] mx-auto" />
        </motion.div>
        <h2 className="text-xl font-semibold text-white mb-2">{message}</h2>
        <div className="flex justify-center">
          <LoadingSpinner size="lg" className="text-[#FFD700]" />
        </div>
      </motion.div>
    </div>
  )
}

// Skeleton components
export function SkeletonCard({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="bg-gray-700 rounded-lg p-4 space-y-3">
        <div className="bg-gray-600 h-48 rounded-md"></div>
        <div className="space-y-2">
          <div className="bg-gray-600 h-4 rounded w-3/4"></div>
          <div className="bg-gray-600 h-4 rounded w-1/2"></div>
          <div className="bg-gray-600 h-6 rounded w-1/4"></div>
        </div>
      </div>
    </div>
  )
}

export function SkeletonText({ lines = 3, className = '' }: { lines?: number, className?: string }) {
  return (
    <div className={`animate-pulse space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={`bg-gray-600 h-4 rounded ${
            i === lines - 1 ? 'w-3/4' : 'w-full'
          }`}
        ></div>
      ))}
    </div>
  )
}

export function SkeletonButton({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="bg-gray-600 h-10 rounded-lg w-32"></div>
    </div>
  )
}

// Menu item skeleton
export function MenuItemSkeleton() {
  return (
    <motion.div
      className="bg-gray-800 rounded-lg overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="animate-pulse">
        <div className="bg-gray-700 h-48 w-full"></div>
        <div className="p-4 space-y-3">
          <div className="bg-gray-700 h-6 rounded w-3/4"></div>
          <div className="bg-gray-700 h-4 rounded w-full"></div>
          <div className="bg-gray-700 h-4 rounded w-2/3"></div>
          <div className="flex justify-between items-center mt-4">
            <div className="bg-gray-700 h-6 rounded w-20"></div>
            <div className="bg-gray-700 h-10 rounded w-24"></div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}

// Cart loading
export function CartLoading() {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <motion.div
        className="mb-4"
        animate={{ scale: [1, 1.1, 1] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <ShoppingCart className="w-12 h-12 text-[#FFD700]" />
      </motion.div>
      <p className="text-white text-lg">Loading your cart...</p>
      <LoadingSpinner size="lg" className="text-[#FFD700] mt-2" />
    </div>
  )
}

// Payment loading
export function PaymentLoading({ message = 'Processing payment...' }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center p-8">
      <motion.div
        className="mb-4"
        animate={{ rotate: [0, 360] }}
        transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
      >
        <CreditCard className="w-12 h-12 text-[#FFD700]" />
      </motion.div>
      <p className="text-white text-lg mb-2">{message}</p>
      <p className="text-gray-400 text-sm mb-4">Please don&apos;t close this window</p>
      <LoadingSpinner size="lg" className="text-[#FFD700]" />
    </div>
  )
}

// Button loading state
export function ButtonLoading({ 
  children, 
  loading = false, 
  disabled = false,
  className = '',
  ...props 
}: {
  children: React.ReactNode
  loading?: boolean
  disabled?: boolean
  className?: string
  [key: string]: any
}) {
  return (
    <button
      className={`relative ${className} ${loading || disabled ? 'opacity-75 cursor-not-allowed' : ''}`}
      disabled={loading || disabled}
      {...props}
    >
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center">
          <LoadingSpinner size="sm" className="text-current" />
        </div>
      )}
      <span className={loading ? 'opacity-0' : 'opacity-100'}>
        {children}
      </span>
    </button>
  )
}

// Grid skeleton for menu/shop pages
export function GridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {Array.from({ length: count }).map((_, i) => (
        <MenuItemSkeleton key={i} />
      ))}
    </div>
  )
}

// Search loading
export function SearchLoading() {
  return (
    <div className="flex items-center justify-center p-4">
      <LoadingSpinner size="md" className="text-[#FFD700] mr-2" />
      <span className="text-gray-400">Searching...</span>
    </div>
  )
}

// Empty state component
export function EmptyState({ 
  icon: Icon = Utensils,
  title = 'Nothing here yet',
  description = 'Check back later for updates',
  action,
  className = ''
}: {
  icon?: React.ComponentType<{ className?: string }>
  title?: string
  description?: string
  action?: React.ReactNode
  className?: string
}) {
  return (
    <motion.div
      className={`flex flex-col items-center justify-center p-8 text-center ${className}`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Icon className="w-16 h-16 text-gray-500 mb-4" />
      <h3 className="text-xl font-semibold text-white mb-2">{title}</h3>
      <p className="text-gray-400 mb-6 max-w-md">{description}</p>
      {action}
    </motion.div>
  )
}