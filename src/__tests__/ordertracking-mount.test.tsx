import { describe, it, expect } from 'vitest'
import { render } from '@testing-library/react'
import OrderTracking from '@/components/orders/OrderTracking'

describe('OrderTracking mount', () => {
  it('mounts without TDZ error', () => {
    render(<OrderTracking userId="U1" initialOrders={[]} />)
    expect(true).toBe(true)
  })
})