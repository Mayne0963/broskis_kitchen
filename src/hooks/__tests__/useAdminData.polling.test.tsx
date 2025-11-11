import { renderHook, act } from '@testing-library/react'
import { vi } from 'vitest'
import { useAdminData } from '@/hooks/useAdminData'
import * as firestore from 'firebase/firestore'

// Mock role context as admin
vi.mock('@/context/RoleContext', () => ({
  useRole: () => 'admin',
}))

// Mock firebase client: define inside factory to avoid TDZ
vi.mock('@/lib/firebase/client', () => ({
  db: {},
  isFirebaseConfigured: true,
}))

// Firestore API mocks inside factory with exposed references
vi.mock('firebase/firestore', () => {
  const getDocs = vi.fn(async () => ({ docs: [] }))
  const onSnapshot = vi.fn()
  return {
    getDocs,
    collection: vi.fn(),
    query: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    onSnapshot,
    __mocks: { getDocs, onSnapshot },
  }
})

describe('useAdminData - polling mode', () => {
  const originalEnv = process.env.NEXT_PUBLIC_FIRESTORE_USE_POLLING

  beforeEach(() => {
    vi.useFakeTimers()
    process.env.NEXT_PUBLIC_FIRESTORE_USE_POLLING = 'true'
    // @ts-ignore
    const { __mocks } = firestore as any
    __mocks.getDocs.mockResolvedValueOnce({ docs: [] })
  })

  afterEach(() => {
    vi.useRealTimers()
    // @ts-ignore
    const { __mocks } = firestore as any
    __mocks.getDocs.mockReset()
    process.env.NEXT_PUBLIC_FIRESTORE_USE_POLLING = originalEnv
  })

  it('does not attach listeners when polling is enabled and fetches periodically', async () => {
    const { result } = renderHook(() => useAdminData())

    // Initial fetch
    // @ts-ignore
    const { __mocks } = firestore as any
    expect(__mocks.getDocs).toHaveBeenCalled()
    expect(__mocks.onSnapshot).not.toHaveBeenCalled()

    // Advance timer to trigger polling refetch
    act(() => {
      vi.advanceTimersByTime(5000)
    })

    // Should fetch again at least once
    // @ts-ignore
    const calls = (firestore as any).__mocks.getDocs.mock.calls.length
    expect(calls).toBeGreaterThanOrEqual(2)

    // Cleanup should clear interval
    act(() => {
      result.current.unsubscribe && result.current.unsubscribe()
    })
  })
})