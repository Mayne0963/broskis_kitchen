import { test, expect } from '@playwright/test'

test.describe('Orders and Vendors pages', () => {
  test('Vendors page shows profile error and empty orders when unauthenticated', async ({ page }) => {
    await page.goto('/vendors')

    // Should show loading first then error for profile
    await expect(page.getByText(/Vendors Dashboard/i)).toBeVisible()
    await expect(page.getByText(/Profile/i)).toBeVisible()

    // Error message due to 401 from /api/me
    await expect(page.getByText(/Error loading profile/i)).toBeVisible()

    // Orders section renders gracefully even if API fails
    await expect(page.getByText(/Orders/i)).toBeVisible()
    // Either show empty list or a friendly error depending on auth
    const ordersEmpty = page.getByText(/No orders to display/i)
    const ordersError = page.getByText(/Unable to load orders/i)
    await expect(ordersEmpty.or(ordersError)).toBeVisible()
  })

  test('Orders page prompts login when unauthenticated', async ({ page }) => {
    await page.goto('/orders')
    await expect(page.getByText(/My Orders/i)).toBeVisible()
    await expect(page.getByText(/Please log in to view your orders/i)).toBeVisible()
  })
})