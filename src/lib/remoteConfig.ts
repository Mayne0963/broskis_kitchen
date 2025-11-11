// Remote Config helper using Firebase Web SDK
// Provides safe initialization and fetch utilities wrapped with error handling

import { getApps, getApp } from 'firebase/app'
import { getRemoteConfig, fetchAndActivate, getValue, type RemoteConfig } from 'firebase/remote-config'

let rc: RemoteConfig | null = null
let initialized = false

/**
 * Initialize and return Remote Config instance if Firebase app exists.
 * Does not create a Firebase app; expects it to be initialized elsewhere.
 */
export function getRemoteConfigInstance(): RemoteConfig | null {
  try {
    if (typeof window === 'undefined') return null
    if (rc && initialized) return rc

    const app = getApps().length ? getApp() : null
    if (!app) {
      console.warn('[RemoteConfig] Firebase app not initialized; skipping RC setup')
      return null
    }

    rc = getRemoteConfig(app)
    // Dev-friendly settings; override minimum interval in development
    rc.settings = {
      fetchTimeoutMillis: 60_000,
      minimumFetchIntervalMillis: process.env.NODE_ENV === 'development' ? 0 : 60 * 60 * 1000,
    }
    // Provide safe defaults; consumers can override per key
    rc.defaultConfig = {}
    initialized = true
    return rc
  } catch (error) {
    console.warn('[RemoteConfig] Initialization failed:', error)
    return null
  }
}

/**
 * Fetch and activate remote config values safely. Returns boolean success.
 */
export async function loadRemoteConfig(): Promise<boolean> {
  try {
    const instance = getRemoteConfigInstance()
    if (!instance) return false
    const activated = await fetchAndActivate(instance)
    return activated
  } catch (error) {
    console.warn('[RemoteConfig] fetchAndActivate failed:', error)
    return false
  }
}

/**
 * Get a typed Remote Config value. Returns provided fallback on failure.
 */
export function getRemoteValue<T = string>(key: string, fallback?: T): T | string {
  try {
    const instance = getRemoteConfigInstance()
    if (!instance) return fallback ?? ''
    const val = getValue(instance, key)
    // Return as string by default; callers can parse as needed
    return (val.asString() ?? fallback ?? '') as any
  } catch (error) {
    console.warn('[RemoteConfig] getValue failed:', error)
    return fallback ?? ''
  }
}

// Test-only utility to reset module state between tests
export function resetRemoteConfigForTest(): void {
  rc = null;
  initialized = false;
}