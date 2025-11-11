import { renderHook } from '@testing-library/react'
import { vi } from 'vitest'
import { useAdminData } from '@/hooks/useAdminData'
import * as firestore from 'firebase/firestore'

// Mock role as admin
vi.mock('@/context/RoleContext', () => ({ useRole: () => 'admin' }))

// Mock firebase client
vi.mock('@/lib/firebase/client', () => ({
  db: {},
  isFirebaseConfigured: true,
}))

// Firestore mocks: define inside factory to avoid TDZ with hoisted vi.mock
vi.mock('firebase/firestore', () => {
  const getDocs = vi.fn(async () => ({ docs: [] }))
  const onSnapshot = vi.fn(() => vi.fn())
  return {
    getDocs,
    onSnapshot,
    collection: vi.fn(),
    query: vi.fn(),
    orderBy: vi.fn(),
    limit: vi.fn(),
    // expose refs for test usage
    __mocks: { getDocs, onSnapshot },
  }
})

describe('useAdminData - streaming mode', () => {
  const originalEnv = process.env.NEXT_PUBLIC_FIRESTORE_USE_POLLING

  beforeEach(() => {
    process.env.NEXT_PUBLIC_FIRESTORE_USE_POLLING = 'false'
    // access mocked functions via module import
    // @ts-ignore
    const { __mocks } = firestore as any
    __mocks.getDocs.mockClear()
    __mocks.onSnapshot.mockClear()
  })

  afterEach(() => {
    process.env.NEXT_PUBLIC_FIRESTORE_USE_POLLING = originalEnv
  })

  it('attaches listeners when polling is disabled', async () => {
    renderHook(() => useAdminData())
    // @ts-ignore
    const { __mocks } = firestore as any
    expect(__mocks.onSnapshot).toHaveBeenCalled()
    expect(__mocks.getDocs).toHaveBeenCalled()
  })
})