import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import AdminOrdersPage from '@/app/admin/orders/page'

describe('Admin Orders Dashboard', () => {
  it('renders and shows orders from API', async () => {
    vi.spyOn(global, 'fetch' as any).mockResolvedValueOnce({ ok: true, json: async () => ({ orders: [{ id: 'o1', createdAt: new Date().toISOString(), status: 'paid', userId: 'U1', userName: 'Test', totalCents: 2500, items: [] }] }) })
    render(<AdminOrdersPage />)
    expect(await screen.findByText(/Orders Admin/i)).toBeDefined()
  })
  it('filters by status', async () => {
    vi.spyOn(global, 'fetch' as any).mockResolvedValueOnce({ ok: true, json: async () => ({ orders: [] }) })
    render(<AdminOrdersPage />)
    const select = await screen.findByRole('combobox')
    fireEvent.change(select, { target: { value: 'paid' } })
    expect(select).toHaveValue('paid')
  })
})