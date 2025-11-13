import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'

vi.mock('next/navigation', async (orig) => {
  const mod = await orig()
  return {
    ...mod,
    useRouter: () => ({ push: vi.fn(), replace: vi.fn() }),
    useSearchParams: () => ({ get: (k: string) => (k === 'error' ? 'admin_required' : '/admin/catering') }),
  }
})

vi.mock('@/lib/context/AuthContext', () => ({
  useAuth: () => ({ login: vi.fn() }),
}))

import LoginPage from '@/app/auth/login/page'

describe('Login page admin_required feedback', () => {
  it('shows admin access required message when error query present', () => {
    render(<LoginPage />)
    expect(screen.getByText(/Admin access required/i)).toBeInTheDocument()
  })
})
