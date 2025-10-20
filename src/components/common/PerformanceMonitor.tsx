"use client"

import { useEffect } from 'react'
import { onCLS, onFCP, onLCP, onTTFB, onINP } from 'web-vitals'

interface MetricData {
  name: string
  value: number
  rating: 'good' | 'needs-improvement' | 'poor'
  delta: number
  id: string
}

function sendToAnalytics(metric: MetricData) {
  // Completely suppress console output in development for clean console
  if (process.env.NODE_ENV === 'development') {
    // Silent monitoring - no console output
    return;
  }
  
  // In production, you could send to analytics service
  // Example: gtag('event', metric.name, { value: metric.value })
}

export default function PerformanceMonitor() {
  useEffect(() => {
    // Measure Core Web Vitals
    onCLS(sendToAnalytics)
    onINP(sendToAnalytics) // INP replaced FID in newer web-vitals
    onFCP(sendToAnalytics)
    onLCP(sendToAnalytics)
    onTTFB(sendToAnalytics)

    // Monitor resource loading
    const observer = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.entryType === 'navigation') {
          const navEntry = entry as PerformanceNavigationTiming
          // Only log navigation performance in development and if it's slow
          const totalLoadTime = navEntry.loadEventEnd - navEntry.navigationStart
          if (process.env.NODE_ENV === 'development' && totalLoadTime > 3000) {
            console.group('🚀 Navigation Performance (Slow)')
            console.log(`DNS Lookup: ${navEntry.domainLookupEnd - navEntry.domainLookupStart}ms`)
            console.log(`TCP Connect: ${navEntry.connectEnd - navEntry.connectStart}ms`)
            console.log(`Request: ${navEntry.responseStart - navEntry.requestStart}ms`)
            console.log(`Response: ${navEntry.responseEnd - navEntry.responseStart}ms`)
            console.log(`DOM Processing: ${navEntry.domContentLoadedEventEnd - navEntry.responseEnd}ms`)
            console.log(`Total Load Time: ${totalLoadTime}ms`)
            console.groupEnd()
          }
        }
        
        if (entry.entryType === 'resource') {
          const resourceEntry = entry as PerformanceResourceTiming
          // Silent monitoring - no console output in development
          if (process.env.NODE_ENV === 'production' && 
              resourceEntry.duration > 2000 && 
              !resourceEntry.name.includes('firestore.googleapis.com') &&
              !resourceEntry.name.includes('googleapis.com')) {
            console.warn(`⚠️ Slow Resource: ${resourceEntry.name} took ${resourceEntry.duration}ms`)
          }
        }
      }
    })

    observer.observe({ entryTypes: ['navigation', 'resource'] })

    return () => observer.disconnect()
  }, [])

  // Monitor memory usage
  useEffect(() => {
    const checkMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory
        const usedMB = Math.round(memory.usedJSHeapSize / 1048576)
        const totalMB = Math.round(memory.totalJSHeapSize / 1048576)
        const limitMB = Math.round(memory.jsHeapSizeLimit / 1048576)
        
        // Silent monitoring - no console output in development
        if (process.env.NODE_ENV === 'production') {
          if (usedMB > limitMB * 0.8) {
            console.warn(`⚠️ High Memory Usage: ${usedMB}MB / ${limitMB}MB`)
          }
          
          if (usedMB > limitMB * 0.5) {
            console.log(`💾 Memory: ${usedMB}MB used, ${totalMB}MB total, ${limitMB}MB limit`)
          }
        }
      }
    }

    // Increase interval to reduce console noise (check every 60 seconds instead of 30)
    const interval = setInterval(checkMemory, 60000)
    return () => clearInterval(interval)
  }, [])

  return null // This component doesn't render anything
}

// Hook for component-level performance monitoring
export function usePerformanceMonitor(componentName: string) {
  useEffect(() => {
    const startTime = performance.now()
    
    return () => {
      const endTime = performance.now()
      const renderTime = endTime - startTime
      
      // Silent monitoring - no console output in development
      if (process.env.NODE_ENV === 'production' && renderTime > 100) {
        console.warn(`⚠️ Slow Component: ${componentName} took ${renderTime.toFixed(2)}ms to render`)
      }
    }
  }, [componentName])
}