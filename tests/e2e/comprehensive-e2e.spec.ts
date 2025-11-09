import { test, expect, Page, TestInfo } from '@playwright/test'
import fs from 'fs'
import path from 'path'

// Test configuration
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const TEST_TIMEOUT = 30000
const NAVIGATION_TIMEOUT = 15000

// Device viewports for responsive testing
const DEVICES = {
  desktop: { width: 1920, height: 1080 },
  tablet: { width: 768, height: 1024 },
  mobile: { width: 375, height: 667 }
}

// Helper functions
async function captureScreenshot(page: Page, testInfo: TestInfo, name: string) {
  const screenshotPath = path.join('test-results', 'screenshots', `${testInfo.title}-${name}.png`)
  await page.screenshot({ path: screenshotPath, fullPage: true })
  return screenshotPath
}

async function measurePageLoad(page: Page, url: string) {
  const startTime = Date.now()
  const response = await page.goto(url, { waitUntil: 'networkidle' })
  const loadTime = Date.now() - startTime
  
  const metrics = await page.evaluate(() => {
    const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    const paint = performance.getEntriesByType('paint')
    const fcp = paint.find(entry => entry.name === 'first-contentful-paint')
    const lcp = performance.getEntriesByType('largest-contentful-paint')[0]
    
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
      resourceCount: performance.getEntriesByType('resource').length
    }
  })
  
  return {
    url,
    loadTime,
    status: response?.status(),
    metrics,
    timestamp: new Date().toISOString()
  }
}

async function checkBrokenLinks(page: Page, baseUrl: string) {
  const links = await page.$$eval('a[href]', (anchors) => 
    anchors.map(a => (a as HTMLAnchorElement).href)
      .filter(href => href.startsWith(baseUrl) || href.startsWith('/'))
      .filter(href => !href.includes('#'))
  )
  
  const brokenLinks = []
  
  for (const link of links.slice(0, 20)) { // Limit to 20 links to avoid timeout
    try {
      const response = await page.request.get(link, { timeout: 5000 })
      if (response.status() >= 400) {
        brokenLinks.push({ url: link, status: response.status() })
      }
    } catch (error) {
      brokenLinks.push({ url: link, status: 'NETWORK_ERROR' })
    }
  }
  
  return brokenLinks
}

// Test suite
test.describe('BroskisKitchen.com Comprehensive E2E Testing', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(TEST_TIMEOUT)
    page.setDefaultNavigationTimeout(NAVIGATION_TIMEOUT)
    page.setDefaultTimeout(10000)
  })

  test.describe('Page Loading & Navigation', () => {
    const pages = [
      { path: '/', name: 'Homepage' },
      { path: '/menu', name: 'Menu' },
      { path: '/about', name: 'About' },
      { path: '/contact', name: 'Contact' },
      { path: '/locations', name: 'Locations' },
      { path: '/shop', name: 'Shop' },
      { path: '/cart', name: 'Cart' },
      { path: '/login', name: 'Login' }
    ]

    pages.forEach(({ path, name }) => {
      test(`${name} page loads correctly`, async ({ page }, testInfo) => {
        const result = await measurePageLoad(page, `${BASE_URL}${path}`)
        
        // Basic assertions
        expect(result.status).toBeLessThan(400)
        expect(result.loadTime).toBeLessThan(10000) // 10 seconds max
        
        // Performance assertions
        if (result.metrics.navigationTiming) {
          expect(result.metrics.navigationTiming.domContentLoaded).toBeLessThan(5000)
          expect(result.metrics.navigationTiming.loadComplete).toBeLessThan(8000)
        }
        
        // Take screenshot
        await captureScreenshot(page, testInfo, name.toLowerCase().replace(/\s+/g, '-'))
        
        // Log results
        console.log(`✓ ${name} loaded in ${result.loadTime}ms`)
      })
    })
  })

  test.describe('Navigation Menu Testing', () => {
    test('Main navigation menu works on desktop', async ({ page, isMobile }) => {
      if (isMobile) {
        test.skip()
      }
      
      await page.goto(BASE_URL)
      
      // Check main navigation items
      const navItems = ['Menu', 'About', 'Contact', 'Locations', 'Shop']
      
      for (const item of navItems) {
        const navLink = page.locator(`nav a:has-text("${item}")`).first()
        await expect(navLink).toBeVisible()
        
        // Click and verify navigation
        await navLink.click()
        await expect(page).toHaveURL(new RegExp(item.toLowerCase()))
        await page.goBack()
      }
    })

    test('Mobile navigation menu works', async ({ page, isMobile }) => {
      if (!isMobile) {
        test.skip()
      }
      
      await page.goto(BASE_URL)
      
      // Look for mobile menu button
      const menuButton = page.locator('button[aria-label*="menu"], button:has-text("☰"), .mobile-menu-button').first()
      await expect(menuButton).toBeVisible()
      
      // Open mobile menu
      await menuButton.click()
      
      // Check mobile menu items
      const mobileNavItems = ['Menu', 'About', 'Contact', 'Locations']
      
      for (const item of mobileNavItems) {
        const mobileLink = page.locator(`a:has-text("${item}")`).first()
        await expect(mobileLink).toBeVisible()
      }
    })
  })

  test.describe('Form Testing', () => {
    test('Contact form submission', async ({ page }) => {
      await page.goto(`${BASE_URL}/contact`)
      
      // Fill contact form
      await page.fill('input[name="name"], input[placeholder*="name"]', 'Test User')
      await page.fill('input[name="email"], input[type="email"]', 'test@example.com')
      await page.fill('textarea[name="message"], textarea[placeholder*="message"]', 'This is a test message for E2E testing')
      
      // Submit form
      const submitButton = page.locator('button[type="submit"], input[type="submit"]').first()
      await submitButton.click()
      
      // Check for success message or redirect
      await expect(page.locator('text*=sent,thank you,submitted,success').first()).toBeVisible({ timeout: 10000 })
    })

    test('Login form validation', async ({ page }) => {
      await page.goto(`${BASE_URL}/login`)
      
      // Try to submit empty form
      const submitButton = page.locator('button[type="submit"]').first()
      await submitButton.click()
      
      // Check for validation errors
      const errorMessages = page.locator('text*=required,invalid,error').first()
      await expect(errorMessages).toBeVisible()
      
      // Fill with invalid email
      await page.fill('input[type="email"], input[name="email"]', 'invalid-email')
      await submitButton.click()
      
      // Check for email validation
      const emailError = page.locator('text*=valid email,invalid email').first()
      await expect(emailError).toBeVisible()
    })
  })

  test.describe('Interactive Elements', () => {
    test('Add to cart functionality', async ({ page }) => {
      await page.goto(`${BASE_URL}/shop`)
      
      // Look for add to cart buttons
      const addToCartButtons = page.locator('button:has-text("Add to Cart"), button:has-text("Add")').first()
      
      if (await addToCartButtons.count() > 0) {
        // Click first add to cart button
        await addToCartButtons.click()
        
        // Check cart indicator
        const cartIndicator = page.locator('text*=1,Cart (1)').first()
        await expect(cartIndicator).toBeVisible({ timeout: 5000 })
      }
    })

    test('Search functionality', async ({ page }) => {
      await page.goto(BASE_URL)
      
      // Look for search input
      const searchInput = page.locator('input[type="search"], input[placeholder*="search"]').first()
      
      if (await searchInput.count() > 0) {
        await searchInput.fill('pizza')
        await searchInput.press('Enter')
        
        // Check for search results
        const results = page.locator('text*=pizza,result,search').first()
        await expect(results).toBeVisible()
      }
    })
  })

  test.describe('Transactional Flows', () => {
    test('Complete checkout flow', async ({ page }) => {
      // Start from shop page
      await page.goto(`${BASE_URL}/shop`)
      
      // Add item to cart
      const addToCartButtons = page.locator('button:has-text("Add to Cart"), button:has-text("Add")').first()
      if (await addToCartButtons.count() > 0) {
        await addToCartButtons.click()
        
        // Go to cart
        await page.goto(`${BASE_URL}/cart`)
        
        // Check cart page loads
        await expect(page.locator('h1,h2').first()).toContainText(/cart|shopping/i)
        
        // Proceed to checkout
        const checkoutButton = page.locator('button:has-text("Checkout"), a:has-text("Checkout")').first()
        if (await checkoutButton.count() > 0) {
          await checkoutButton.click()
          
          // Check checkout page
          await expect(page).toHaveURL(/checkout/i)
        }
      }
    })
  })

  test.describe('Responsive Design', () => {
    Object.entries(DEVICES).forEach(([deviceName, viewport]) => {
      test(`${deviceName} viewport renders correctly`, async ({ page }, testInfo) => {
        await page.setViewportSize(viewport)
        await page.goto(BASE_URL)
        
        // Take screenshot for this device
        await captureScreenshot(page, testInfo, `${deviceName}-viewport`)
        
        // Check navigation is visible or mobile menu exists
        const navVisible = await page.locator('nav').first().isVisible()
        const mobileMenu = await page.locator('button[aria-label*="menu"]').first().isVisible()
        
        expect(navVisible || mobileMenu).toBe(true)
        
        // Check main content is visible
        const mainContent = page.locator('main, .main, #main').first()
        await expect(mainContent).toBeVisible()
      })
    })
  })

  test.describe('Broken Links & Resources', () => {
    test('Check for broken internal links', async ({ page }) => {
      await page.goto(BASE_URL)
      
      const brokenLinks = await checkBrokenLinks(page, BASE_URL)
      
      if (brokenLinks.length > 0) {
        console.log('Broken links found:', brokenLinks)
      }
      
      expect(brokenLinks.length).toBeLessThan(3) // Allow up to 3 broken links
    })

    test('Check for missing images and resources', async ({ page }) => {
      await page.goto(BASE_URL)
      
      // Check for broken images
      const images = await page.$$eval('img', (imgs) => 
        imgs.map(img => ({
          src: img.src,
          alt: img.alt,
          complete: img.complete,
          naturalHeight: img.naturalHeight
        }))
      )
      
      const brokenImages = images.filter(img => !img.complete || img.naturalHeight === 0)
      
      if (brokenImages.length > 0) {
        console.log('Broken images found:', brokenImages)
      }
      
      expect(brokenImages.length).toBeLessThan(5) // Allow up to 5 broken images
    })
  })

  test.describe('Error Handling', () => {
    test('404 page handling', async ({ page }) => {
      await page.goto(`${BASE_URL}/nonexistent-page-12345`)
      
      // Check for 404 content
      const notFoundText = page.locator('text*=404,not found,page not found').first()
      await expect(notFoundText).toBeVisible()
      
      // Check for helpful navigation
      const homeLink = page.locator('a:has-text("Home"), a:has-text("home")').first()
      await expect(homeLink).toBeVisible()
    })

    test('Network error handling', async ({ page }) => {
      // Block network requests to simulate network error
      await page.route('**/api/**', route => route.abort('failed'))
      
      await page.goto(`${BASE_URL}/menu`)
      
      // Check for error messages or fallback content
      const errorContent = page.locator('text*=error,failed,unable to load').first()
      await expect(errorContent).toBeVisible()
    })
  })

  test.describe('Performance Monitoring', () => {
    test('Page performance metrics', async ({ page }) => {
      const results = []
      
      const pages = ['/', '/menu', '/about', '/contact']
      
      for (const pagePath of pages) {
        const result = await measurePageLoad(page, `${BASE_URL}${pagePath}`)
        results.push(result)
      }
      
      // Save performance results
      const resultsPath = path.join('test-results', 'performance-metrics.json')
      fs.mkdirSync(path.dirname(resultsPath), { recursive: true })
      fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2))
      
      // Performance assertions
      results.forEach(result => {
        expect(result.loadTime).toBeLessThan(8000)
        if (result.metrics.navigationTiming) {
          expect(result.metrics.navigationTiming.domContentLoaded).toBeLessThan(4000)
        }
      })
    })
  })

  test.afterAll(async () => {
    // Generate test report
    const reportPath = path.join('test-results', 'e2e-test-report.json')
    const report = {
      timestamp: new Date().toISOString(),
      baseUrl: BASE_URL,
      testEnvironment: process.env.NODE_ENV || 'development',
      summary: 'Comprehensive E2E testing completed for BroskisKitchen.com'
    }
    
    fs.mkdirSync(path.dirname(reportPath), { recursive: true })
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2))
    
    console.log('✓ Comprehensive E2E testing completed')
    console.log('✓ Test report generated at:', reportPath)
  })
})