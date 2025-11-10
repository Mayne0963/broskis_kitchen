import { describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import OrderTracking from '@/components/orders/OrderTracking'

// Mock safeFetch for OrderTracking
vi.mock('@/lib/utils/safeFetch', () => {
  return {
    safeFetch: vi.fn(async (url: string) => {
      if (url.includes('/api/my-orders')) {
        return new Response(JSON.stringify({ orders: [{ id: 'o1', status: 'completed' }] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      }
      return new Response(null, { status: 404 })
    })
  }
})

describe('OrderTracking', () => {
  it('renders initial orders and updates from API gracefully', async () => {
    render(<OrderTracking userId="u1" initialOrders={[]} />)
    await waitFor(() => {
      expect(screen.getByText(/completed/i)).toBeTruthy()
    })
  })
})