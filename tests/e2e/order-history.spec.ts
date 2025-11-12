import { test, expect } from '@playwright/test'

test.describe('Order History Page', () => {
  test('renders without black screen on API 401', async ({ page }) => {
    await page.route('**/api/my-orders', route => route.fulfill({ status: 401, body: JSON.stringify({ error: 'unauthorized' }) }))
    await page.goto('/orders')
    const errorUI = page.locator('text=Error Loading Orders')
    await expect(errorUI).toBeVisible()
    const fallback = page.locator('text=Something went wrong. Please refresh the page.')
    await expect(fallback).toHaveCount(0)
  })

  test('shows orders when API succeeds', async ({ page }) => {
    const orders = { orders: [{ id: 'ord_1', items: [], totalCents: 2599, status: 'completed', createdAt: new Date().toISOString() }] }
    await page.route('**/api/my-orders', route => route.fulfill({ status: 200, body: JSON.stringify(orders) }))
    await page.goto('/orders')
    const header = page.locator('text=Order Tracking')
    await expect(header).toBeVisible()
    const anyOrder = page.locator('text=Order History,Order Tracking').first()
    await expect(anyOrder).toBeVisible()
  })
})
