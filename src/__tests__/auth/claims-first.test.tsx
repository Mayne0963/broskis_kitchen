import React from 'react'
import { render, screen } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import { ClientAuthGuard } from '@/components/auth/ClientAuthGuard'

// Mock router to avoid navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
}))

// Controlled AuthContext mock
const mockRefresh = vi.fn(async () => {})
let mockAuthState: any = {
  user: { id: 'user1', email: 'test@example.com', role: 'customer', emailVerified: true },
  claims: {},
  isLoading: false,
  isAuthenticated: true,
  refreshUserToken: mockRefresh,
}

vi.mock('@/lib/context/AuthContext', () => ({
  useAuth: () => mockAuthState,
}))

describe('ClientAuthGuard - claims-first authorization', () => {
  beforeEach(() => {
    mockRefresh.mockClear()
    mockAuthState = {
      user: { id: 'user1', email: 'test@example.com', role: 'customer', emailVerified: true },
      claims: {},
      isLoading: false,
      isAuthenticated: true,
      refreshUserToken: mockRefresh,
    }
  })

  it('refreshes once when allowedRoles set and claims missing', async () => {
    render(
      <ClientAuthGuard allowedRoles={["admin"]} fallback={<div data-testid="fallback" />}> 
        <div data-testid="content">ok</div>
      </ClientAuthGuard>
    )
    expect(mockRefresh).toHaveBeenCalled()
    expect(screen.getByTestId('fallback')).toBeInTheDocument()
  })

  it('allows access when claims.admin=true despite user.role=customer', async () => {
    mockAuthState.claims = { admin: true }
    render(
      <ClientAuthGuard allowedRoles={["admin"]} fallback={<div data-testid="fallback" />}> 
        <div data-testid="content">admin</div>
      </ClientAuthGuard>
    )
    expect(screen.getByTestId('content')).toBeInTheDocument()
  })

  it('allows access when claims.role=admin', async () => {
    mockAuthState.claims = { role: 'admin' }
    render(
      <ClientAuthGuard allowedRoles={["admin"]} fallback={<div data-testid="fallback" />}> 
        <div data-testid="content">admin</div>
      </ClientAuthGuard>
    )
    expect(screen.getByTestId('content')).toBeInTheDocument()
  })

  it('denies access when claims/user not admin', async () => {
    render(
      <ClientAuthGuard allowedRoles={["admin"]} fallback={<div data-testid="fallback" />}> 
        <div data-testid="content">admin</div>
      </ClientAuthGuard>
    )
    expect(screen.getByTestId('fallback')).toBeInTheDocument()
  })

  it('handles real-world mismatch: Firestore admin but no claims', async () => {
    // Simulate legacy Firestore role elevation without custom claims
    mockAuthState.user.role = 'admin'
    mockAuthState.claims = { admin: false, role: 'customer' }
    render(
      <ClientAuthGuard allowedRoles={["admin"]} fallback={<div data-testid="fallback" />}> 
        <div data-testid="content">admin</div>
      </ClientAuthGuard>
    )
    // Claims-first denies access
    expect(screen.getByTestId('fallback')).toBeInTheDocument()
  })
})