"use client"

import React, { useState, useRef, useEffect, useCallback } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'

interface EnhancedImageProps {
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
  lazy?: boolean
  webpFallback?: boolean
  compressionLevel?: 'low' | 'medium' | 'high'
}

/**
 * Enhanced Image component with advanced optimization features
 */
export function EnhancedImage({
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
  lazy = true,
  webpFallback = true,
  compressionLevel = 'medium',
  ...props
}: EnhancedImageProps) {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(priority || !lazy)
  const [hasError, setHasError] = useState(false)
  const [currentSrc, setCurrentSrc] = useState(src)
  const imgRef = useRef<HTMLDivElement>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)

  // Generate optimized image source with WebP support
  const getOptimizedSrc = useCallback((originalSrc: string) => {
    if (webpFallback && !originalSrc.endsWith('.svg')) {
      // For Next.js Image component, we rely on automatic WebP conversion
      return originalSrc
    }
    return originalSrc
  }, [webpFallback])

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (!lazy || priority) return

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observerRef.current?.disconnect()
        }
      },
      {
        rootMargin: '100px', // Start loading 100px before entering viewport
        threshold: 0.1,
      }
    )

    if (imgRef.current) {
      observerRef.current.observe(imgRef.current)
    }

    return () => {
      observerRef.current?.disconnect()
    }
  }, [lazy, priority])

  const handleLoad = useCallback(() => {
    setIsLoaded(true)
    onLoad?.()
  }, [onLoad])

  const handleError = useCallback(() => {
    setHasError(true)
    console.warn(`Failed to load image: ${src}`)
    
    // Try fallback to original format if WebP fails
    if (webpFallback && currentSrc !== src) {
      setCurrentSrc(src)
      setHasError(false)
    }
  }, [src, currentSrc, webpFallback])

  // Update source when src prop changes
  useEffect(() => {
    setCurrentSrc(getOptimizedSrc(src))
    setIsLoaded(false)
    setHasError(false)
  }, [src, getOptimizedSrc])

  // Generate responsive sizes if not provided
  const responsiveSizes = sizes || (
    width > 1200 ? '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw' :
    width > 800 ? '(max-width: 768px) 100vw, 50vw' :
    '(max-width: 768px) 100vw, 400px'
  )

  // Adjust quality based on compression level
  const adjustedQuality = {
    low: 60,
    medium: 85,
    high: 95
  }[compressionLevel]

  return (
    <div 
      ref={imgRef} 
      className={`relative overflow-hidden ${className}`} 
      style={style}
    >
      {/* Loading placeholder with skeleton */}
      {!isLoaded && !hasError && (
        <div 
          className="absolute inset-0 bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 animate-pulse"
          style={{ width, height }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-600 to-transparent animate-shimmer" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-[#FFD700] border-t-transparent rounded-full animate-spin" />
          </div>
        </div>
      )}

      {/* Error fallback */}
      {hasError && (
        <div 
          className="absolute inset-0 bg-gray-900 flex flex-col items-center justify-center text-gray-400 border border-gray-700"
          style={{ width, height }}
        >
          <svg className="w-8 h-8 mb-2" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
          </svg>
          <span className="text-xs text-center px-2">Image unavailable</span>
        </div>
      )}

      {/* Actual image */}
      {(isInView || priority) && !hasError && (
        <motion.div
          initial={{ opacity: 0, scale: 1.05 }}
          animate={{ 
            opacity: isLoaded ? 1 : 0,
            scale: isLoaded ? 1 : 1.05
          }}
          transition={{ 
            duration: 0.4,
            ease: [0.25, 0.46, 0.45, 0.94]
          }}
        >
          <Image
            src={currentSrc}
            alt={alt}
            width={width}
            height={height}
            priority={priority}
            quality={adjustedQuality}
            sizes={responsiveSizes}
            placeholder={placeholder}
            blurDataURL={blurDataURL || generateBlurDataURL(width, height)}
            onLoad={handleLoad}
            onError={handleError}
            className="w-full h-auto transition-transform duration-300 hover:scale-105"
            {...props}
          />
        </motion.div>
      )}
    </div>
  )
}

/**
 * Hook for batch image preloading with priority queue
 */
export function useImagePreloader(imageSources: string[], priority: 'high' | 'medium' | 'low' = 'medium') {
  const [loadedImages, setLoadedImages] = useState<Set<string>>(new Set())
  const [failedImages, setFailedImages] = useState<Set<string>>(new Set())

  useEffect(() => {
    const preloadQueue = imageSources.map((src, index) => ({ src, index }))
    const batchSize = priority === 'high' ? 6 : priority === 'medium' ? 4 : 2
    
    const preloadBatch = async (batch: { src: string; index: number }[]) => {
      const promises = batch.map(({ src }) => {
        return new Promise<string>((resolve, reject) => {
          const img = new window.Image()
          img.onload = () => {
            setLoadedImages(prev => new Set([...prev, src]))
            resolve(src)
          }
          img.onerror = () => {
            setFailedImages(prev => new Set([...prev, src]))
            reject(src)
          }
          img.src = src
        })
      })

      try {
        await Promise.allSettled(promises)
      } catch (error) {
        console.warn('Some images failed to preload:', error)
      }
    }

    const processBatches = async () => {
      for (let i = 0; i < preloadQueue.length; i += batchSize) {
        const batch = preloadQueue.slice(i, i + batchSize)
        await preloadBatch(batch)
        
        // Add delay between batches to prevent overwhelming the browser
        if (i + batchSize < preloadQueue.length) {
          await new Promise(resolve => setTimeout(resolve, 100))
        }
      }
    }

    processBatches()

    return () => {
      // Cleanup is handled by garbage collection
    }
  }, [imageSources, priority])

  return { loadedImages, failedImages }
}

/**
 * Generate optimized blur data URL
 */
export function generateBlurDataURL(width: number = 10, height: number = 10): string {
  if (typeof window === 'undefined') {
    // Server-side fallback
    return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAiIGhlaWdodD0iMTAiIHZpZXdCb3g9IjAgMCAxMCAxMCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPHJlY3Qgd2lkdGg9IjEwIiBoZWlnaHQ9IjEwIiBmaWxsPSIjMUExQTFBIi8+Cjwvc3ZnPgo='
  }

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  
  if (ctx) {
    const gradient = ctx.createLinearGradient(0, 0, width, height)
    gradient.addColorStop(0, '#1a1a1a')
    gradient.addColorStop(0.5, '#2a2a2a')
    gradient.addColorStop(1, '#1a1a1a')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, width, height)
  }
  
  return canvas.toDataURL('image/jpeg', 0.1)
}

/**
 * Image compression utility
 */
export function compressImage(
  file: File, 
  quality: number = 0.8, 
  maxWidth: number = 1920, 
  maxHeight: number = 1080
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new window.Image()

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img
      
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height)
        width *= ratio
        height *= ratio
      }

      canvas.width = width
      canvas.height = height

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height)
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to compress image'))
          }
        },
        'image/jpeg',
        quality
      )
    }

    img.onerror = () => reject(new Error('Failed to load image'))
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Critical image preloader for above-the-fold content
 */
export function useCriticalImagePreloader(criticalImages: string[]) {
  useEffect(() => {
    // Preload critical images immediately
    const preloadPromises = criticalImages.map(src => {
      return new Promise<void>((resolve) => {
        const link = document.createElement('link')
        link.rel = 'preload'
        link.as = 'image'
        link.href = src
        link.onload = () => resolve()
        link.onerror = () => resolve() // Don't block on errors
        document.head.appendChild(link)
      })
    })

    Promise.all(preloadPromises).then(() => {
      console.log('Critical images preloaded')
    })

    return () => {
      // Cleanup preload links
      const preloadLinks = document.querySelectorAll('link[rel="preload"][as="image"]')
      preloadLinks.forEach(link => {
        if (criticalImages.some(src => link.getAttribute('href')?.includes(src))) {
          link.remove()
        }
      })
    }
  }, [criticalImages])
}

export default EnhancedImage