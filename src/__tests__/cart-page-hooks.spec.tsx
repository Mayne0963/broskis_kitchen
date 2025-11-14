import { describe, it, expect, vi } from 'vitest'
import React from 'react'
import { render, screen } from '@testing-library/react'

// Mock hooks and contexts used by the cart page
vi.mock('@/hooks/useOrderResumePrompt', () => ({
  useOrderResumePrompt: () => ({ shouldPrompt: false, summary: null, accept: vi.fn(), decline: vi.fn() })
}))

vi.mock('../../lib/context/CartContext', () => ({
  useCart: () => ({ items: [], removeItem: vi.fn(), updateQuantity: vi.fn(), clearCart: vi.fn() })
}))

vi.mock('../../lib/context/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: true })
}))

// Mock AuthGuard to render children directly
vi.mock('../../components/auth/AuthGuard', () => ({
  AuthGuard: ({ children }: any) => children
}))

import CartPage from '@/app/cart/page'

describe('CartPage hooks', () => {
  it('renders without invalid hook call', () => {
    render(React.createElement(CartPage))
    expect(screen.getByText('Your Cart')).toBeTruthy()
  })
})