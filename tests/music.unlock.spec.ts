import { test, expect } from '@playwright/test'

test.describe('Music iOS Unlock', () => {
  test('should show unlock overlay on iOS and hide after tap', async ({ page, context }) => {
    // Simulate iOS Safari user agent
    await context.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1')
    
    // Clear localStorage to ensure fresh state
    await page.goto('/music')
    await page.evaluate(() => localStorage.clear())
    
    // Reload to trigger unlock overlay
    await page.reload()
    
    // Check that unlock overlay is visible
    const overlay = page.locator('[data-testid="audio-unlock-overlay"]')
    await expect(overlay).toBeVisible()
    
    // Check overlay content
    await expect(page.locator('text=Tap to Start Music')).toBeVisible()
    
    // Click to unlock
    await overlay.click()
    
    // Overlay should hide
    await expect(overlay).not.toBeVisible()
    
    // Check that unlock status is persisted
    const unlockStatus = await page.evaluate(() => localStorage.getItem('broski_audio_unlocked'))
    expect(unlockStatus).toBe('true')
    
    // Audio should be ready to play (not paused by default)
    const audioElement = page.locator('audio')
    await expect(audioElement).toBeAttached()
    
    // Verify audio context is resumed
    const audioContextState = await page.evaluate(() => {
      // @ts-ignore - accessing global audio context
      return window.audioContext?.state
    })
    expect(audioContextState).toBe('running')
  })

  test('should not show overlay on non-iOS devices', async ({ page }) => {
    // Use default desktop user agent
    await page.goto('/music')
    
    // Overlay should not be visible
    const overlay = page.locator('[data-testid="audio-unlock-overlay"]')
    await expect(overlay).not.toBeVisible()
  })

  test('should not show overlay if already unlocked', async ({ page, context }) => {
    // Simulate iOS Safari user agent
    await context.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1')
    
    // Set unlock status in localStorage
    await page.goto('/music')
    await page.evaluate(() => localStorage.setItem('broski_audio_unlocked', 'true'))
    
    // Reload page
    await page.reload()
    
    // Overlay should not be visible
    const overlay = page.locator('[data-testid="audio-unlock-overlay"]')
    await expect(overlay).not.toBeVisible()
  })

  test('should handle unlock failure gracefully', async ({ page, context }) => {
    // Simulate iOS Safari user agent
    await context.setUserAgent('Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1')
    
    await page.goto('/music')
    
    // Mock audio context to fail
    await page.evaluate(() => {
      // @ts-ignore - mocking for test
      window.AudioContext = class {
        constructor() {
          throw new Error('AudioContext creation failed')
        }
      }
    })
    
    const overlay = page.locator('[data-testid="audio-unlock-overlay"]')
    await expect(overlay).toBeVisible()
    
    // Click to attempt unlock
    await overlay.click()
    
    // Overlay should still be visible on failure
    await expect(overlay).toBeVisible()
    
    // Unlock status should not be set
    const unlockStatus = await page.evaluate(() => localStorage.getItem('broski_audio_unlocked'))
    expect(unlockStatus).toBeNull()
  })
})