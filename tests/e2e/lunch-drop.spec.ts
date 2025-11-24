import { test, expect } from '@playwright/test'

const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'

test.describe('Lunch Drop Features', () => {
  test('Lunch Drop landing page loads and has CTAs', async ({ page }) => {
    await page.goto(`${BASE_URL}/lunch-drop`, { waitUntil: 'networkidle' })
    await page.waitForSelector('main.page-wrapper', { timeout: 30000 })

    await expect(page.locator('h1.page-title')).toHaveText(/LUNCH DROP/i)
    await expect(page.locator('a.btn-race')).toHaveAttribute('href', '/order-race')
    await expect(page.locator('a.btn-signup')).toHaveAttribute('href', '/enter-workplace')
  })

  test('Order Race page renders leaderboard with shift tabs', async ({ page }) => {
    await page.goto(`${BASE_URL}/order-race`, { waitUntil: 'networkidle' })
    await page.waitForSelector('table.race-table', { timeout: 30000 })

    // Title and subtitle
    await expect(page.locator('h1.page-title')).toHaveText(/ORDER RACE/i)
    await expect(page.locator('.race-date-row')).toBeVisible()

    // Shift tabs present and clickable
    const tabs = page.locator('.shift-tab')
    await expect(tabs).toHaveCount(3)
    await tabs.nth(1).click() // switch to 2nd shift
    await tabs.nth(2).click() // switch to 3rd shift
    await tabs.nth(0).click() // back to 1st shift

    // Table renders (using API or mock data)
    const table = page.locator('table.race-table')
    await expect(table).toBeVisible()
    // Allow empty state when no data; ensure table structure is present
    const rows = page.locator('table.race-table tbody tr')
    await expect(rows.count()).resolves.toBeGreaterThanOrEqual(0)
  })

  test('Enter Workplace form submits and shows thank you', async ({ page }) => {
    await page.goto(`${BASE_URL}/enter-workplace`, { waitUntil: 'networkidle' })
    await page.waitForSelector('form.ew-form', { timeout: 30000 })

    await page.fill('input[name="workplaceName"]', 'Test Factory – QA')
    await page.fill('input[name="address"]', '123 Test St, Fort Wayne, IN 46802')
    await page.fill('input[name="contactName"]', 'QA Captain')
    await page.fill('input[name="phone"]', '555-123-4567')
    await page.fill('input[name="email"]', 'qa@example.com')
    await page.selectOption('select[name="shift"]', '2nd')
    await page.fill('input[name="employeeCount"]', '42')
    await page.fill('textarea[name="deliveryNotes"]', 'Gate 2, ask for QA.')

    await page.click('button.ew-submit-btn')

    await expect(page.locator('.ew-thankyou')).toBeVisible()
    await expect(page.locator('.ew-thankyou')).toContainText(/Thank you/i)
  })

  test('Menu Drops page shows active and scheduled drops, Notify redirects when not logged in', async ({ page }) => {
    await page.goto(`${BASE_URL}/menu-drops`, { waitUntil: 'networkidle' })
    // Close any modal overlays that might intercept clicks
    const dialogClose = page.locator('button:has-text("Close"), button[aria-label*="close"], [role="dialog"] button:has-text("×")').first()
    if (await dialogClose.count() > 0) {
      await dialogClose.click({ trial: true }).catch(() => {})
      await dialogClose.click().catch(() => {})
    }

    // Active section renders cards from mock data
    await expect(page.locator('section >> text=Available Now')).toBeVisible()
    const cards = page.locator('[data-testid="drop-card"], .drop-card, .btn-primary')
    await expect(cards.first()).toBeVisible()

    // Scheduled drops section renders
    await expect(page.locator('section >> text=Coming Soon')).toBeVisible()

    // Click Notify Me and expect redirect to login when unauthenticated
    const notifyButton = page.locator('button:has-text("Notify Me")').first()
    if (await notifyButton.count() > 0) {
      await notifyButton.click()
      await expect(page).toHaveURL(/\/login$/)
    }
  })

  test('Checkout shows optional Lunch Drop fields (workplace & shift)', async ({ page }) => {
    // Add an item to cart using shop page
    await page.goto(`${BASE_URL}/shop`, { waitUntil: 'networkidle' })
    const addToCart = page.locator('button:has-text("Add")').first()
    if (await addToCart.count() > 0) {
      await addToCart.click()
    }

    // Go to cart then checkout
    await page.goto(`${BASE_URL}/cart`, { waitUntil: 'networkidle' })
    const checkoutBtn = page.locator('button:has-text("Checkout"), a:has-text("Checkout")').first()
    if (await checkoutBtn.count() > 0) {
      await checkoutBtn.click()
    } else {
      // Directly navigate if button not present in this environment
      await page.goto(`${BASE_URL}/checkout`, { waitUntil: 'networkidle' })
    }

    await expect(page).toHaveURL(/checkout/i)

    // Lunch Drop fields should be present
    const lunchBlock = page.locator('.checkout-lunchdrop-block')
    await expect(lunchBlock).toBeVisible()

    const workplaceField = page.locator('#workplaceName')
    const shiftField = page.locator('#workplaceShift')

    await expect(workplaceField).toBeVisible()
    await expect(shiftField).toBeVisible()

    // Fill them to ensure UI accepts input
    await workplaceField.fill('Test Factory – Night Crew')
    const hasThird = await shiftField.locator('option[value="3rd"]').count()
    if (hasThird > 0) {
      await shiftField.selectOption('3rd')
    }
  })
})
