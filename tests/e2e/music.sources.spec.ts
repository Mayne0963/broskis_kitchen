import { test, expect } from '@playwright/test';

test.describe('Music Local Sources', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to music page
    await page.goto('/music');
    
    // Wait for tracks to load
    await page.waitForSelector('[data-testid="track-path"]', { timeout: 10000 });
    
    // Handle iOS audio unlock if present
    const unlockButton = page.locator('text=Tap to Start');
    if (await unlockButton.isVisible()) {
      await unlockButton.click();
      await page.waitForTimeout(1000);
    }
  });

  test('should load tracks with local audio sources only', async ({ page }) => {
    // Check that all tracks have local audio paths
    const trackPaths = await page.locator('[data-testid="track-path"]').allTextContents();
    
    expect(trackPaths.length).toBeGreaterThan(0);
    
    for (const path of trackPaths) {
      expect(path).toMatch(/^\/audio\//);
      expect(path).not.toContain('http');
      expect(path).not.toContain('soundjay');
      expect(path).not.toContain('external');
    }
  });

  test('should have all three playlists available', async ({ page }) => {
    // Check for playlist buttons
    const playlistButtons = page.locator('button').filter({ hasText: /Chill Lofi|Acoustic Guitar|Broski Mix/ });
    
    await expect(playlistButtons).toHaveCount(3);
    
    // Verify each playlist exists
    await expect(page.locator('button', { hasText: 'Chill Lofi' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Acoustic Guitar' })).toBeVisible();
    await expect(page.locator('button', { hasText: 'Broski Mix' })).toBeVisible();
  });

  test('should play first 3 tracks from Chill Lofi playlist', async ({ page }) => {
    // Select Chill Lofi playlist
    await page.click('button:has-text("Chill Lofi")');
    await page.waitForTimeout(1000);
    
    // Open playlist panel
    await page.click('[data-testid="playlist-toggle"]', { timeout: 5000 }).catch(() => {
      // If playlist toggle not found, try the list icon
      return page.click('button:has([class*="lucide-list"])', { timeout: 5000 });
    });
    
    // Get first 3 tracks
    const tracks = page.locator('[data-testid^="track-"]').first(3);
    const trackCount = await tracks.count();
    const testCount = Math.min(trackCount, 3);
    
    for (let i = 0; i < testCount; i++) {
      const track = tracks.nth(i);
      
      // Click track to play
      await track.click();
      await page.waitForTimeout(2000);
      
      // Check audio element
      const audio = page.locator('audio');
      await expect(audio).toBeAttached();
      
      // Verify audio source is local
      const audioSrc = await audio.getAttribute('src');
      expect(audioSrc).toMatch(/^\/audio\//);
      
      // Check for audio errors
      const audioError = await audio.evaluate((el: HTMLAudioElement) => el.error);
      expect(audioError).toBeNull();
      
      // Verify audio is progressing
      await page.waitForTimeout(3000);
      const currentTime = await audio.evaluate((el: HTMLAudioElement) => el.currentTime);
      expect(currentTime).toBeGreaterThan(2);
      
      // Verify current source includes local path
      const currentSrc = await audio.evaluate((el: HTMLAudioElement) => el.currentSrc);
      expect(currentSrc).toContain('/audio/');
    }
  });

  test('should play first 3 tracks from Acoustic Guitar playlist', async ({ page }) => {
    // Select Acoustic Guitar playlist
    await page.click('button:has-text("Acoustic Guitar")');
    await page.waitForTimeout(1000);
    
    // Open playlist panel
    await page.click('[data-testid="playlist-toggle"]', { timeout: 5000 }).catch(() => {
      return page.click('button:has([class*="lucide-list"])', { timeout: 5000 });
    });
    
    // Get first 3 tracks (or all if less than 3)
    const tracks = page.locator('[data-testid^="track-"]').first(3);
    const trackCount = await tracks.count();
    const testCount = Math.min(trackCount, 3);
    
    for (let i = 0; i < testCount; i++) {
      const track = tracks.nth(i);
      
      // Click track to play
      await track.click();
      await page.waitForTimeout(2000);
      
      // Check audio element
      const audio = page.locator('audio');
      await expect(audio).toBeAttached();
      
      // Verify audio source is local
      const audioSrc = await audio.getAttribute('src');
      expect(audioSrc).toMatch(/^\/audio\//);
      
      // Check for audio errors
      const audioError = await audio.evaluate((el: HTMLAudioElement) => el.error);
      expect(audioError).toBeNull();
      
      // Verify audio is progressing
      await page.waitForTimeout(3000);
      const currentTime = await audio.evaluate((el: HTMLAudioElement) => el.currentTime);
      expect(currentTime).toBeGreaterThan(2);
      
      // Verify current source includes local path
      const currentSrc = await audio.evaluate((el: HTMLAudioElement) => el.currentSrc);
      expect(currentSrc).toContain('/audio/');
    }
  });

  test('should play first 3 tracks from Broski Mix playlist', async ({ page }) => {
    // Select Broski Mix playlist
    await page.click('button:has-text("Broski Mix")');
    await page.waitForTimeout(1000);
    
    // Open playlist panel
    await page.click('[data-testid="playlist-toggle"]', { timeout: 5000 }).catch(() => {
      return page.click('button:has([class*="lucide-list"])', { timeout: 5000 });
    });
    
    // Get first 3 tracks
    const tracks = page.locator('[data-testid^="track-"]').first(3);
    const trackCount = await tracks.count();
    const testCount = Math.min(trackCount, 3);
    
    for (let i = 0; i < testCount; i++) {
      const track = tracks.nth(i);
      
      // Click track to play
      await track.click();
      await page.waitForTimeout(2000);
      
      // Check audio element
      const audio = page.locator('audio');
      await expect(audio).toBeAttached();
      
      // Verify audio source is local
      const audioSrc = await audio.getAttribute('src');
      expect(audioSrc).toMatch(/^\/audio\//);
      
      // Check for audio errors
      const audioError = await audio.evaluate((el: HTMLAudioElement) => el.error);
      expect(audioError).toBeNull();
      
      // Verify audio is progressing
      await page.waitForTimeout(3000);
      const currentTime = await audio.evaluate((el: HTMLAudioElement) => el.currentTime);
      expect(currentTime).toBeGreaterThan(2);
      
      // Verify current source includes local path
      const currentSrc = await audio.evaluate((el: HTMLAudioElement) => el.currentSrc);
      expect(currentSrc).toContain('/audio/');
    }
  });

  test('should verify all track data-path attributes point to local files', async ({ page }) => {
    // Get all tracks with data-path attributes
    const trackElements = page.locator('[data-path]');
    const trackPaths = await trackElements.evaluateAll((elements) => 
      elements.map(el => el.getAttribute('data-path'))
    );
    
    expect(trackPaths.length).toBeGreaterThan(0);
    
    for (const path of trackPaths) {
      expect(path).toMatch(/^\/audio\//);
      expect(path).toMatch(/\.(mp3|m4a)$/);
      expect(path).not.toContain('http');
    }
  });

  test('should maintain iOS audio unlock functionality', async ({ page }) => {
    // This test verifies that the audio unlock overlay still works
    // We already handle it in beforeEach, but let's verify the functionality exists
    
    // Check if unlock overlay elements exist (they might not be visible if already unlocked)
    const unlockOverlay = page.locator('[data-testid="audio-unlock-overlay"]');
    const unlockButton = page.locator('text=Tap to Start');
    
    // If overlay is present, it should be functional
    if (await unlockOverlay.isVisible()) {
      await expect(unlockButton).toBeVisible();
      await unlockButton.click();
      
      // After clicking, overlay should disappear
      await expect(unlockOverlay).not.toBeVisible();
    }
    
    // Audio element should have proper attributes for iOS
    const audio = page.locator('audio');
    await expect(audio).toBeAttached();
    
    const playsInline = await audio.getAttribute('playsinline');
    const preload = await audio.getAttribute('preload');
    const crossOrigin = await audio.getAttribute('crossorigin');
    
    expect(playsInline).toBe('');
    expect(preload).toBe('metadata');
    expect(crossOrigin).toBe('anonymous');
  });

  test('should not have any external URLs in tracks or playlists data', async ({ page }) => {
    // Check the API responses for external URLs
    const tracksResponse = await page.request.get('/api/tracks');
    const tracksData = await tracksResponse.json();
    
    const playlistsResponse = await page.request.get('/api/playlists');
    const playlistsData = await playlistsResponse.json();
    
    // Verify tracks don't contain external URLs
    for (const track of tracksData) {
      if (track.src_mp3) {
        expect(track.src_mp3).toMatch(/^\/audio\//);
        expect(track.src_mp3).not.toContain('http');
      }
      if (track.src_m4a) {
        expect(track.src_m4a).toMatch(/^\/audio\//);
        expect(track.src_m4a).not.toContain('http');
      }
      if (track.src) {
        expect(track.src).toMatch(/^\/audio\//);
        expect(track.src).not.toContain('http');
      }
    }
    
    // Verify playlists structure
    expect(Array.isArray(playlistsData)).toBe(true);
    expect(playlistsData.length).toBeGreaterThan(0);
    
    for (const playlist of playlistsData) {
      expect(playlist).toHaveProperty('id');
      expect(playlist).toHaveProperty('title');
      expect(playlist).toHaveProperty('trackIds');
      expect(Array.isArray(playlist.trackIds)).toBe(true);
    }
  });
});