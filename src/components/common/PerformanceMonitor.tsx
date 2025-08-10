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
  // Only log in development or send to analytics in production
  if (process.env.NODE_ENV === 'development') {
    console.group(`🔍 Performance Metric: ${metric.name}`)
    console.log(`Value: ${metric.value}ms`)
    console.log(`Rating: ${metric.rating}`)
    console.log(`Delta: ${metric.delta}ms`)
    console.log(`ID: ${metric.id}`)
    console.groupEnd()
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
          console.group('🚀 Navigation Performance')
          console.log(`DNS Lookup: ${navEntry.domainLookupEnd - navEntry.domainLookupStart}ms`)
          console.log(`TCP Connect: ${navEntry.connectEnd - navEntry.connectStart}ms`)
          console.log(`Request: ${navEntry.responseStart - navEntry.requestStart}ms`)
          console.log(`Response: ${navEntry.responseEnd - navEntry.responseStart}ms`)
          console.log(`DOM Processing: ${navEntry.domContentLoadedEventEnd - navEntry.responseEnd}ms`)
          console.log(`Total Load Time: ${navEntry.loadEventEnd - navEntry.navigationStart}ms`)
          console.groupEnd()
        }
        
        if (entry.entryType === 'resource') {
          const resourceEntry = entry as PerformanceResourceTiming
          // Log slow resources (>1s)
          if (resourceEntry.duration > 1000) {
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
        
        if (usedMB > limitMB * 0.8) {
          console.warn(`⚠️ High Memory Usage: ${usedMB}MB / ${limitMB}MB`)
        }
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`💾 Memory: ${usedMB}MB used, ${totalMB}MB total, ${limitMB}MB limit`)
        }
      }
    }

    const interval = setInterval(checkMemory, 30000) // Check every 30 seconds
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
      
      if (renderTime > 100) {
        console.warn(`⚠️ Slow Component: ${componentName} took ${renderTime.toFixed(2)}ms to render`)
      }
    }
  }, [])
}