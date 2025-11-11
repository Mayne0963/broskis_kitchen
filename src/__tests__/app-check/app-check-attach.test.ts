import { describe, it, expect, vi, beforeEach } from 'vitest'
import { safeFetch } from '@/lib/utils/safeFetch'
import { authFetch } from '@/lib/utils/authFetch'

// Mock firebase app-check to return a token
vi.mock('firebase/app-check', () => {
  return {
    getAppCheck: vi.fn(() => ({ /* stub instance */ })),
    getToken: vi.fn(async (_appCheck: any, _forceRefresh: boolean) => ({ token: 'apptok-123' })),
  }
})

describe('App Check header attachment', () => {
  let fetchSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    // Reset fetch mock between tests
    fetchSpy = vi.spyOn(global, 'fetch')
  })

  it('safeFetch attaches X-Firebase-AppCheck when token available', async () => {
    fetchSpy.mockResolvedValue(new Response(null, { status: 200 }))

    await safeFetch('/api/test', { method: 'GET' })

    expect(fetchSpy).toHaveBeenCalled()
    const [, init] = fetchSpy.mock.calls[0]
    const h = new Headers((init as any)?.headers)
    expect(h.get('X-Firebase-AppCheck')).toBe('apptok-123')
  })

  it('authFetch attaches App Check on initial request and retry after refresh', async () => {
    // Sequence: initial request (401) → refresh (200) → retry (200)
    fetchSpy.mockImplementation(async (input: any, init?: any) => {
      const url = typeof input === 'string' ? input : input?.url
      if (url?.includes('/api/auth/refresh')) {
        return new Response(null, { status: 200 })
      }
      if (url?.includes('/api/protected')) {
        // First call returns 401; second returns 200
        const callCount = fetchSpy.mock.calls.filter(c => (typeof c[0] === 'string' ? c[0] : c[0]?.url)?.includes('/api/protected')).length
        return new Response(null, { status: callCount === 0 ? 401 : 200 })
      }
      return new Response(null, { status: 200 })
    })

    // Trigger authFetch
    await authFetch('/api/protected', { method: 'GET' })

    // Verify first request headers include App Check
    const firstProtected = fetchSpy.mock.calls.find(c => (typeof c[0] === 'string' ? c[0] : c[0]?.url) === '/api/protected')
    const h1 = new Headers((firstProtected as any)[1]?.headers)
    expect(h1.get('X-Firebase-AppCheck')).toBe('apptok-123')

    // Verify retry request headers include App Check
    const protectedCalls = fetchSpy.mock.calls.filter(c => (typeof c[0] === 'string' ? c[0] : c[0]?.url) === '/api/protected')
    expect(protectedCalls.length).toBeGreaterThanOrEqual(2)
    const retryInit = protectedCalls[1][1]
    const h2 = new Headers((retryInit as any)?.headers)
    expect(h2.get('X-Firebase-AppCheck')).toBe('apptok-123')
  })
})