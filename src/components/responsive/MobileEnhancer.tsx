"use client"

import React, { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface MobileEnhancerProps {
  children: React.ReactNode
  enableSwipeGestures?: boolean
  enablePullToRefresh?: boolean
  enableTouchOptimizations?: boolean
}

/**
 * Enhanced mobile optimization component with advanced features
 */
export default function MobileEnhancer({
  children,
  enableSwipeGestures = true,
  enablePullToRefresh = false,
  enableTouchOptimizations = true
}: MobileEnhancerProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait')
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [pullDistance, setPullDistance] = useState(0)
  const [touchStart, setTouchStart] = useState({ x: 0, y: 0 })

  // Enhanced mobile detection
  useEffect(() => {
    const checkMobile = () => {
      const isMobileDevice = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
      const isSmallScreen = window.innerWidth < 768
      const hasTouchScreen = 'ontouchstart' in window || navigator.maxTouchPoints > 0
      
      setIsMobile(isMobileDevice || (isSmallScreen && hasTouchScreen))
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape')
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    window.addEventListener('orientationchange', checkMobile)

    return () => {
      window.removeEventListener('resize', checkMobile)
      window.removeEventListener('orientationchange', checkMobile)
    }
  }, [])

  // Enhanced touch optimizations
  useEffect(() => {
    if (!enableTouchOptimizations || !isMobile) return

    // Prevent zoom on double tap
    let lastTouchEnd = 0
    const preventZoom = (e: TouchEvent) => {
      const now = new Date().getTime()
      if (now - lastTouchEnd <= 300) {
        e.preventDefault()
      }
      lastTouchEnd = now
    }

    // Improve touch responsiveness
    const optimizeTouchResponse = () => {
      document.body.style.touchAction = 'manipulation'
      document.body.style.userSelect = 'none'
      document.body.style.webkitUserSelect = 'none'
      document.body.style.webkitTouchCallout = 'none'
      document.body.style.webkitTapHighlightColor = 'transparent'
    }

    // Add momentum scrolling for iOS
    const addMomentumScrolling = () => {
      document.body.style.webkitOverflowScrolling = 'touch'
      document.body.style.overflowScrolling = 'touch'
    }

    document.addEventListener('touchend', preventZoom, { passive: false })
    optimizeTouchResponse()
    addMomentumScrolling()

    return () => {
      document.removeEventListener('touchend', preventZoom)
      document.body.style.touchAction = 'auto'
      document.body.style.userSelect = 'auto'
      document.body.style.webkitUserSelect = 'auto'
      document.body.style.webkitTouchCallout = 'default'
      document.body.style.webkitTapHighlightColor = 'initial'
    }
  }, [enableTouchOptimizations, isMobile])

  // Pull to refresh functionality
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (!enablePullToRefresh) return
    
    const touch = e.touches[0]
    setTouchStart({ x: touch.clientX, y: touch.clientY })
  }, [enablePullToRefresh])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!enablePullToRefresh || window.scrollY > 0) return
    
    const touch = e.touches[0]
    const deltaY = touch.clientY - touchStart.y
    
    if (deltaY > 0 && deltaY < 150) {
      setPullDistance(deltaY)
      e.preventDefault()
    }
  }, [enablePullToRefresh, touchStart.y])

  const handleTouchEnd = useCallback(() => {
    if (!enablePullToRefresh) return
    
    if (pullDistance > 80) {
      setIsRefreshing(true)
      // Simulate refresh
      setTimeout(() => {
        setIsRefreshing(false)
        if (process.env.DISABLE_FORCED_REFRESH !== "true") {
          window.location.reload()
        } else {
          // Silent refresh - navigate to same page
          window.location.href = window.location.href
        }
      }, 1500)
    }
    
    setPullDistance(0)
  }, [enablePullToRefresh, pullDistance])

  // Swipe gesture detection
  const handleSwipeStart = useCallback((e: React.TouchEvent) => {
    if (!enableSwipeGestures) return
    
    const touch = e.touches[0]
    setTouchStart({ x: touch.clientX, y: touch.clientY })
  }, [enableSwipeGestures])

  const handleSwipeEnd = useCallback((e: React.TouchEvent) => {
    if (!enableSwipeGestures) return
    
    const touch = e.changedTouches[0]
    const deltaX = touch.clientX - touchStart.x
    const deltaY = touch.clientY - touchStart.y
    
    // Detect horizontal swipes
    if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
      const swipeDirection = deltaX > 0 ? 'right' : 'left'
      
      // Dispatch custom swipe event
      const swipeEvent = new CustomEvent('mobileSwipe', {
        detail: { direction: swipeDirection, deltaX, deltaY }
      })
      document.dispatchEvent(swipeEvent)
    }
  }, [enableSwipeGestures, touchStart])

  // Viewport height fix for mobile browsers
  useEffect(() => {
    const setVH = () => {
      const vh = window.innerHeight * 0.01
      document.documentElement.style.setProperty('--vh', `${vh}px`)
      document.documentElement.style.setProperty('--safe-area-inset-top', 'env(safe-area-inset-top)')
      document.documentElement.style.setProperty('--safe-area-inset-bottom', 'env(safe-area-inset-bottom)')
    }

    setVH()
    window.addEventListener('resize', setVH)
    window.addEventListener('orientationchange', setVH)

    return () => {
      window.removeEventListener('resize', setVH)
      window.removeEventListener('orientationchange', setVH)
    }
  }, [])

  return (
    <div 
      className={`mobile-enhanced ${isMobile ? 'is-mobile' : 'is-desktop'} ${orientation}`}
      data-mobile={isMobile}
      data-orientation={orientation}
      onTouchStart={enablePullToRefresh ? handleTouchStart : enableSwipeGestures ? handleSwipeStart : undefined}
      onTouchMove={enablePullToRefresh ? handleTouchMove : undefined}
      onTouchEnd={enablePullToRefresh ? handleTouchEnd : enableSwipeGestures ? handleSwipeEnd : undefined}
      style={{
        transform: pullDistance > 0 ? `translateY(${Math.min(pullDistance * 0.5, 75)}px)` : undefined,
        transition: pullDistance === 0 ? 'transform 0.3s ease-out' : undefined
      }}
    >
      {/* Pull to refresh indicator */}
      <AnimatePresence>
        {enablePullToRefresh && (pullDistance > 0 || isRefreshing) && (
          <motion.div
            className="fixed top-0 left-0 right-0 z-50 flex justify-center items-center bg-black/90 backdrop-blur-sm"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -50 }}
            style={{ height: Math.min(pullDistance, 80) }}
          >
            <div className="flex items-center gap-2 text-[#FFD700]">
              <motion.div
                className="w-6 h-6 border-2 border-[#FFD700] border-t-transparent rounded-full"
                animate={{ rotate: isRefreshing ? 360 : 0 }}
                transition={{ duration: 1, repeat: isRefreshing ? Infinity : 0, ease: 'linear' }}
              />
              <span className="text-sm font-medium">
                {isRefreshing ? 'Refreshing...' : pullDistance > 80 ? 'Release to refresh' : 'Pull to refresh'}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {children}
    </div>
  )
}

/**
 * Enhanced responsive hook with device detection
 */
export function useEnhancedResponsive() {
  const [deviceInfo, setDeviceInfo] = useState({
    isMobile: false,
    isTablet: false,
    isDesktop: false,
    isIOS: false,
    isAndroid: false,
    breakpoint: 'md' as 'xs' | 'sm' | 'md' | 'lg' | 'xl',
    orientation: 'portrait' as 'portrait' | 'landscape',
    hasNotch: false,
    pixelRatio: 1
  })

  useEffect(() => {
    const updateDeviceInfo = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      const userAgent = navigator.userAgent
      
      // Device detection
      const isIOS = /iPad|iPhone|iPod/.test(userAgent)
      const isAndroid = /Android/.test(userAgent)
      const isMobile = width < 768 || /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent)
      const isTablet = width >= 768 && width < 1024
      const isDesktop = width >= 1024
      
      // Breakpoint detection
      let breakpoint: 'xs' | 'sm' | 'md' | 'lg' | 'xl'
      if (width < 480) breakpoint = 'xs'
      else if (width < 640) breakpoint = 'sm'
      else if (width < 768) breakpoint = 'md'
      else if (width < 1024) breakpoint = 'lg'
      else breakpoint = 'xl'
      
      // Orientation
      const orientation = height > width ? 'portrait' : 'landscape'
      
      // Notch detection (approximate)
      const hasNotch = isIOS && (width === 375 && height === 812) || (width === 414 && height === 896) || (width === 390 && height === 844)
      
      setDeviceInfo({
        isMobile,
        isTablet,
        isDesktop,
        isIOS,
        isAndroid,
        breakpoint,
        orientation,
        hasNotch,
        pixelRatio: window.devicePixelRatio || 1
      })
    }

    updateDeviceInfo()
    window.addEventListener('resize', updateDeviceInfo)
    window.addEventListener('orientationchange', updateDeviceInfo)

    return () => {
      window.removeEventListener('resize', updateDeviceInfo)
      window.removeEventListener('orientationchange', updateDeviceInfo)
    }
  }, [])

  return deviceInfo
}

/**
 * Mobile-optimized touch button component
 */
export function TouchButton({
  children,
  onClick,
  className = '',
  disabled = false,
  variant = 'primary',
  size = 'md',
  hapticFeedback = true,
  ...props
}: {
  children: React.ReactNode
  onClick?: () => void
  className?: string
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  hapticFeedback?: boolean
  [key: string]: any
}) {
  const { isMobile } = useEnhancedResponsive()
  
  const handleClick = useCallback(() => {
    if (disabled) return
    
    // Haptic feedback for mobile devices
    if (hapticFeedback && isMobile && 'vibrate' in navigator) {
      navigator.vibrate(10)
    }
    
    onClick?.()
  }, [disabled, hapticFeedback, isMobile, onClick])
  
  const baseClasses = 'font-medium rounded-lg transition-all duration-200 active:scale-95 select-none'
  const sizeClasses = {
    sm: isMobile ? 'px-4 py-3 text-sm min-h-[44px] min-w-[44px]' : 'px-3 py-2 text-sm',
    md: isMobile ? 'px-6 py-4 text-base min-h-[48px] min-w-[48px]' : 'px-4 py-2 text-base',
    lg: isMobile ? 'px-8 py-5 text-lg min-h-[52px] min-w-[52px]' : 'px-6 py-3 text-lg'
  }
  
  const variantClasses = {
    primary: 'bg-[#FFD700] text-black hover:bg-[#FFD700]/90 active:bg-[#FFD700]/80 shadow-lg',
    secondary: 'bg-gray-700 text-white hover:bg-gray-600 active:bg-gray-800 shadow-md',
    outline: 'border-2 border-[#FFD700] text-[#FFD700] hover:bg-[#FFD700] hover:text-black active:bg-[#FFD700]/90',
    ghost: 'text-[#FFD700] hover:bg-[#FFD700]/10 active:bg-[#FFD700]/20'
  }

  return (
    <motion.button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${className}`}
      onClick={handleClick}
      disabled={disabled}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      whileHover={{ scale: disabled ? 1 : 1.02 }}
      {...props}
    >
      {children}
    </motion.button>
  )
}

/**
 * Mobile-optimized input with enhanced touch targets
 */
export function TouchInput({
  label,
  error,
  className = '',
  autoFocus = false,
  ...props
}: {
  label?: string
  error?: string
  className?: string
  autoFocus?: boolean
  [key: string]: any
}) {
  const { isMobile } = useEnhancedResponsive()
  const [isFocused, setIsFocused] = useState(false)
  
  const inputClasses = `
    w-full rounded-lg border bg-gray-900 text-white transition-all duration-200
    focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent
    ${isMobile ? 'px-4 py-4 text-base min-h-[48px]' : 'px-3 py-2 text-sm'}
    ${error ? 'border-red-500 focus:ring-red-500' : 'border-gray-600 hover:border-gray-500'}
    ${isFocused ? 'transform scale-[1.02]' : ''}
    ${className}
  `

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {label}
        </label>
      )}
      <input
        className={inputClasses}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        autoFocus={autoFocus && !isMobile} // Prevent auto-focus on mobile to avoid keyboard popup
        {...props}
      />
      {error && (
        <motion.p 
          className="mt-1 text-sm text-red-400"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
        >
          {error}
        </motion.p>
      )}
    </div>
  )
}