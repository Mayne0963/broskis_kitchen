"use client"

import React, { useState, useRef, useEffect } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'

interface OptimizedImageProps {
  src: string
  alt: string
  width: number
  height: number
  priority?: boolean
  className?: string
  sizes?: string
  quality?: number
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  onLoad?: () => void
  style?: React.CSSProperties
}

/**
 * Optimized Image component with lazy loading, intersection observer, and performance enhancements
 */
export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  className = '',
  sizes,
  quality = 85,
  placeholder = 'empty',
  blurDataURL,
  onLoad,
  style,
  ...props
}: OptimizedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(priority)
  const [hasError, setHasError] = useState(false)
  const imgRef = useRef<HTMLDivElement>(null)

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority) return // Skip intersection observer for priority images

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      {
        rootMargin: '50px', // Start loading 50px before the image enters viewport
        threshold: 0.1,
      }
    )

    if (imgRef.current) {
      observer.observe(imgRef.current)
    }

    return () => observer.disconnect()
  }, [priority])

  const handleLoad = () => {
    setIsLoaded(true)
    onLoad?.()
  }

  const handleError = () => {
    setHasError(true)
    console.warn(`Failed to load image: ${src}`)
  }

  // Generate optimized sizes if not provided
  const defaultSizes = sizes || `(max-width: 768px) ${Math.min(width, 400)}px, ${width}px`

  return (
    <div ref={imgRef} className={`relative overflow-hidden ${className}`} style={style}>
      {/* Loading placeholder */}
      {!isLoaded && !hasError && (
        <div 
          className="absolute inset-0 bg-gray-800 animate-pulse flex items-center justify-center"
          style={{ width, height }}
        >
          <div className="w-8 h-8 border-2 border-[#FFD700] border-t-transparent rounded-full animate-spin" />
        </div>
      )}

      {/* Error fallback */}
      {hasError && (
        <div 
          className="absolute inset-0 bg-gray-900 flex items-center justify-center text-gray-400"
          style={{ width, height }}
        >
          <span className="text-sm">Failed to load image</span>
        </div>
      )}

      {/* Actual image */}
      {(isInView || priority) && !hasError && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: isLoaded ? 1 : 0 }}
          transition={{ duration: 0.3 }}
        >
          <Image
            src={src}
            alt={alt}
            width={width}
            height={height}
            priority={priority}
            quality={quality}
            sizes={defaultSizes}
            placeholder={placeholder}
            blurDataURL={blurDataURL}
            onLoad={handleLoad}
            onError={handleError}
            className="w-full h-auto"
            {...props}
            unoptimized
          />
        </motion.div>
      )}
    </div>
  )
}

/**
 * Hook for preloading critical images
 */
export function useImagePreloader(imageSources: string[]) {
  useEffect(() => {
    const preloadImages = imageSources.map(src => {
      const img = new window.Image()
      img.src = src
      return img
    })

    return () => {
      preloadImages.forEach(img => {
        img.src = ''
      })
    }
  }, [imageSources])
}

/**
 * Generate blur data URL for placeholder
 */
export function generateBlurDataURL(width: number = 10, height: number = 10): string {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  
  if (ctx) {
    const gradient = ctx.createLinearGradient(0, 0, width, height)
    gradient.addColorStop(0, '#1a1a1a')
    gradient.addColorStop(1, '#2a2a2a')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)
  }
  
  return canvas.toDataURL()
}