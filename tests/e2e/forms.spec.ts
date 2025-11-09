import { test, expect } from '@playwright/test'

/**
 * Form Testing Suite
 * Comprehensive testing of all forms on BroskisKitchen.com
 */

test.describe('Form Validation & Submission', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(30000)
    page.setDefaultTimeout(10000)
  })

  test.describe('Contact Form', () => {
    test('Contact form validation and submission', async ({ page }) => {
      await page.goto('/contact')
      
      // Test empty form submission
      const submitButton = page.locator('button[type="submit"]').first()
      await submitButton.click()
      
      // Check for validation errors
      const validationErrors = page.locator('text*=required,Required,Please fill').first()
      await expect(validationErrors).toBeVisible()
      
      // Fill form with valid data
      await page.fill('input[name="name"], input[placeholder*="name"]', 'John Doe')
      await page.fill('input[name="email"], input[type="email"]', 'john.doe@example.com')
      await page.fill('textarea[name="message"], textarea[placeholder*="message"]', 
        'This is a test message for E2E testing of the contact form.')
      
      // Submit form
      await submitButton.click()
      
      // Check for success message
      const successMessage = page.locator('text*=sent,thank you,submitted,success').first()
      await expect(successMessage).toBeVisible({ timeout: 10000 })
    })

    test('Contact form with invalid email', async ({ page }) => {
      await page.goto('/contact')
      
      // Fill form with invalid email
      await page.fill('input[name="name"], input[placeholder*="name"]', 'John Doe')
      await page.fill('input[name="email"], input[type="email"]', 'invalid-email')
      await page.fill('textarea[name="message"], textarea[placeholder*="message"]', 'Test message')
      
      const submitButton = page.locator('button[type="submit"]').first()
      await submitButton.click()
      
      // Check for email validation error
      const emailError = page.locator('text*=valid email,invalid email,email format').first()
      await expect(emailError).toBeVisible()
    })
  })

  test.describe('Login Form', () => {
    test('Login form validation', async ({ page }) => {
      await page.goto('/login')
      
      // Test empty form
      const submitButton = page.locator('button[type="submit"]').first()
      await submitButton.click()
      
      // Check for validation errors
      const validationErrors = page.locator('text*=required,Required,email required').first()
      await expect(validationErrors).toBeVisible()
    })

    test('Login with invalid credentials', async ({ page }) => {
      await page.goto('/login')
      
      // Fill form with invalid credentials
      await page.fill('input[type="email"], input[name="email"]', 'invalid@example.com')
      await page.fill('input[type="password"], input[name="password"]', 'wrongpassword')
      
      const submitButton = page.locator('button[type="submit"]').first()
      await submitButton.click()
      
      // Check for error message
      const errorMessage = page.locator('text*=invalid,incorrect,failed').first()
      await expect(errorMessage).toBeVisible({ timeout: 5000 })
    })
  })

  test.describe('Registration Form', () => {
    test('Registration form validation', async ({ page }) => {
      await page.goto('/register')
      
      // Test password mismatch
      await page.fill('input[type="email"], input[name="email"]', 'test@example.com')
      await page.fill('input[type="password"]', 'password123')
      await page.fill('input[name="confirmPassword"], input[placeholder*="confirm"]', 'differentpassword')
      
      const submitButton = page.locator('button[type="submit"]').first()
      await submitButton.click()
      
      // Check for password mismatch error
      const passwordError = page.locator('text*=password match,Passwords don\'t match').first()
      await expect(passwordError).toBeVisible()
    })
  })

  test.describe('Order Forms', () => {
    test('Checkout form validation', async ({ page }) => {
      // Add item to cart first
      await page.goto('/shop')
      
      const addToCartButton = page.locator('button:has-text("Add to Cart"), button:has-text("Add")').first()
      if (await addToCartButton.count() > 0) {
        await addToCartButton.click()
        
        // Go to checkout
        await page.goto('/checkout')
        
        // Test empty checkout form
        const submitButton = page.locator('button[type="submit"], button:has-text("Place Order")').first()
        await submitButton.click()
        
        // Check for validation errors
        const validationErrors = page.locator('text*=required,Required,fill in').first()
        await expect(validationErrors).toBeVisible()
      }
    })
  })

  test.describe('Search Forms', () => {
    test('Search functionality', async ({ page }) => {
      await page.goto('/')
      
      // Look for search input
      const searchInput = page.locator('input[type="search"], input[placeholder*="search"]').first()
      
      if (await searchInput.count() > 0) {
        // Test empty search
        await searchInput.press('Enter')
        
        // Test search with results
        await searchInput.fill('pizza')
        await searchInput.press('Enter')
        
        // Check for search results
        const results = page.locator('text*=result,search result,found').first()
        await expect(results).toBeVisible()
        
        // Test search with no results
        await searchInput.fill('xyz123nonexistent')
        await searchInput.press('Enter')
        
        // Check for no results message
        const noResults = page.locator('text*=no results,not found,no items').first()
        await expect(noResults).toBeVisible()
      }
    })
  })
})