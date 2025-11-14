import { test, expect } from '@playwright/test'

test('home page loads without global error fallback', async ({ page }) => {
  await page.goto('/')
  const fallback = page.locator('text=Something went wrong')
  await expect(fallback).toHaveCount(0)
})