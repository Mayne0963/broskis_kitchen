import { test, expect } from '@playwright/test'

/**
 * Transactional Flow Testing Suite
 * Tests complete user journeys including cart, checkout, and order management
 */

test.describe('Transactional Flows', () => {
  test.beforeEach(async ({ page }) => {
    test.setTimeout(60000) // 60 seconds for complex flows
    page.setDefaultTimeout(15000)
  })

  test.describe('Shopping Cart Flow', () => {
    test('Add items to cart and update quantities', async ({ page }) => {
      await page.goto('/shop')
      
      // Look for products
      const productCards = page.locator('[data-testid="product"], .product-card, .product').first()
      
      if (await productCards.count() > 0) {
        // Add first product to cart
        const firstProduct = productCards.first()
        const addButton = firstProduct.locator('button:has-text("Add to Cart"), button:has-text("Add")').first()
        
        await addButton.click()
        
        // Check cart indicator
        const cartCount = page.locator('text*=1,Cart (1)').first()
        await expect(cartCount).toBeVisible({ timeout: 5000 })
        
        // Go to cart
        await page.goto('/cart')
        
        // Check cart page
        await expect(page).toHaveURL(/cart/i)
        
        // Update quantity
        const quantityInput = page.locator('input[type="number"], select').first()
        if (await quantityInput.count() > 0) {
          await quantityInput.fill('2')
          
          // Check if total updates
          const totalElement = page.locator('text*=Total,total').first()
          await expect(totalElement).toBeVisible()
        }
        
        // Remove item
        const removeButton = page.locator('button:has-text("Remove"), button:has-text("Delete")').first()
        if (await removeButton.count() > 0) {
          await removeButton.click()
          
          // Check if cart is empty
          const emptyMessage = page.locator('text*=empty,cart is empty,no items').first()
          await expect(emptyMessage).toBeVisible()
        }
      }
    })

    test('Cart persistence across sessions', async ({ browser }) => {
      const context = await browser.newContext()
      const page = await context.newPage()
      
      await page.goto('/shop')
      
      // Add item to cart
      const addButton = page.locator('button:has-text("Add to Cart"), button:has-text("Add")').first()
      if (await addButton.count() > 0) {
        await addButton.click()
        
        // Close browser
        await context.close()
        
        // Create new context (simulate new session)
        const newContext = await browser.newContext()
        const newPage = await newContext.newPage()
        
        await newPage.goto('/cart')
        
        // Check if cart still has items
        const cartItems = newPage.locator('.cart-item, [data-testid="cart-item"]').first()
        await expect(cartItems).toBeVisible()
        
        await newContext.close()
      }
    })
  })

  test.describe('Checkout Process', () => {
    test('Complete checkout flow with valid data', async ({ page }) => {
      // Start with cart that has items
      await page.goto('/shop')
      
      const addButton = page.locator('button:has-text("Add to Cart"), button:has-text("Add")').first()
      if (await addButton.count() > 0) {
        await addButton.click()
        
        // Go to checkout
        await page.goto('/checkout')
        
        // Fill checkout form
        await page.fill('input[name="firstName"], input[placeholder*="first name"]', 'John')
        await page.fill('input[name="lastName"], input[placeholder*="last name"]', 'Doe')
        await page.fill('input[name="email"], input[type="email"]', 'john.doe@example.com')
        await page.fill('input[name="phone"], input[type="tel"]', '555-123-4567')
        
        // Address
        await page.fill('input[name="address"], input[placeholder*="address"]', '123 Main St')
        await page.fill('input[name="city"], input[placeholder*="city"]', 'Anytown')
        await page.fill('input[name="zipCode"], input[placeholder*="zip"]', '12345')
        
        // Payment information
        await page.fill('input[name="cardNumber"], input[placeholder*="card number"]', '4242424242424242')
        await page.fill('input[name="expiry"], input[placeholder*="MM/YY"]', '12/25')
        await page.fill('input[name="cvv"], input[placeholder*="CVV"]', '123')
        
        // Submit order
        const submitButton = page.locator('button[type="submit"], button:has-text("Place Order")').first()
        await submitButton.click()
        
        // Check for order confirmation
        const confirmation = page.locator('text*=order confirmed,thank you,order placed').first()
        await expect(confirmation).toBeVisible({ timeout: 15000 })
      }
    })

    test('Checkout with invalid payment info', async ({ page }) => {
      await page.goto('/checkout')
      
      // Fill form with invalid card
      await page.fill('input[name="cardNumber"], input[placeholder*="card number"]', '4000000000000002')
      await page.fill('input[name="expiry"], input[placeholder*="MM/YY"]', '12/25')
      await page.fill('input[name="cvv"], input[placeholder*="CVV"]', '123')
      
      const submitButton = page.locator('button[type="submit"], button:has-text("Place Order")').first()
      await submitButton.click()
      
      // Check for payment error
      const paymentError = page.locator('text*=payment failed,card declined,invalid card').first()
      await expect(paymentError).toBeVisible({ timeout: 10000 })
    })
  })

  test.describe('Order Management', () => {
    test('Order history and tracking', async ({ page }) => {
      // Login first
      await page.goto('/login')
      await page.fill('input[type="email"], input[name="email"]', 'test@example.com')
      await page.fill('input[type="password"], input[name="password"]', 'testpassword')
      await page.click('button[type="submit"]')
      
      // Go to orders page
      await page.goto('/account/orders')
      
      // Check order list
      const orders = page.locator('.order-item, [data-testid="order"]').first()
      await expect(orders).toBeVisible()
      
      // Click on first order
      const firstOrder = orders.first()
      await firstOrder.click()
      
      // Check order details
      const orderDetails = page.locator('.order-details, [data-testid="order-details"]').first()
      await expect(orderDetails).toBeVisible()
      
      // Check for tracking information
      const trackingInfo = page.locator('text*=tracking,status,delivery').first()
      await expect(trackingInfo).toBeVisible()
    })

    test('Order cancellation', async ({ page }) => {
      await page.goto('/account/orders')
      
      // Find cancelable order
      const cancelButton = page.locator('button:has-text("Cancel"), button:has-text("Cancel Order")').first()
      
      if (await cancelButton.count() > 0) {
        await cancelButton.click()
        
        // Confirm cancellation
        const confirmButton = page.locator('button:has-text("Confirm"), button:has-text("Yes"').first()
        await confirmButton.click()
        
        // Check for cancellation confirmation
        const cancellation = page.locator('text*=cancelled,order cancelled,cancellation').first()
        await expect(cancellation).toBeVisible({ timeout: 10000 })
      }
    })
  })

  test.describe('Payment Processing', () => {
    test('Multiple payment methods', async ({ page }) => {
      await page.goto('/checkout')
      
      // Check for different payment options
      const paymentOptions = [
        'credit card',
        'debit card', 
        'paypal',
        'apple pay',
        'google pay'
      ]
      
      for (const option of paymentOptions) {
        const paymentMethod = page.locator(`text=${option}`).first()
        if (await paymentMethod.count() > 0) {
          await paymentMethod.click()
          
          // Check if payment form changes
          const paymentForm = page.locator('.payment-form, [data-testid="payment-form"]').first()
          await expect(paymentForm).toBeVisible()
        }
      }
    })

    test('Payment security validation', async ({ page }) => {
      await page.goto('/checkout')
      
      // Check for SSL indicators
      const sslIndicator = page.locator('text*=secure,SSL,encrypted').first()
      await expect(sslIndicator).toBeVisible()
      
      // Check for CVV requirement
      const cvvField = page.locator('input[name="cvv"], input[placeholder*="CVV"]').first()
      await expect(cvvField).toBeVisible()
      
      // Check for address verification
      const billingAddress = page.locator('input[name="billingAddress"], input[placeholder*="billing"]').first()
      await expect(billingAddress).toBeVisible()
    })
  })

  test.describe('Email Notifications', () => {
    test('Order confirmation email', async ({ page }) => {
      // Complete an order
      await page.goto('/shop')
      
      const addButton = page.locator('button:has-text("Add to Cart"), button:has-text("Add")').first()
      if (await addButton.count() > 0) {
        await addButton.click()
        
        await page.goto('/checkout')
        
        // Fill checkout form
        await page.fill('input[name="email"], input[type="email"]', 'test@example.com')
        // ... fill other required fields
        
        const submitButton = page.locator('button[type="submit"], button:has-text("Place Order")').first()
        await submitButton.click()
        
        // Check for email confirmation message
        const emailConfirmation = page.locator('text*=email sent,confirmation email,check your email').first()
        await expect(emailConfirmation).toBeVisible()
      }
    })
  })
})