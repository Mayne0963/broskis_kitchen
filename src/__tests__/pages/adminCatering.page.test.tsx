import { describe, it, expect, vi } from 'vitest'

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(),
}))

vi.mock('@/lib/auth/options', () => ({
  authOptions: {},
}))

const redirectMock = vi.fn()
vi.mock('next/navigation', async (orig) => {
  const mod = await orig()
  return { ...mod, redirect: (...args: any[]) => redirectMock(...args) }
})

import Page from '@/app/admin/catering/page'
import { getServerSession } from 'next-auth'

describe('Admin Catering Page SSR guard', () => {
  it('redirects non-admin users to login with next param', async () => {
    ;(getServerSession as any).mockResolvedValue({ user: { role: 'user' } })
    await Page()
    expect(redirectMock).toHaveBeenCalledWith('/auth/login?error=admin_required&next=/admin/catering')
  })

  it('renders for admin users', async () => {
    ;(getServerSession as any).mockResolvedValue({ user: { role: 'admin' } })
    const tree = await Page()
    expect(tree).toBeTruthy()
  })
})

