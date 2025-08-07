"use client"

import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface MobileOptimizerProps {
  children: React.ReactNode
  enableTouchOptimizations?: boolean
  enableViewportOptimizations?: boolean
}

/**
 * Mobile optimization wrapper component
 */
export default function MobileOptimizer({
  children,
  enableTouchOptimizations = true,
  enableViewportOptimizations = true
}: MobileOptimizerProps) {
  const [isMobile, setIsMobile] = useState(false)
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait')
  const [viewportHeight, setViewportHeight] = useState(0)

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
      setOrientation(window.innerHeight > window.innerWidth ? 'portrait' : 'landscape')
      setViewportHeight(window.innerHeight)
    }

    checkMobile()
    window.addEventListener('resize', checkMobile)
    window.addEventListener('orientationchange', checkMobile)

    return () => {
      window.removeEventListener('resize', checkMobile)
      window.removeEventListener('orientationchange', checkMobile)
    }
  }, [])

  useEffect(() => {
    if (!enableTouchOptimizations) return

    // Prevent zoom on double tap
    let lastTouchEnd = 0
    const preventZoom = (e: TouchEvent) => {
      const now = new Date().getTime()
      if (now - lastTouchEnd <= 300) {
        e.preventDefault()
      }
      lastTouchEnd = now
    }

    document.addEventListener('touchend', preventZoom, { passive: false })

    // Improve touch responsiveness
    document.body.style.touchAction = 'manipulation'

    return () => {
      document.removeEventListener('touchend', preventZoom)
      document.body.style.touchAction = 'auto'
    }
  }, [enableTouchOptimizations])

  useEffect(() => {
    if (!enableViewportOptimizations) return

    // Handle viewport height changes (mobile browsers)
    const setVH = () => {
      const vh = window.innerHeight * 0.01
      document.documentElement.style.setProperty('--vh', `${vh}px`)
    }

    setVH()
    window.addEventListener('resize', setVH)
    window.addEventListener('orientationchange', setVH)

    return () => {
      window.removeEventListener('resize', setVH)
      window.removeEventListener('orientationchange', setVH)
    }
  }, [enableViewportOptimizations])

  return (
    <div 
      className={`mobile-optimized ${isMobile ? 'is-mobile' : 'is-desktop'} ${orientation}`}
      data-mobile={isMobile}
      data-orientation={orientation}
    >
      {children}
    </div>
  )
}

/**
 * Hook for responsive breakpoints
 */
export function useResponsive() {
  const [breakpoint, setBreakpoint] = useState<'xs' | 'sm' | 'md' | 'lg' | 'xl'>('md')
  const [isMobile, setIsMobile] = useState(false)
  const [isTablet, setIsTablet] = useState(false)
  const [isDesktop, setIsDesktop] = useState(false)

  useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth
      
      if (width < 480) {
        setBreakpoint('xs')
        setIsMobile(true)
        setIsTablet(false)
        setIsDesktop(false)
      } else if (width < 640) {
        setBreakpoint('sm')
        setIsMobile(true)
        setIsTablet(false)
        setIsDesktop(false)
      } else if (width < 768) {
        setBreakpoint('md')
        setIsMobile(false)
        setIsTablet(true)
        setIsDesktop(false)
      } else if (width < 1024) {
        setBreakpoint('lg')
        setIsMobile(false)
        setIsTablet(true)
        setIsDesktop(false)
      } else {
        setBreakpoint('xl')
        setIsMobile(false)
        setIsTablet(false)
        setIsDesktop(true)
      }
    }

    updateBreakpoint()
    window.addEventListener('resize', updateBreakpoint)

    return () => window.removeEventListener('resize', updateBreakpoint)
  }, [])

  return {
    breakpoint,
    isMobile,
    isTablet,
    isDesktop,
    isSmallScreen: breakpoint === 'xs' || breakpoint === 'sm',
    isMediumScreen: breakpoint === 'md' || breakpoint === 'lg',
    isLargeScreen: breakpoint === 'xl'
  }
}

/**
 * Mobile-optimized button component
 */
export function MobileButton({
  children,
  onClick,
  className = '',
  disabled = false,
  variant = 'primary',
  size = 'md',
  ...props
}: {
  children: React.ReactNode
  onClick?: () => void
  className?: string
  disabled?: boolean
  variant?: 'primary' | 'secondary' | 'outline'
  size?: 'sm' | 'md' | 'lg'
  [key: string]: any
}) {
  const { isMobile } = useResponsive()
  
  const baseClasses = 'font-medium rounded-lg transition-all duration-200 active:scale-95'
  const sizeClasses = {
    sm: isMobile ? 'px-4 py-3 text-sm min-h-[44px]' : 'px-3 py-2 text-sm',
    md: isMobile ? 'px-6 py-4 text-base min-h-[48px]' : 'px-4 py-2 text-base',
    lg: isMobile ? 'px-8 py-5 text-lg min-h-[52px]' : 'px-6 py-3 text-lg'
  }
  
  const variantClasses = {
    primary: 'bg-[#FFD700] text-black hover:bg-[#FFD700]/90 active:bg-[#FFD700]/80',
    secondary: 'bg-gray-700 text-white hover:bg-gray-600 active:bg-gray-800',
    outline: 'border-2 border-[#FFD700] text-[#FFD700] hover:bg-[#FFD700] hover:text-black'
  }

  return (
    <motion.button
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      onClick={onClick}
      disabled={disabled}
      whileTap={{ scale: disabled ? 1 : 0.95 }}
      {...props}
    >
      {children}
    </motion.button>
  )
}

/**
 * Mobile-optimized input component
 */
export function MobileInput({
  label,
  error,
  className = '',
  ...props
}: {
  label?: string
  error?: string
  className?: string
  [key: string]: any
}) {
  const { isMobile } = useResponsive()
  
  const inputClasses = `
    w-full rounded-lg border bg-gray-900 text-white transition-colors
    focus:outline-none focus:ring-2 focus:ring-[#FFD700] focus:border-transparent
    ${isMobile ? 'px-4 py-4 text-base min-h-[48px]' : 'px-3 py-2 text-sm'}
    ${error ? 'border-red-500' : 'border-gray-600 hover:border-gray-500'}
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
        {...props}
      />
      {error && (
        <p className="mt-1 text-sm text-red-400">{error}</p>
      )}
    </div>
  )
}

/**
 * Mobile navigation helper
 */
export function MobileNavigation({
  isOpen,
  onClose,
  children
}: {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
}) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed top-0 right-0 h-full w-80 max-w-[90vw] bg-black border-l border-[#FFD700] z-50 overflow-y-auto"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'tween', duration: 0.3 }}
          >
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}