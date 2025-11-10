import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import React from 'react'
import { OrderProvider, useOrders } from '@/lib/context/OrderContext'

describe('OrderContext', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('loads orders from /api/my-orders and handles non-200 gracefully', async () => {
    const mockFetch = vi.spyOn(global, 'fetch').mockImplementation(async (input: any) => {
      if (typeof input === 'string' && input.includes('/api/my-orders')) {
        return new Response(JSON.stringify({ orders: [{ id: '1', status: 'completed'}] }), { status: 200 }) as any
      }
      return new Response(null, { status: 404 }) as any
    })

    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <OrderProvider autoLoad={true}>{children}</OrderProvider>
    )

    const { result } = renderHook(() => useOrders(), { wrapper })

    // Wait microtask
    await act(async () => {})

    expect(result.current.orders.length).toBe(1)

    mockFetch.mockResolvedValueOnce(new Response(null, { status: 500 }) as any)

    await act(async () => {
      await result.current.refresh()
    })

    // Should not throw; orders either previous or empty
    expect(Array.isArray(result.current.orders)).toBe(true)
  })
})