/**
 * Lightweight analytics system for Broski Music Player
 * Tracks key events without blocking playback functionality
 * Uses console.info and window.dataLayer for minimal overhead
 */

interface AnalyticsEvent {
  event: string;
  timestamp: number;
  data?: Record<string, any>;
}

interface TrackData {
  id: string;
  src: string;
  title?: string;
  artist?: string;
}

interface TrackErrorData extends TrackData {
  code: string | number;
  message?: string;
}

class BroskiAnalytics {
  private isEnabled: boolean = true;
  private events: AnalyticsEvent[] = [];

  constructor() {
    // Initialize dataLayer if it doesn't exist
    if (typeof window !== 'undefined') {
      (window as any).dataLayer = (window as any).dataLayer || [];
    }
  }

  /**
   * Safe analytics call that never blocks functionality
   */
  private track(event: string, data?: Record<string, any>): void {
    if (!this.isEnabled) return;

    try {
      const analyticsEvent: AnalyticsEvent = {
        event,
        timestamp: Date.now(),
        data
      };

      // Store locally for debugging
      this.events.push(analyticsEvent);

      // Console logging for development/debugging
      console.info(`🎵 Broski Analytics: ${event}`, data || '');

      // Push to dataLayer for external analytics (GTM, etc.)
      if (typeof window !== 'undefined' && (window as any).dataLayer) {
        (window as any).dataLayer.push({
          event: `broski_${event}`,
          ...data,
          timestamp: analyticsEvent.timestamp
        });
      }
    } catch (error) {
      // Never let analytics break the app
      console.warn('Analytics error (non-blocking):', error);
    }
  }

  /**
   * Track successful JSON data loading
   */
  musicLoaded(tracksCount: number, playlistsCount: number): void {
    this.track('music_loaded', {
      tracks_count: tracksCount,
      playlists_count: playlistsCount,
      load_time: Date.now()
    });
  }

  /**
   * Track iOS/Safari autoplay unlock tap
   */
  unlockTap(device?: string): void {
    this.track('unlock_tap', {
      device: device || this.detectDevice(),
      user_agent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown'
    });
  }

  /**
   * Track when a track starts playing
   */
  trackPlay(track: TrackData): void {
    this.track('track_play', {
      track_id: track.id,
      track_src: track.src,
      track_title: track.title,
      track_artist: track.artist,
      play_time: Date.now()
    });
  }

  /**
   * Track track errors and failures
   */
  trackError(track: TrackErrorData): void {
    this.track('track_error', {
      track_id: track.id,
      track_src: track.src,
      track_title: track.title,
      error_code: track.code,
      error_message: track.message,
      error_time: Date.now()
    });
  }

  /**
   * Track playlist changes
   */
  playlistChange(playlistName: string, trackCount: number): void {
    this.track('playlist_change', {
      playlist_name: playlistName,
      track_count: trackCount
    });
  }

  /**
   * Track volume changes
   */
  volumeChange(volume: number): void {
    this.track('volume_change', {
      volume_level: volume
    });
  }

  /**
   * Detect device type for analytics
   */
  private detectDevice(): string {
    if (typeof navigator === 'undefined') return 'unknown';
    
    const ua = navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
    if (/Android/.test(ua)) return 'android';
    if (/Mac/.test(ua)) return 'mac';
    if (/Windows/.test(ua)) return 'windows';
    return 'other';
  }

  /**
   * Get recent events for debugging
   */
  getRecentEvents(limit: number = 10): AnalyticsEvent[] {
    return this.events.slice(-limit);
  }

  /**
   * Clear stored events
   */
  clearEvents(): void {
    this.events = [];
  }

  /**
   * Disable analytics (for privacy compliance)
   */
  disable(): void {
    this.isEnabled = false;
  }

  /**
   * Enable analytics
   */
  enable(): void {
    this.isEnabled = true;
  }
}

// Create singleton instance
export const analytics = new BroskiAnalytics();

// Export types for use in components
export type { TrackData, TrackErrorData, AnalyticsEvent };