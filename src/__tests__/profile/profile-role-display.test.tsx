import React from 'react'
import { render, screen } from '@testing-library/react'
import { vi, describe, it, expect } from 'vitest'

// Avoid initializing Firebase Admin in test environment
vi.mock('@/lib/firebase/admin', () => ({
  adminAuth: {
    verifySessionCookie: vi.fn(async () => ({ uid: 'u1', email: 'e@x.com' })),
    verifyIdToken: vi.fn(async () => ({ uid: 'u1', email: 'e@x.com' })),
  },
}))

// We test server-side page via withAuthGuard: stub to avoid admin SDK init
vi.mock('@/lib/auth/session', () => ({
  withAuthGuard: async (handler: any) => handler(mockUser),
}))

let mockUser: any = {
  uid: 'u1',
  email: 'e@x.com',
  emailVerified: true,
  role: 'customer',
  name: 'Test User',
}

// Import page after mocks
import ProfilePage from '@/app/profile/page'

describe('Profile page role display', () => {
  it('shows Admin badge when role is admin', async () => {
    mockUser.role = 'admin'
    const ui = await ProfilePage()
    render(ui as any)
    expect(screen.getByText(/Role:/i)).toBeInTheDocument()
    expect(screen.getByText(/admin/i)).toBeInTheDocument()
  })

  it('shows customer role when not admin', async () => {
    mockUser.role = 'customer'
    const ui = await ProfilePage()
    render(ui as any)
    expect(screen.getByText(/Role:/i)).toBeInTheDocument()
    expect(screen.getByText(/customer/i)).toBeInTheDocument()
  })
})