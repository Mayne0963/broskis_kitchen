"use client"

import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'

interface LazySectionProps {
  children: React.ReactNode
  threshold?: number
  rootMargin?: string
  className?: string
  fallback?: React.ReactNode
  delay?: number
}

export default function LazySection({
  children,
  threshold = 0.1,
  rootMargin = '50px',
  className = '',
  fallback = null,
  delay = 0
}: LazySectionProps) {
  const [isVisible, setIsVisible] = useState(false)
  const [shouldRender, setShouldRender] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          // Add delay before rendering to prevent layout shift
          setTimeout(() => {
            setShouldRender(true)
          }, delay)
          observer.disconnect()
        }
      },
      {
        threshold,
        rootMargin
      }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [threshold, rootMargin, delay])

  return (
    <div ref={ref} className={className}>
      {shouldRender ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
        >
          {children}
        </motion.div>
      ) : (
        fallback || (
          <div className="min-h-[200px] flex items-center justify-center">
            <div className="animate-pulse bg-gray-800 rounded-lg w-full h-48"></div>
          </div>
        )
      )}
    </div>
  )
}

// Skeleton loader component for consistent loading states
export function SkeletonLoader({ className = '' }: { className?: string }) {
  return (
    <div className={`animate-pulse ${className}`}>
      <div className="bg-gray-800 rounded-lg h-48 mb-4"></div>
      <div className="space-y-2">
        <div className="bg-gray-800 rounded h-4 w-3/4"></div>
        <div className="bg-gray-800 rounded h-4 w-1/2"></div>
      </div>
    </div>
  )
}