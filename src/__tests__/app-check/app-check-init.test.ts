import { describe, it, expect, vi, beforeEach } from 'vitest'

// We target src/lib/firebase/client.ts init behavior
let apps: any[] = []
vi.mock('firebase/app', () => ({
  initializeApp: vi.fn(() => ({ name: 'mock' })),
  getApps: vi.fn(() => apps),
  getApp: vi.fn(() => ({ name: 'mock' })),
}))

const initSpy = vi.fn()
vi.mock('firebase/app-check', () => ({
  initializeAppCheck: initSpy,
  ReCaptchaV3Provider: vi.fn(function Provider(this: any, key: string) { this.key = key }),
}))

describe('App Check initialization', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(globalThis as any).window = {}
    process.env.NEXT_PUBLIC_RECAPTCHA_V3_SITE_KEY = 'test-site-key'
    apps = [true]
    // Provide minimal Firebase client config so client initializes
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY = 'x'
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN = 'x'
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID = 'x'
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET = 'x'
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID = 'x'
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID = 'x'
  })

  it('initializes App Check when site key present', async () => {
    await import('@/lib/firebase/client')
    expect(initSpy).toHaveBeenCalled()
  })

  it('does not throw when initialization fails', async () => {
    initSpy.mockImplementationOnce(() => { throw new Error('init failed') })
    const mod = await import('@/lib/firebase/client')
    expect(mod).toBeDefined()
  })
})