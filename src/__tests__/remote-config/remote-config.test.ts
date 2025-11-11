import { describe, it, expect, vi, beforeEach } from 'vitest'
import { getRemoteConfigInstance, loadRemoteConfig, getRemoteValue, resetRemoteConfigForTest } from '@/lib/remoteConfig'

// Mock firebase/app and firebase/remote-config
let mockApps: any[] = [true]
vi.mock('firebase/app', () => ({
  getApps: vi.fn(() => mockApps),
  getApp: vi.fn(() => ({ name: 'mock' })),
}))

const mockRC: any = {
  settings: {},
  defaultConfig: {},
}

vi.mock('firebase/remote-config', () => ({
  getRemoteConfig: vi.fn(() => mockRC),
  fetchAndActivate: vi.fn(async () => true),
  getValue: vi.fn((_rc: any, key: string) => ({ asString: () => key === 'feature_flag' ? 'on' : '' })),
}))

describe('Remote Config helper', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockApps = [true]
    // Ensure window exists for RC
    ;(globalThis as any).window = {}
    resetRemoteConfigForTest()
  })

  it('initializes when Firebase app exists', () => {
    const rc = getRemoteConfigInstance()
    expect(rc).toBeTruthy()
    expect(rc?.settings.fetchTimeoutMillis).toBe(60_000)
  })

  it('returns null when Firebase app not initialized', () => {
    mockApps = []
    const rc = getRemoteConfigInstance()
    expect(rc).toBeNull()
  })

  it('fetches and activates safely', async () => {
    const ok = await loadRemoteConfig()
    expect(ok).toBe(true)
  })

  it('getRemoteValue returns fallback on failure', () => {
    mockApps = []
    const val = getRemoteValue('some_key', 'fallback')
    expect(val).toBe('fallback')
  })

  it('getRemoteValue returns string from RC when available', () => {
    const val = getRemoteValue('feature_flag', 'off')
    expect(val).toBe('on')
  })
})