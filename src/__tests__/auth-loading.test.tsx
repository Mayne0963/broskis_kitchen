import { render, screen, waitFor, act, fireEvent, renderHook } from '@testing-library/react'
import { AuthLoadingProvider, useAuthLoading } from '@/lib/context/AuthLoadingContext'
import { PageLoadingWrapper, AuthLoadingGate } from '@/components/auth/PageLoadingWrapper'
import { useAuthCache } from '@/lib/hooks/useAuthCache'
import { useAuthPerformance } from '@/lib/hooks/useAuthCache'
import React from 'react'
import { vi } from 'vitest'
import * as AuthLoadingContextModule from '@/lib/context/AuthLoadingContext'

// Mock the auth hooks
jest.mock('@/lib/context/AuthContext', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    isAuthenticated: false
  })
}))

let sessionError: Error | null = null
let sessionMock: { data: any; status: 'loading' | 'authenticated' | 'unauthenticated' } = {
  data: null,
  status: 'unauthenticated',
}

vi.mock('next-auth/react', () => ({
  useSession: () => {
    if (sessionError) throw sessionError
    return sessionMock
  },
}))

// Ensure isolated state between tests
afterEach(() => {
  sessionError = null
  sessionMock = { data: null, status: 'unauthenticated' }
  const { result } = renderHook(() => useAuthCache())
  act(() => {
    result.current.clearAuthCache()
  })
  // Ensure timers are reset
  jest.useRealTimers()
})

describe('AuthLoadingContext', () => {
  const TestComponent = () => {
    const { isAuthReady, isVerifying, hasError, error, authCheckComplete } = useAuthLoading()
    return (
      <div>
        <div data-testid="auth-ready">{isAuthReady ? 'ready' : 'not-ready'}</div>
        <div data-testid="verifying">{isVerifying ? 'verifying' : 'not-verifying'}</div>
        <div data-testid="has-error">{hasError ? 'error' : 'no-error'}</div>
        <div data-testid="error">{error || 'no-error'}</div>
        <div data-testid="complete">{authCheckComplete ? 'complete' : 'incomplete'}</div>
      </div>
    )
  }

  it('should provide initial loading state', () => {
    sessionError = null
    sessionMock = { data: null, status: 'loading' }
    render(
      <AuthLoadingProvider>
        <TestComponent />
      </AuthLoadingProvider>
    )

    expect(screen.getByTestId('auth-ready')).toHaveTextContent('not-ready')
    expect(screen.getByTestId('verifying')).toHaveTextContent('verifying')
    expect(screen.getByTestId('has-error')).toHaveTextContent('no-error')
    expect(screen.getByTestId('complete')).toHaveTextContent('incomplete')
  })

  it('should transition to ready state when auth is verified', async () => {
    sessionError = null
    sessionMock = {
      data: { user: { email: 'test@example.com' } },
      status: 'authenticated',
    }

    render(
      <AuthLoadingProvider>
        <TestComponent />
      </AuthLoadingProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('auth-ready')).toHaveTextContent('ready')
      expect(screen.getByTestId('verifying')).toHaveTextContent('not-verifying')
      expect(screen.getByTestId('complete')).toHaveTextContent('complete')
    }, { timeout: 3000 })
  })

  it('should handle error states', async () => {
    // Simulate persistent loading to trigger timeout error path
    sessionError = null
    sessionMock = { data: null, status: 'loading' }
    jest.useFakeTimers()

    render(
      <AuthLoadingProvider>
        <TestComponent />
      </AuthLoadingProvider>
    )

    // Advance timers enough to pass the hard timeout
    act(() => {
      jest.advanceTimersByTime(8100)
    })

    await waitFor(() => {
      expect(screen.getByTestId('has-error')).toHaveTextContent('error')
      expect(screen.getByTestId('error')).not.toHaveTextContent('no-error')
    })
    jest.useRealTimers()
  })
})

describe('PageLoadingWrapper', () => {
  const TestContent = () => <div data-testid="content">Page Content</div>
  
  it('should show loading state initially', () => {
    render(
      <AuthLoadingProvider>
        <PageLoadingWrapper>
          <TestContent />
        </PageLoadingWrapper>
      </AuthLoadingProvider>
    )

    expect(screen.queryByTestId('content')).not.toBeInTheDocument()
    expect(screen.getByText('Loading Broski\'s Kitchen')).toBeInTheDocument()
  })

  it('should render content when auth is ready', async () => {
    sessionError = null
    sessionMock = {
      data: { user: { email: 'test@example.com' } },
      status: 'authenticated'
    }

    render(
      <AuthLoadingProvider>
        <PageLoadingWrapper minLoadingTime={0}>
          <TestContent />
        </PageLoadingWrapper>
      </AuthLoadingProvider>
    )

    await waitFor(() => {
      expect(screen.getByTestId('content')).toBeInTheDocument()
    })
  })

  it('should show custom fallback when provided', () => {
    const CustomFallback = () => <div data-testid="custom-fallback">Custom Loading...</div>
    
    render(
      <AuthLoadingProvider>
        <PageLoadingWrapper fallback={<CustomFallback />}>
          <TestContent />
        </PageLoadingWrapper>
      </AuthLoadingProvider>
    )

    expect(screen.getByTestId('custom-fallback')).toBeInTheDocument()
    expect(screen.queryByTestId('content')).not.toBeInTheDocument()
  })

  it('should handle error states with retry functionality', async () => {
    // Simulate persistent loading and use timers to trigger timeout
    sessionError = null
    sessionMock = { data: null, status: 'loading' }
    jest.useFakeTimers()

    render(
      <AuthLoadingProvider>
        <PageLoadingWrapper>
          <TestContent />
        </PageLoadingWrapper>
      </AuthLoadingProvider>
    )

    // Advance timers to pass hard timeout
    act(() => {
      jest.advanceTimersByTime(8100)
    })

    await waitFor(() => {
      expect(screen.getByText('Authentication Error')).toBeInTheDocument()
    })

    const retryButton = screen.getByText('Retry')
    // Clicking should not throw; actual retry is handled by provider
    act(() => {
      fireEvent.click(retryButton)
    })
    jest.useRealTimers()
  })
})

describe('AuthLoadingGate', () => {
  it('should render when auth becomes ready', async () => {
    // Start authenticated to speed up readiness
    sessionError = null
    sessionMock = {
      data: { user: { email: 'ready@example.com', id: 'uid-1' } },
      status: 'authenticated'
    }

    render(
      <AuthLoadingProvider>
        <AuthLoadingGate>
          <div>Content</div>
        </AuthLoadingGate>
      </AuthLoadingProvider>
    )

    await waitFor(() => {
      expect(screen.getByText('Content')).toBeInTheDocument()
    })
  })

  it('should show minimal loading when auth is not ready', () => {
    sessionError = null
    sessionMock = { data: null, status: 'loading' }

    const { container } = render(
      <AuthLoadingProvider>
        <AuthLoadingGate>
          <div>Content</div>
        </AuthLoadingGate>
      </AuthLoadingProvider>
    )

    expect(container.querySelector('.animate-spin')).toBeInTheDocument()
  })
})

describe('useAuthCache', () => {
  it('should cache and retrieve auth state', () => {
    const { result } = renderHook(() => useAuthCache())
    
    act(() => {
      result.current.setCachedAuth(true, { uid: 'test-uid', email: 'test@example.com' })
    })
    
    const cached = result.current.getCachedAuth()
    expect(cached).toBeTruthy()
    expect(cached?.authenticated).toBe(true)
    expect(cached?.user?.email).toBe('test@example.com')
  })

  it('should validate cache expiration', () => {
    const { result } = renderHook(() => useAuthCache())
    jest.useFakeTimers()
    
    act(() => {
      result.current.setCachedAuth(true, { uid: 'test-uid' })
    })
    
    expect(result.current.isCacheValid()).toBe(true)
    
    // Simulate time passing
    jest.advanceTimersByTime(2 * 60 * 1000) // 2 minutes
    
    expect(result.current.isCacheValid()).toBe(false)
  })

  it('should clear cache', () => {
    const { result } = renderHook(() => useAuthCache())
    
    act(() => {
      result.current.setCachedAuth(true, { uid: 'test-uid' })
      result.current.clearAuthCache()
    })
    
    expect(result.current.getCachedAuth()).toBeNull()
  })
})

describe('useAuthPerformance', () => {
  it('should track performance metrics', () => {
    const { result } = renderHook(() => useAuthPerformance())
    act(() => {
      result.current.resetMetrics()
    })
    
    act(() => {
      result.current.recordCacheHit()
      result.current.recordCacheMiss()
      result.current.recordVerification(100)
      result.current.recordVerification(200)
    })
    
    const metrics = result.current.getMetrics()
    expect(metrics.cacheHits).toBe(1)
    expect(metrics.cacheMisses).toBe(1)
    expect(metrics.totalVerifications).toBe(2)
    expect(metrics.averageVerificationTime).toBe(150)
  })

  it('should reset metrics', () => {
    const { result } = renderHook(() => useAuthPerformance())
    
    act(() => {
      result.current.recordCacheHit()
      result.current.recordVerification(100)
      result.current.resetMetrics()
    })
    
    const metrics = result.current.getMetrics()
    expect(metrics.cacheHits).toBe(0)
    expect(metrics.totalVerifications).toBe(0)
  })
})

describe('Integration Tests', () => {
  it('should handle complete auth flow with caching', async () => {
    sessionError = null
    sessionMock = { data: null, status: 'loading' }

    const { result: cacheResult } = renderHook(() => useAuthCache())
    const { result: authResult, rerender } = renderHook(() => useAuthLoading(), {
      wrapper: AuthLoadingProvider
    })

    // Initial state
    expect(authResult.current.isAuthReady).toBe(false)
    expect(authResult.current.isVerifying).toBe(true)

    // Simulate successful auth
    act(() => {
      sessionMock = {
        data: { user: { email: 'test@example.com', id: 'test-id' } },
        status: 'authenticated',
      }
      rerender()
    })

    await waitFor(() => {
      expect(authResult.current.isAuthReady).toBe(true)
      expect(authResult.current.isVerifying).toBe(false)
    })

    // Check that result was cached
    const cached = cacheResult.current.getCachedAuth('test-id')
    expect(cached?.authenticated).toBe(true)
  })

  it('should handle auth errors gracefully', async () => {
    // Simulate persistent loading so verifyAuth times out and sets error
    sessionError = null
    sessionMock = { data: null, status: 'loading' }
    jest.useFakeTimers()

    const { result } = renderHook(() => useAuthLoading(), {
      wrapper: AuthLoadingProvider
    })

    // Advance timers to force timeout path in verifyAuth() using hard timeout
    act(() => {
      jest.advanceTimersByTime(8100)
    })

    await waitFor(() => {
      expect(result.current.hasError).toBe(true)
      expect((result.current.error || '').toLowerCase()).toContain('timeout')
      expect(result.current.authCheckComplete).toBe(true)
    })
    jest.useRealTimers()
  })
})