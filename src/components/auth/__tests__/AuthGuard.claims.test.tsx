import React from 'react'
import { render, screen, act } from '@testing-library/react'
import { vi } from 'vitest'
import AuthGuard from '@/components/auth/AuthGuard'

// Mock next/navigation hooks to avoid navigation side effects
const pushMock = vi.fn()
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock, replace: vi.fn() }),
  usePathname: () => '/protected',
  useSearchParams: () => new URLSearchParams(''),
}))

// Controlled mock for useAuth
const mockRefresh = vi.fn(async () => {})
let mockAuthState: any = {
  user: { id: 'u1', email: 'e@x.com', role: 'customer', emailVerified: true },
  claims: {},
  isLoading: false,
  isAuthenticated: true,
  claimsLoaded: false,
  isAdmin: false,
  refreshUserToken: mockRefresh,
}

vi.mock('@/lib/context/AuthContext', () => ({
  useAuth: () => mockAuthState,
}))

describe('AuthGuard - claims loading and admin role', () => {
  afterEach(() => {
    mockRefresh.mockClear()
  })

  it('requests token refresh when claims are not loaded', async () => {
    render(
      <AuthGuard allowedRoles={["admin"]}>
        <div data-testid="protected">protected</div>
      </AuthGuard>
    )

    // While claims are not loaded, guard should attempt to refresh
    expect(mockRefresh).toHaveBeenCalled()

    // Protected content should not render until claims resolve
    expect(screen.queryByTestId('protected')).toBeNull()
  })

  it('renders children when claimsLoaded and user is admin', async () => {
    mockAuthState = {
      ...mockAuthState,
      claimsLoaded: true,
      isAdmin: true,
    }

    render(
      <AuthGuard allowedRoles={["admin"]}>
        <div data-testid="protected">protected</div>
      </AuthGuard>
    )

    // Content should be visible for admins
    expect(screen.getByTestId('protected')).toBeInTheDocument()
  })

  it('blocks access when claimsLoaded but user is not admin', async () => {
    mockAuthState = {
      ...mockAuthState,
      claimsLoaded: true,
      isAdmin: false,
    }

    render(
      <AuthGuard allowedRoles={["admin"]}>
        <div data-testid="protected">protected</div>
      </AuthGuard>
    )

    // Protected content should not render for non-admins
    expect(screen.queryByTestId('protected')).toBeNull()
    // Should trigger redirect to unauthorized page
    expect(pushMock).toHaveBeenCalledWith(expect.stringContaining('/unauthorized'))
  })
})