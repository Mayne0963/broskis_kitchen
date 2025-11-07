import { test, expect } from '@playwright/test'
import fs from 'fs'
import path from 'path'

// Utility to capture navigation performance metrics
async function getNavigationMetrics(page) {
  return await page.evaluate(() => {
    const entry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
    const fcp = performance.getEntriesByName('first-contentful-paint')[0] as any
    return {
      duration: entry?.duration ?? null,
      domContentLoaded: entry ? (entry.domContentLoadedEventEnd - entry.startTime) : null,
      load: entry ? (entry.loadEventEnd - entry.startTime) : null,
      responseTime: entry ? (entry.responseEnd - entry.requestStart) : null,
      firstContentfulPaint: fcp?.startTime ?? null
    }
  })
}

test.describe('Auth Loading & Performance', () => {
  test('Homepage shows auth loading and then content with acceptable performance', async ({ page }) => {
    const start = Date.now()
    await page.goto('/')

    // Verify global auth loading appears initially
    const loadingText = page.locator('text=Loading Broski\'s Kitchen')
    await expect(loadingText).toBeVisible({ timeout: 3000 })

    // Ensure loading disappears and page content renders
    await expect(loadingText).toBeHidden({ timeout: 5000 })

    const metrics = await getNavigationMetrics(page)
    const metricsOut = {
      page: '/',
      metrics,
      totalTimeMs: Date.now() - start,
      timestamp: new Date().toISOString()
    }
    try {
      const outPath = path.join(process.cwd(), 'playwright-metrics.json')
      const existing = fs.existsSync(outPath) ? JSON.parse(fs.readFileSync(outPath, 'utf-8')) : []
      existing.push(metricsOut)
      fs.writeFileSync(outPath, JSON.stringify(existing, null, 2))
    } catch (e) {
      // non-fatal
    }

    // Basic performance assertions (dev thresholds)
    expect(metrics.duration ?? 0).toBeLessThan(6000)
    expect(metrics.domContentLoaded ?? 0).toBeLessThan(4000)
    expect(metrics.responseTime ?? 0).toBeLessThan(2000)

    const total = metricsOut.totalTimeMs
    expect(total).toBeLessThan(7000)
  })

  test('Protected route redirects to login quickly', async ({ page }) => {
    const start = Date.now()
    await page.goto('/kitchen')
    await page.waitForURL(/\/auth\/login/, { timeout: 3000 })
    const elapsed = Date.now() - start
    try {
      const outPath = path.join(process.cwd(), 'playwright-metrics.json')
      const existing = fs.existsSync(outPath) ? JSON.parse(fs.readFileSync(outPath, 'utf-8')) : []
      existing.push({ page: '/kitchen -> /auth/login', redirectTimeMs: elapsed, timestamp: new Date().toISOString() })
      fs.writeFileSync(outPath, JSON.stringify(existing, null, 2))
    } catch {}
    expect(elapsed).toBeLessThan(3000)
  })

  test('Auth status API responds quickly (unauthenticated)', async ({ request }) => {
    const start = Date.now()
    const res = await request.get('/api/auth/status')
    const elapsed = Date.now() - start
    try {
      const outPath = path.join(process.cwd(), 'playwright-metrics.json')
      const existing = fs.existsSync(outPath) ? JSON.parse(fs.readFileSync(outPath, 'utf-8')) : []
      existing.push({ api: '/api/auth/status', status: res.status(), timeMs: elapsed, timestamp: new Date().toISOString() })
      fs.writeFileSync(outPath, JSON.stringify(existing, null, 2))
    } catch {}

    expect([200, 500]).toContain(res.status())
    expect(elapsed).toBeLessThan(1500)
  })

  test('Session refresh API returns promptly when unauthenticated', async ({ request }) => {
    const start = Date.now()
    const res = await request.get('/api/auth/refresh')
    const elapsed = Date.now() - start
    try {
      const outPath = path.join(process.cwd(), 'playwright-metrics.json')
      const existing = fs.existsSync(outPath) ? JSON.parse(fs.readFileSync(outPath, 'utf-8')) : []
      existing.push({ api: '/api/auth/refresh', status: res.status(), timeMs: elapsed, timestamp: new Date().toISOString() })
      fs.writeFileSync(outPath, JSON.stringify(existing, null, 2))
    } catch {}

    expect([200, 401, 500]).toContain(res.status())
    expect(elapsed).toBeLessThan(2000)
  })
})