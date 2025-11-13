import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import CateringTable from '@/components/admin/CateringTable'

describe('CateringTable', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('shows error when API returns 403', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false, status: 403, text: async () => 'forbidden' })))
    render(<CateringTable status="" q="" /> as any)
    await waitFor(() => expect(screen.getByText(/Admin access required/i)).toBeInTheDocument())
  })

  it('renders rows when items returned', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      status: 200,
      json: async () => ({ items: [{ id: '1', customer: { name: 'A', email: 'a@x.com' }, event: { guests: 10 }, packageTier: 'standard', price: { total: 100, currency: 'USD' }, createdAt: Date.now(), status: 'new' }] }),
    })))
    render(<CateringTable status="" q="" /> as any)
    await waitFor(() => expect(screen.getAllByText('A').length).toBeGreaterThan(0))
    expect(screen.getByText(/\$100.00/)).toBeInTheDocument()
  })
})
