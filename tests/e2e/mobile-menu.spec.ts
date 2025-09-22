import { test, expect } from '@playwright/test'

test.describe('Mobile Menu E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to a page where navbar is present (not homepage)
    await page.goto('/menu')
  })

  test('should open mobile menu and verify scroll lock', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Find and click the hamburger menu button
    const hamburgerButton = page.locator('[data-testid="mobile-menu-toggle"], button[aria-label*="menu"], button[aria-label*="Menu"]').first()
    await expect(hamburgerButton).toBeVisible()
    await hamburgerButton.click()
    
    // Verify menu opens
    const mobileMenu = page.locator('[data-testid="mobile-menu"]')
    await expect(mobileMenu).toBeVisible()
    
    // Verify body scroll is locked (check for no-scroll class or overflow hidden)
    const body = page.locator('body')
    const bodyClass = await body.getAttribute('class')
    const bodyStyle = await body.getAttribute('style')
    
    // Check if scroll is locked (either through class or style)
    const isScrollLocked = 
      (bodyClass && bodyClass.includes('no-scroll')) ||
      (bodyStyle && bodyStyle.includes('overflow: hidden'))
    
    expect(isScrollLocked).toBeTruthy()
  })

  test('should display all navigation items in mobile menu', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Open mobile menu
    const hamburgerButton = page.locator('[data-testid="mobile-menu-toggle"], button[aria-label*="menu"], button[aria-label*="Menu"]').first()
    await hamburgerButton.click()
    
    // Wait for menu to be visible
    const mobileMenu = page.locator('[data-testid="mobile-menu"]')
    await expect(mobileMenu).toBeVisible()
    
    // Check that navigation links are present
    const navLinks = page.locator('[data-testid="mobile-menu-link"]')
    await expect(navLinks.first()).toBeVisible()
    
    // Verify some key navigation items
    await expect(page.locator('text=Menu')).toBeVisible()
    await expect(page.locator('text=Locations')).toBeVisible()
    await expect(page.locator('text=Contact')).toBeVisible()
  })

  test('should scroll to bottom and verify last nav item is visible and clickable', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Open mobile menu
    const hamburgerButton = page.locator('[data-testid="mobile-menu-toggle"], button[aria-label*="menu"], button[aria-label*="Menu"]').first()
    await hamburgerButton.click()
    
    // Wait for menu to be visible
    const mobileMenu = page.locator('[data-testid="mobile-menu"]')
    await expect(mobileMenu).toBeVisible()
    
    // Scroll to bottom of the menu
    const menuScrollArea = mobileMenu.locator('nav')
    await menuScrollArea.evaluate(el => {
      el.scrollTop = el.scrollHeight
    })
    
    // Find the last navigation item (Contact should be the last one)
    const lastNavItem = page.locator('[data-testid="mobile-menu-link"]').last()
    await expect(lastNavItem).toBeVisible()
    
    // Verify it's clickable by checking it's not disabled and has href
    const href = await lastNavItem.getAttribute('href')
    expect(href).toBeTruthy()
    
    // Verify the item is actually clickable (not covered by other elements)
    await expect(lastNavItem).toBeEnabled()
  })

  test('should navigate to cart and close drawer', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Open mobile menu
    const hamburgerButton = page.locator('[data-testid="mobile-menu-toggle"], button[aria-label*="menu"], button[aria-label*="Menu"]').first()
    await hamburgerButton.click()
    
    // Wait for menu to be visible
    const mobileMenu = page.locator('[data-testid="mobile-menu"]')
    await expect(mobileMenu).toBeVisible()
    
    // Find and click the Cart button
    const cartButton = page.locator('[data-testid="mobile-menu-cta"]').filter({ hasText: 'Cart' })
    await expect(cartButton).toBeVisible()
    
    // Click cart button and verify navigation
    await cartButton.click()
    
    // Verify the menu closes (should not be visible after navigation)
    await expect(mobileMenu).not.toBeVisible()
    
    // Verify we navigated to cart page
    await expect(page).toHaveURL(/.*\/cart/)
  })

  test('should close menu with ESC key', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Open mobile menu
    const hamburgerButton = page.locator('[data-testid="mobile-menu-toggle"], button[aria-label*="menu"], button[aria-label*="Menu"]').first()
    await hamburgerButton.click()
    
    // Wait for menu to be visible
    const mobileMenu = page.locator('[data-testid="mobile-menu"]')
    await expect(mobileMenu).toBeVisible()
    
    // Press ESC key
    await page.keyboard.press('Escape')
    
    // Verify menu closes
    await expect(mobileMenu).not.toBeVisible()
  })

  test('should close menu when clicking backdrop', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Open mobile menu
    const hamburgerButton = page.locator('[data-testid="mobile-menu-toggle"], button[aria-label*="menu"], button[aria-label*="Menu"]').first()
    await hamburgerButton.click()
    
    // Wait for menu to be visible
    const mobileMenu = page.locator('[data-testid="mobile-menu"]')
    await expect(mobileMenu).toBeVisible()
    
    // Click on backdrop (outside the menu panel)
    const backdrop = page.locator('[aria-label="Close menu overlay"]')
    await backdrop.click()
    
    // Verify menu closes
    await expect(mobileMenu).not.toBeVisible()
  })

  test('should manage focus correctly', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Open mobile menu
    const hamburgerButton = page.locator('[data-testid="mobile-menu-toggle"], button[aria-label*="menu"], button[aria-label*="Menu"]').first()
    await hamburgerButton.click()
    
    // Wait for menu to be visible
    const mobileMenu = page.locator('[data-testid="mobile-menu"]')
    await expect(mobileMenu).toBeVisible()
    
    // Verify close button receives focus
    const closeButton = page.locator('[aria-label="Close menu"]')
    await expect(closeButton).toBeFocused()
    
    // Test tab navigation within menu
    await page.keyboard.press('Tab')
    
    // Verify focus moves to first navigation item
    const firstNavLink = page.locator('[data-testid="mobile-menu-link"]').first()
    await expect(firstNavLink).toBeFocused()
  })

  test('should display correct CTA buttons for unauthenticated users', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Open mobile menu
    const hamburgerButton = page.locator('[data-testid="mobile-menu-toggle"], button[aria-label*="menu"], button[aria-label*="Menu"]').first()
    await hamburgerButton.click()
    
    // Wait for menu to be visible
    const mobileMenu = page.locator('[data-testid="mobile-menu"]')
    await expect(mobileMenu).toBeVisible()
    
    // For unauthenticated users, should see Sign In / Join button
    await expect(page.locator('text=Sign In / Join')).toBeVisible()
    
    // Should see Cart button
    await expect(page.locator('[data-testid="mobile-menu-cta"]').filter({ hasText: 'Cart' })).toBeVisible()
    
    // Should NOT see authenticated user buttons
    await expect(page.locator('text=My Account')).not.toBeVisible()
    await expect(page.locator('text=Order History')).not.toBeVisible()
    await expect(page.locator('text=Admin')).not.toBeVisible()
    await expect(page.locator('text=Logout')).not.toBeVisible()
  })
})