import React from 'react'
import { render, screen, act } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { ClientAuthGuard } from '@/components/auth/ClientAuthGuard'

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }))

const mockRefresh = vi.fn(async () => {})
let mockAuth: any = {
  user: { id: 'u1', email: 'e@x.com', role: 'customer', emailVerified: true },
  claims: {},
  isLoading: false,
  isAuthenticated: true,
  refreshUserToken: mockRefresh,
}

vi.mock('@/lib/context/AuthContext', () => ({ useAuth: () => mockAuth }))

describe('ClientAuthGuard - claims loading and refresh', () => {
  beforeEach(() => { mockRefresh.mockClear() })

  it('calls refreshUserToken when allowedRoles provided', async () => {
    render(
      <ClientAuthGuard allowedRoles={["admin"]} fallback={<div data-testid="fb" />}> 
        <div data-testid="ok" />
      </ClientAuthGuard>
    )
    expect(mockRefresh).toHaveBeenCalled()
    expect(screen.getByTestId('fb')).toBeInTheDocument()
  })

  it('grants access after claims refresh sets admin', async () => {
    render(
      <ClientAuthGuard allowedRoles={["admin"]} fallback={<div data-testid="fb" />}> 
        <div data-testid="ok" />
      </ClientAuthGuard>
    )
    // Simulate refresh populating admin claim
    mockAuth.claims = { admin: true }
    // Re-render
    render(
      <ClientAuthGuard allowedRoles={["admin"]} fallback={<div data-testid="fb" />}> 
        <div data-testid="ok" />
      </ClientAuthGuard>
    )
    expect(screen.getByTestId('ok')).toBeInTheDocument()
  })
})