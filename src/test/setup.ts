import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Provide Jest-compatible globals using Vitest
// This allows existing tests that use `jest.*` APIs to run under Vitest
// without rewriting all test files.
// Map commonly used timer and mock APIs.
(globalThis as any).jest = {
  ...vi,
  mock: vi.mock,
  fn: vi.fn,
  spyOn: vi.spyOn,
  useFakeTimers: vi.useFakeTimers,
  useRealTimers: vi.useRealTimers,
  clearAllMocks: vi.clearAllMocks,
  clearAllTimers: vi.clearAllTimers,
  advanceTimersByTime: vi.advanceTimersByTime,
}
// Polyfills commonly needed in jsdom tests
// TextEncoder / TextDecoder for libraries that rely on Web APIs
import { TextEncoder, TextDecoder } from 'util'
// @ts-ignore
if (!(globalThis as any).TextEncoder) {
  // @ts-ignore
  ;(globalThis as any).TextEncoder = TextEncoder
}
// @ts-ignore
if (!(globalThis as any).TextDecoder) {
  // @ts-ignore
  ;(globalThis as any).TextDecoder = TextDecoder as any
}

// Mock Next.js router
vi.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '/',
      query: {},
      asPath: '/',
      push: vi.fn(),
      replace: vi.fn(),
      reload: vi.fn(),
      back: vi.fn(),
      prefetch: vi.fn(),
      beforePopState: vi.fn(),
      events: {
        on: vi.fn(),
        off: vi.fn(),
        emit: vi.fn(),
      },
    }
  },
}))

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: vi.fn(),
      replace: vi.fn(),
      refresh: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      prefetch: vi.fn(),
    }
  },
  useSearchParams() {
    return new URLSearchParams()
  },
  usePathname() {
    return '/'
  },
}))

// Mock next-auth globally to avoid provider requirements in tests
vi.mock('next-auth/react', () => {
  let sessionState: { data: any; status: 'loading' | 'authenticated' | 'unauthenticated' } = {
    data: null,
    status: 'unauthenticated',
  }

  return {
    // Minimal provider passthrough
    SessionProvider: ({ children }: { children: React.ReactNode }) => children,
    useSession: () => sessionState,
    signIn: vi.fn(async () => ({ ok: true })),
    signOut: vi.fn(async () => ({ ok: true })),
    // Test-only helper to adjust session state
    __setSession: (next: typeof sessionState) => {
      sessionState = next
    },
  }
})

// Prevent real Firebase initialization during tests
// Mock the services module that many parts of the app import
vi.mock('@/lib/services/firebase', () => ({
  app: null,
  auth: { currentUser: null },
  db: null,
  storage: null,
  adminStorage: null,
  isFirebaseConfigured: false,
  googleProvider: null,
  GoogleAuthProvider: class {},
  getIdToken: async () => null,
}))

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
})

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}))