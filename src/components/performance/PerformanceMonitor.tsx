"use client"

import { useEffect } from 'react'
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals'

interface WebVitalMetric {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta: number
  id: string
}

/**
 * Performance monitoring component that tracks Core Web Vitals
 */
export default function PerformanceMonitor() {
  useEffect(() => {
    // Only run in production or when explicitly enabled
    if (process.env.NODE_ENV !== 'production' && !process.env.NEXT_PUBLIC_ENABLE_PERFORMANCE_MONITORING) {
      return
    }

    const handleMetric = (metric: WebVitalMetric) => {
      // Log metrics in development
      if (process.env.NODE_ENV === 'development') {
        console.group(`🚀 Web Vital: ${metric.name}`)
        console.log(`Value: ${metric.value}ms`)
        console.log(`Rating: ${metric.rating}`)
        console.log(`Delta: ${metric.delta}ms`)
        console.groupEnd()
      }

      // Send to analytics in production
      if (process.env.NODE_ENV === 'production') {
        // Example: Send to Google Analytics
        if (typeof window !== 'undefined' && (window as any).gtag) {
          (window as any).gtag('event', metric.name, {
            event_category: 'Web Vitals',
            event_label: metric.id,
            value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
            non_interaction: true,
          })
        }

        // Example: Send to custom analytics endpoint
        fetch('/api/analytics/web-vitals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: metric.name,
            value: metric.value,
            rating: metric.rating,
            delta: metric.delta,
            id: metric.id,
            url: window.location.href,
            timestamp: Date.now(),
          }),
        }).catch(error => {
          console.warn('Failed to send web vital metric:', error)
        })
      }
    }

    // Collect Core Web Vitals
    getCLS(handleMetric)
    getFID(handleMetric)
    getFCP(handleMetric)
    getLCP(handleMetric)
    getTTFB(handleMetric)

    // Additional performance monitoring
    if (typeof window !== 'undefined' && 'performance' in window) {
      // Monitor resource loading times
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach((entry) => {
          if (entry.entryType === 'navigation') {
            const navEntry = entry as PerformanceNavigationTiming
            const metrics = {
              domContentLoaded: navEntry.domContentLoadedEventEnd - navEntry.domContentLoadedEventStart,
              loadComplete: navEntry.loadEventEnd - navEntry.loadEventStart,
              firstByte: navEntry.responseStart - navEntry.requestStart,
              domInteractive: navEntry.domInteractive - navEntry.navigationStart,
            }

            if (process.env.NODE_ENV === 'development') {
              console.group('📊 Navigation Timing')
              console.log('DOM Content Loaded:', `${metrics.domContentLoaded}ms`)
              console.log('Load Complete:', `${metrics.loadComplete}ms`)
              console.log('First Byte:', `${metrics.firstByte}ms`)
              console.log('DOM Interactive:', `${metrics.domInteractive}ms`)
              console.groupEnd()
            }
          }

          if (entry.entryType === 'resource') {
            const resourceEntry = entry as PerformanceResourceTiming
            // Log slow resources (>1s)
            if (resourceEntry.duration > 1000) {
              console.warn(`Slow resource detected: ${resourceEntry.name} (${resourceEntry.duration}ms)`)
            }
          }
        })
      })

      observer.observe({ entryTypes: ['navigation', 'resource'] })

      return () => observer.disconnect()
    }
  }, [])

  // This component doesn't render anything
  return null
}

/**
 * Hook for tracking custom performance metrics
 */
export function usePerformanceMetric(name: string, value: number, category: string = 'Custom') {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`📈 Custom Metric - ${name}: ${value}ms`)
    }

    if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
      // Send to analytics
      if ((window as any).gtag) {
        (window as any).gtag('event', 'timing_complete', {
          name,
          value,
          event_category: category,
        })
      }
    }
  }, [name, value, category])
}

/**
 * Performance budget checker
 */
export function checkPerformanceBudget() {
  if (typeof window === 'undefined' || !('performance' in window)) return

  const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
  if (!navigation) return

  const budgets = {
    firstContentfulPaint: 1500, // 1.5s
    largestContentfulPaint: 2500, // 2.5s
    firstInputDelay: 100, // 100ms
    cumulativeLayoutShift: 0.1, // 0.1
    timeToFirstByte: 600, // 600ms
  }

  const actual = {
    timeToFirstByte: navigation.responseStart - navigation.requestStart,
    domContentLoaded: navigation.domContentLoadedEventEnd - navigation.navigationStart,
    loadComplete: navigation.loadEventEnd - navigation.navigationStart,
  }

  // Check budgets
  Object.entries(budgets).forEach(([metric, budget]) => {
    const actualValue = actual[metric as keyof typeof actual]
    if (actualValue && actualValue > budget) {
      console.warn(`⚠️ Performance Budget Exceeded: ${metric} (${actualValue}ms > ${budget}ms)`)
    }
  })
}

/**
 * Memory usage monitor
 */
export function monitorMemoryUsage() {
  if (typeof window === 'undefined' || !('performance' in window) || !(performance as any).memory) {
    return
  }

  const memory = (performance as any).memory
  const memoryInfo = {
    usedJSHeapSize: Math.round(memory.usedJSHeapSize / 1048576), // MB
    totalJSHeapSize: Math.round(memory.totalJSHeapSize / 1048576), // MB
    jsHeapSizeLimit: Math.round(memory.jsHeapSizeLimit / 1048576), // MB
  }

  if (process.env.NODE_ENV === 'development') {
    console.group('🧠 Memory Usage')
    console.log(`Used: ${memoryInfo.usedJSHeapSize}MB`)
    console.log(`Total: ${memoryInfo.totalJSHeapSize}MB`)
    console.log(`Limit: ${memoryInfo.jsHeapSizeLimit}MB`)
    console.groupEnd()
  }

  // Warn if memory usage is high
  const usagePercentage = (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100
  if (usagePercentage > 80) {
    console.warn(`⚠️ High memory usage detected: ${usagePercentage.toFixed(1)}%`)
  }

  return memoryInfo
}