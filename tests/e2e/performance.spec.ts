import { test, expect, Page } from '@playwright/test'
import fs from 'fs'
import path from 'path'

/**
 * Performance Monitoring Test Suite
 * Monitors and documents performance metrics, load times, and resource usage
 */

interface PerformanceMetrics {
  url: string
  loadTime: number
  domContentLoaded: number
  firstContentfulPaint: number
  largestContentfulPaint: number
  timeToInteractive: number
  totalBlockingTime: number
  resourceCount: number
  resourceSizes: {
    total: number
    images: number
    scripts: number
    stylesheets: number
    fonts: number
  }
  memoryUsage: {
    usedJSHeapSize: number
    totalJSHeapSize: number
  }
  timestamp: string
}

async function collectPerformanceMetrics(page: Page, url: string): Promise<PerformanceMetrics> {
  const startTime = Date.now()
  
  await page.goto(url, { waitUntil: 'networkidle' })
  
  const loadTime = Date.now() - startTime
  
  const metrics = await page.evaluate(() => {
    // Navigation timing
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    
    // Paint timing
    const paintEntries = performance.getEntriesByType('paint')
    const fcp = paintEntries.find(entry => entry.name === 'first-contentful-paint')
    
    // LCP timing
    const lcpEntries = performance.getEntriesByType('largest-contentful-paint')
    const lcp = lcpEntries[0]
    
    // Resource timing
    const resources = performance.getEntriesByType('resource')
    
    // Calculate resource sizes by type
    const resourceSizes = {
      total: 0,
      images: 0,
      scripts: 0,
      stylesheets: 0,
      fonts: 0
    }
    
    resources.forEach(resource => {
      const size = (resource as any).transferSize || 0
      resourceSizes.total += size
      
      if (resource.name.includes('.jpg') || resource.name.includes('.png') || resource.name.includes('.svg')) {
        resourceSizes.images += size
      } else if (resource.name.includes('.js')) {
        resourceSizes.scripts += size
      } else if (resource.name.includes('.css')) {
        resourceSizes.stylesheets += size
      } else if (resource.name.includes('.woff') || resource.name.includes('.ttf')) {
        resourceSizes.fonts += size
      }
    })
    
    // Memory usage (if available)
    const memoryInfo = (performance as any).memory || {}
    
    return {
      navigationTiming: navigation ? {
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.startTime,
        loadComplete: navigation.loadEventEnd - navigation.startTime,
        responseTime: navigation.responseEnd - navigation.requestStart
      } : null,
      paintTiming: {
        firstContentfulPaint: fcp?.startTime || null,
        largestContentfulPaint: lcp?.startTime || null
      },
      resourceCount: resources.length,
      resourceSizes,
      memoryUsage: {
        usedJSHeapSize: memoryInfo.usedJSHeapSize || 0,
        totalJSHeapSize: memoryInfo.totalJSHeapSize || 0
      }
    }
  })
  
  return {
    url,
    loadTime,
    domContentLoaded: metrics.navigationTiming?.domContentLoaded || 0,
    firstContentfulPaint: metrics.paintTiming.firstContentfulPaint || 0,
    largestContentfulPaint: metrics.paintTiming.largestContentfulPaint || 0,
    timeToInteractive: metrics.navigationTiming?.loadComplete || 0,
    totalBlockingTime: 0, // Would need Long Tasks API
    resourceCount: metrics.resourceCount,
    resourceSizes: metrics.resourceSizes,
    memoryUsage: metrics.memoryUsage,
    timestamp: new Date().toISOString()
  }
}

function saveMetrics(metrics: PerformanceMetrics[], filename: string) {
  const filePath = path.join('test-results', 'performance', filename)
  
  // Ensure directory exists
  const dir = path.dirname(filePath)
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
  
  fs.writeFileSync(filePath, JSON.stringify(metrics, null, 2))
  return filePath
}

test.describe('Performance Monitoring', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000) // 60 seconds for performance tests
  })

  test.describe('Page Load Performance', () => {
    const pages = [
      { path: '/', name: 'Homepage' },
      { path: '/menu', name: 'Menu' },
      { path: '/about', name: 'About' },
      { path: '/contact', name: 'Contact' },
      { path: '/shop', name: 'Shop' },
      { path: '/cart', name: 'Cart' }
    ]

    pages.forEach(({ path, name }) => {
      test(`${name} performance metrics`, async ({ page }) => {
        const url = `http://localhost:3000${path}`
        const metrics = await collectPerformanceMetrics(page, url)
        
        // Performance assertions
        expect(metrics.loadTime).toBeLessThan(5000) // 5 seconds max
        expect(metrics.domContentLoaded).toBeLessThan(3000) // 3 seconds max
        expect(metrics.firstContentfulPaint).toBeLessThan(2000) // 2 seconds max
        expect(metrics.resourceCount).toBeLessThan(100) // Max 100 resources
        expect(metrics.resourceSizes.total).toBeLessThan(5 * 1024 * 1024) // 5MB max total
        
        // Save metrics
        const filePath = saveMetrics([metrics], `${name.toLowerCase()}-performance.json`)
        
        console.log(`${name} Performance:`)
        console.log(`  Load Time: ${metrics.loadTime}ms`)
        console.log(`  DOM Content Loaded: ${metrics.domContentLoaded}ms`)
        console.log(`  First Contentful Paint: ${metrics.firstContentfulPaint}ms`)
        console.log(`  Resources: ${metrics.resourceCount}`)
        console.log(`  Total Size: ${(metrics.resourceSizes.total / 1024 / 1024).toFixed(2)}MB`)
      })
    })
  })

  test.describe('Resource Loading Performance', () => {
    test('Image optimization and loading', async ({ page }) => {
      await page.goto('http://localhost:3000')
      
      const imageMetrics = await page.evaluate(() => {
        const images = Array.from(document.querySelectorAll('img'))
        
        return images.map(img => ({
          src: img.src,
          width: img.naturalWidth,
          height: img.naturalHeight,
          size: img.src.length,
          loading: img.loading,
          complete: img.complete
        }))
      })
      
      // Check for optimized images
      const largeImages = imageMetrics.filter(img => 
        img.width * img.height > 1920 * 1080 // Larger than 1080p
      )
      
      expect(largeImages.length).toBeLessThan(3) // Max 3 large images
      
      // Check for lazy loading
      const lazyLoadedImages = imageMetrics.filter(img => img.loading === 'lazy')
      expect(lazyLoadedImages.length).toBeGreaterThan(0)
      
      // Save image metrics
      saveMetrics([{ images: imageMetrics, timestamp: new Date().toISOString() }], 'image-performance.json')
    })

    test('JavaScript bundle size and loading', async ({ page }) => {
      await page.goto('http://localhost:3000')
      
      const jsMetrics = await page.evaluate(() => {
        const scripts = Array.from(document.querySelectorAll('script[src]'))
        
        return scripts.map(script => ({
          src: script.src,
          async: script.async,
          defer: script.defer,
          type: script.type
        }))
      })
      
      // Check for optimized loading
      const asyncScripts = jsMetrics.filter(script => script.async)
      const deferScripts = jsMetrics.filter(script => script.defer)
      
      expect(asyncScripts.length + deferScripts.length).toBeGreaterThan(0)
      
      // Save JS metrics
      saveMetrics([{ scripts: jsMetrics, timestamp: new Date().toISOString() }], 'javascript-performance.json')
    })

    test('CSS loading and critical CSS', async ({ page }) => {
      await page.goto('http://localhost:3000')
      
      const cssMetrics = await page.evaluate(() => {
        const stylesheets = Array.from(document.querySelectorAll('link[rel="stylesheet"]'))
        const inlineStyles = Array.from(document.querySelectorAll('style'))
        
        return {
          externalStylesheets: stylesheets.length,
          inlineStyles: inlineStyles.length,
          totalStylesheets: stylesheets.length + inlineStyles.length
        }
      })
      
      // Check for reasonable number of stylesheets
      expect(cssMetrics.totalStylesheets).toBeLessThan(10)
      
      // Save CSS metrics
      saveMetrics([{ css: cssMetrics, timestamp: new Date().toISOString() }], 'css-performance.json')
    })
  })

  test.describe('Memory Usage Monitoring', () => {
    test('Memory usage during navigation', async ({ page }) => {
      const memorySnapshots = []
      
      const pages = ['/', '/menu', '/about', '/contact', '/shop']
      
      for (const path of pages) {
        await page.goto(`http://localhost:3000${path}`)
        
        // Wait for page to settle
        await page.waitForTimeout(2000)
        
        const memoryInfo = await page.evaluate(() => {
          const info = (performance as any).memory || {}
          return {
            usedJSHeapSize: info.usedJSHeapSize || 0,
            totalJSHeapSize: info.totalJSHeapSize || 0,
            jsHeapSizeLimit: info.jsHeapSizeLimit || 0
          }
        })
        
        memorySnapshots.push({
          page: path,
          memory: memoryInfo,
          timestamp: new Date().toISOString()
        })
      }
      
      // Check for memory leaks (increasing usage over time)
      const firstPageMemory = memorySnapshots[0].memory.usedJSHeapSize
      const lastPageMemory = memorySnapshots[memorySnapshots.length - 1].memory.usedJSHeapSize
      
      const memoryIncrease = lastPageMemory - firstPageMemory
      const memoryIncreasePercent = (memoryIncrease / firstPageMemory) * 100
      
      expect(memoryIncreasePercent).toBeLessThan(50) // Less than 50% increase
      
      // Save memory metrics
      saveMetrics(memorySnapshots, 'memory-usage.json')
    })
  })

  test.describe('Network Performance', () => {
    test('Network request timing', async ({ page }) => {
      const networkMetrics = []
      
      page.on('response', (response) => {
        const timing = response.request().timing()
        networkMetrics.push({
          url: response.url(),
          status: response.status(),
          timing: {
            startTime: timing.startTime,
            domainLookupStart: timing.domainLookupStart,
            domainLookupEnd: timing.domainLookupEnd,
            connectStart: timing.connectStart,
            connectEnd: timing.connectEnd,
            requestStart: timing.requestStart,
            responseStart: timing.responseStart,
            responseEnd: timing.responseEnd
          },
          duration: response.timing().responseEnd - response.timing().requestStart
        })
      })
      
      await page.goto('http://localhost:3000')
      
      // Wait for network to settle
      await page.waitForTimeout(5000)
      
      // Filter slow requests
      const slowRequests = networkMetrics.filter(req => req.duration > 1000) // > 1 second
      
      expect(slowRequests.length).toBeLessThan(5) // Max 5 slow requests
      
      // Save network metrics
      saveMetrics(networkMetrics, 'network-performance.json')
    })

    test('CDN and caching performance', async ({ page }) => {
      await page.goto('http://localhost:3000')
      
      const cacheMetrics = await page.evaluate(() => {
        const resources = performance.getEntriesByType('resource')
        
        return resources.map(resource => ({
          name: resource.name,
          transferSize: (resource as any).transferSize || 0,
          encodedBodySize: (resource as any).encodedBodySize || 0,
          decodedBodySize: (resource as any).decodedBodySize || 0,
          duration: resource.duration
        }))
      })
      
      // Check for cached resources (transferSize === 0)
      const cachedResources = cacheMetrics.filter(r => r.transferSize === 0)
      const cacheHitRate = cachedResources.length / cacheMetrics.length
      
      expect(cacheHitRate).toBeGreaterThan(0.1) // At least 10% cache hit rate
      
      // Save cache metrics
      saveMetrics([{ cacheMetrics, cacheHitRate, timestamp: new Date().toISOString() }], 'cache-performance.json')
    })
  })

  test.afterAll(async () => {
    // Generate comprehensive performance report
    const performanceDir = path.join('test-results', 'performance')
    const files = fs.readdirSync(performanceDir).filter(f => f.endsWith('.json'))
    
    const allMetrics = {}
    
    files.forEach(file => {
      const filePath = path.join(performanceDir, file)
      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'))
      allMetrics[file.replace('.json', '')] = content
    })
    
    const report = {
      timestamp: new Date().toISOString(),
      summary: 'Performance testing completed for BroskisKitchen.com',
      metrics: allMetrics,
      recommendations: [
        'Optimize images for better loading performance',
        'Implement lazy loading for below-fold content',
        'Minimize JavaScript bundle sizes',
        'Use CDN for static assets',
        'Implement proper caching strategies'
      ]
    }
    
    fs.writeFileSync(
      path.join('test-results', 'performance-report.json'),
      JSON.stringify(report, null, 2)
    )
    
    console.log('✓ Performance monitoring completed')
    console.log('✓ Performance report generated')
  })
})