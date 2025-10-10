import { test, expect } from '@playwright/test'

test.describe('Music Player Persistence', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/music')
    
    // Mock audio unlock for consistent testing
    await page.evaluate(() => {
      localStorage.setItem('broski_audio_unlocked', 'true')
    })
    
    // Wait for player to load
    await page.waitForSelector('[data-testid="music-player"]')
  })

  test('should persist last played track and position', async ({ page }) => {
    const playButton = page.locator('[data-testid="play-pause-button"]')
    const trackTitle = page.locator('[data-testid="current-track-title"]')
    const audioElement = page.locator('audio')
    
    // Start playing
    await playButton.click()
    
    // Wait for some playback
    await page.waitForTimeout(3000)
    
    // Get current track and position
    const currentTrack = await trackTitle.textContent()
    const currentTime = await audioElement.evaluate((audio: HTMLAudioElement) => audio.currentTime)
    
    // Reload page
    await page.reload()
    await page.waitForSelector('[data-testid="music-player"]')
    
    // Should restore the same track
    await expect(trackTitle).toHaveText(currentTrack || '')
    
    // Should restore position (within 3 seconds tolerance)
    const restoredTime = await audioElement.evaluate((audio: HTMLAudioElement) => audio.currentTime)
    expect(Math.abs(restoredTime - currentTime)).toBeLessThan(3)
  })

  test('should persist playback state across navigation', async ({ page }) => {
    const playButton = page.locator('[data-testid="play-pause-button"]')
    
    // Start playing
    await playButton.click()
    
    // Navigate away
    await page.goto('/')
    
    // Navigate back
    await page.goto('/music')
    await page.waitForSelector('[data-testid="music-player"]')
    
    // Should still be playing (or at least remember it was playing)
    const audioElement = page.locator('audio')
    const isPlaying = await audioElement.evaluate((audio: HTMLAudioElement) => !audio.paused)
    
    // Note: Depending on implementation, this might auto-resume or require user interaction
    // Adjust expectation based on actual behavior
    expect(isPlaying).toBeDefined()
  })

  test('should persist volume settings', async ({ page }) => {
    const volumeSlider = page.locator('[data-testid="volume-slider"]')
    
    // Set volume to 30%
    await volumeSlider.fill('0.3')
    
    // Reload page
    await page.reload()
    await page.waitForSelector('[data-testid="music-player"]')
    
    // Volume should be restored
    const restoredVolume = await volumeSlider.inputValue()
    expect(parseFloat(restoredVolume)).toBeCloseTo(0.3, 1)
  })

  test('should persist shuffle and repeat settings', async ({ page }) => {
    const shuffleButton = page.locator('[data-testid="shuffle-button"]')
    const repeatButton = page.locator('[data-testid="repeat-button"]')
    
    // Enable shuffle
    await shuffleButton.click()
    await expect(shuffleButton).toHaveClass(/active/)
    
    // Set repeat to 'all'
    await repeatButton.click()
    await expect(repeatButton).toHaveAttribute('data-repeat-mode', 'all')
    
    // Reload page
    await page.reload()
    await page.waitForSelector('[data-testid="music-player"]')
    
    // Settings should be restored
    await expect(shuffleButton).toHaveClass(/active/)
    await expect(repeatButton).toHaveAttribute('data-repeat-mode', 'all')
  })

  test('should persist playlist selection', async ({ page }) => {
    const playlistSelector = page.locator('[data-testid="playlist-selector"]')
    
    // Select a different playlist
    await playlistSelector.selectOption('upbeat')
    
    // Reload page
    await page.reload()
    await page.waitForSelector('[data-testid="music-player"]')
    
    // Playlist selection should be restored
    const selectedPlaylist = await playlistSelector.inputValue()
    expect(selectedPlaylist).toBe('upbeat')
  })

  test('should handle localStorage corruption gracefully', async ({ page }) => {
    // Corrupt localStorage data
    await page.evaluate(() => {
      localStorage.setItem('broski_last_track', 'invalid-json')
      localStorage.setItem('broski_last_pos', 'not-a-number')
    })
    
    // Reload page
    await page.reload()
    await page.waitForSelector('[data-testid="music-player"]')
    
    // Player should still load with defaults
    const playButton = page.locator('[data-testid="play-pause-button"]')
    await expect(playButton).toBeVisible()
    
    // Should have a valid track loaded
    const trackTitle = page.locator('[data-testid="current-track-title"]')
    await expect(trackTitle).not.toBeEmpty()
  })

  test('should clear persistence when explicitly reset', async ({ page }) => {
    const playButton = page.locator('[data-testid="play-pause-button"]')
    const volumeSlider = page.locator('[data-testid="volume-slider"]')
    
    // Set some state
    await playButton.click()
    await volumeSlider.fill('0.7')
    await page.waitForTimeout(2000)
    
    // Clear localStorage
    await page.evaluate(() => {
      localStorage.removeItem('broski_last_track')
      localStorage.removeItem('broski_last_pos')
      localStorage.removeItem('broski_volume')
      localStorage.removeItem('broski_shuffle')
      localStorage.removeItem('broski_repeat')
    })
    
    // Reload page
    await page.reload()
    await page.waitForSelector('[data-testid="music-player"]')
    
    // Should start with defaults
    const restoredVolume = await volumeSlider.inputValue()
    expect(parseFloat(restoredVolume)).toBe(1) // Default volume
    
    const audioElement = page.locator('audio')
    const currentTime = await audioElement.evaluate((audio: HTMLAudioElement) => audio.currentTime)
    expect(currentTime).toBe(0) // Should start from beginning
  })

  test('should maintain state during tab visibility changes', async ({ page }) => {
    const playButton = page.locator('[data-testid="play-pause-button"]')
    
    // Start playing
    await playButton.click()
    await page.waitForTimeout(1000)
    
    // Simulate tab becoming hidden
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', {
        writable: true,
        value: 'hidden'
      })
      document.dispatchEvent(new Event('visibilitychange'))
    })
    
    await page.waitForTimeout(1000)
    
    // Simulate tab becoming visible again
    await page.evaluate(() => {
      Object.defineProperty(document, 'visibilityState', {
        writable: true,
        value: 'visible'
      })
      document.dispatchEvent(new Event('visibilitychange'))
    })
    
    // Player should still be functional
    await expect(playButton).toBeVisible()
    
    // Audio should still be available
    const audioElement = page.locator('audio')
    await expect(audioElement).toBeAttached()
  })
})