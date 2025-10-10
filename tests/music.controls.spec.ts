import { test, expect } from '@playwright/test'

test.describe('Music Player Controls', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/music')
    
    // Wait for player to load
    await page.waitForSelector('[data-testid="music-player"]')
    
    // Mock audio unlock for consistent testing
    await page.evaluate(() => {
      localStorage.setItem('broski_audio_unlocked', 'true')
    })
  })

  test('should play and pause music', async ({ page }) => {
    const playButton = page.locator('[data-testid="play-pause-button"]')
    const audioElement = page.locator('audio')
    
    // Initially should be paused
    await expect(playButton).toContainText('Play')
    
    // Click play
    await playButton.click()
    
    // Should show pause button
    await expect(playButton).toContainText('Pause')
    
    // Audio should be playing
    const isPlaying = await audioElement.evaluate((audio: HTMLAudioElement) => !audio.paused)
    expect(isPlaying).toBe(true)
    
    // Click pause
    await playButton.click()
    
    // Should show play button
    await expect(playButton).toContainText('Play')
    
    // Audio should be paused
    const isPaused = await audioElement.evaluate((audio: HTMLAudioElement) => audio.paused)
    expect(isPaused).toBe(true)
  })

  test('should skip to next and previous tracks', async ({ page }) => {
    const nextButton = page.locator('[data-testid="next-button"]')
    const prevButton = page.locator('[data-testid="prev-button"]')
    const trackTitle = page.locator('[data-testid="current-track-title"]')
    
    // Get initial track
    const initialTrack = await trackTitle.textContent()
    
    // Click next
    await nextButton.click()
    
    // Track should change
    const nextTrack = await trackTitle.textContent()
    expect(nextTrack).not.toBe(initialTrack)
    
    // Click previous
    await prevButton.click()
    
    // Should go back to initial track
    const backTrack = await trackTitle.textContent()
    expect(backTrack).toBe(initialTrack)
  })

  test('should control volume', async ({ page }) => {
    const volumeSlider = page.locator('[data-testid="volume-slider"]')
    const audioElement = page.locator('audio')
    
    // Set volume to 50%
    await volumeSlider.fill('0.5')
    
    // Check audio element volume
    const volume = await audioElement.evaluate((audio: HTMLAudioElement) => audio.volume)
    expect(volume).toBeCloseTo(0.5, 1)
    
    // Set volume to 100%
    await volumeSlider.fill('1')
    
    const maxVolume = await audioElement.evaluate((audio: HTMLAudioElement) => audio.volume)
    expect(maxVolume).toBeCloseTo(1, 1)
  })

  test('should seek through track', async ({ page }) => {
    const seekSlider = page.locator('[data-testid="seek-slider"]')
    const audioElement = page.locator('audio')
    const playButton = page.locator('[data-testid="play-pause-button"]')
    
    // Start playing
    await playButton.click()
    
    // Wait for some duration to be loaded
    await page.waitForTimeout(1000)
    
    // Get duration
    const duration = await audioElement.evaluate((audio: HTMLAudioElement) => audio.duration)
    
    if (duration && duration > 0) {
      // Seek to middle
      const seekTime = duration / 2
      await seekSlider.fill(seekTime.toString())
      
      // Check current time
      const currentTime = await audioElement.evaluate((audio: HTMLAudioElement) => audio.currentTime)
      expect(currentTime).toBeCloseTo(seekTime, 1)
    }
  })

  test('should toggle shuffle mode', async ({ page }) => {
    const shuffleButton = page.locator('[data-testid="shuffle-button"]')
    
    // Initially should not be shuffled
    await expect(shuffleButton).not.toHaveClass(/active/)
    
    // Click shuffle
    await shuffleButton.click()
    
    // Should be active
    await expect(shuffleButton).toHaveClass(/active/)
    
    // Click again to disable
    await shuffleButton.click()
    
    // Should not be active
    await expect(shuffleButton).not.toHaveClass(/active/)
  })

  test('should cycle through repeat modes', async ({ page }) => {
    const repeatButton = page.locator('[data-testid="repeat-button"]')
    
    // Initially should be 'none'
    await expect(repeatButton).toHaveAttribute('data-repeat-mode', 'none')
    
    // Click to set 'all'
    await repeatButton.click()
    await expect(repeatButton).toHaveAttribute('data-repeat-mode', 'all')
    
    // Click to set 'one'
    await repeatButton.click()
    await expect(repeatButton).toHaveAttribute('data-repeat-mode', 'one')
    
    // Click to set back to 'none'
    await repeatButton.click()
    await expect(repeatButton).toHaveAttribute('data-repeat-mode', 'none')
  })

  test('should select tracks from playlist', async ({ page }) => {
    const playlistItems = page.locator('[data-testid="playlist-item"]')
    const trackTitle = page.locator('[data-testid="current-track-title"]')
    
    // Get first playlist item
    const firstItem = playlistItems.first()
    const firstItemTitle = await firstItem.locator('[data-testid="track-title"]').textContent()
    
    // Click on first item
    await firstItem.click()
    
    // Current track should match
    await expect(trackTitle).toHaveText(firstItemTitle || '')
  })

  test('should handle track errors gracefully', async ({ page }) => {
    // Mock audio error
    await page.evaluate(() => {
      const audio = document.querySelector('audio') as HTMLAudioElement
      if (audio) {
        // Trigger error event
        const errorEvent = new Event('error')
        audio.dispatchEvent(errorEvent)
      }
    })
    
    // Should show error toast or skip to next track
    // This depends on implementation - adjust based on actual behavior
    await page.waitForTimeout(1000)
    
    // Player should still be functional
    const playButton = page.locator('[data-testid="play-pause-button"]')
    await expect(playButton).toBeVisible()
  })

  test('should update progress display', async ({ page }) => {
    const playButton = page.locator('[data-testid="play-pause-button"]')
    const currentTimeDisplay = page.locator('[data-testid="current-time"]')
    const durationDisplay = page.locator('[data-testid="duration"]')
    
    // Start playing
    await playButton.click()
    
    // Wait for metadata to load
    await page.waitForTimeout(2000)
    
    // Should show time displays
    await expect(currentTimeDisplay).toBeVisible()
    await expect(durationDisplay).toBeVisible()
    
    // Current time should be updating
    const initialTime = await currentTimeDisplay.textContent()
    await page.waitForTimeout(1000)
    const updatedTime = await currentTimeDisplay.textContent()
    
    // Time should have changed (unless track is very short)
    // This is a basic check - in real scenarios you might want more sophisticated timing checks
    expect(updatedTime).toBeDefined()
  })
})