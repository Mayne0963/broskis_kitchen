import { describe, it, expect, vi } from 'vitest'
import { getUserTotals } from '@/lib/server/orderTotals'
import * as MyOrdersRoute from '@/app/api/my-orders/route'
vi.mock('server-only', () => ({}))

vi.mock('@/lib/firebase/admin', () => {
  const orders = [
    { id: 'o1', userId: 'U1', totalCents: 2600, createdAt: { toDate: () => new Date('2025-01-01') } },
    { id: 'o2', userId: 'U1', totalCents: 1500, createdAt: { toDate: () => new Date('2025-01-02') } },
  ]
  return {
    adminDb: {
      collection: vi.fn().mockImplementation((name: string) => ({
        where: vi.fn().mockImplementation((field: string, op: string, val: string) => ({
          orderBy: vi.fn().mockImplementation(() => ({
            limit: vi.fn().mockImplementation(() => ({
              get: vi.fn().mockResolvedValue({
                docs: orders.map((o) => ({ id: o.id, data: () => o })),
                forEach: (cb: any) => orders.forEach((o) => cb({ data: () => o })),
              })
            }))
          })),
          get: vi.fn().mockResolvedValue({
            docs: orders.map((o) => ({ id: o.id, data: () => o })),
            forEach: (cb: any) => orders.forEach((o) => cb({ data: () => o })),
          })
        }))
      }))
    },
  }
})

vi.mock('@/lib/authServer', () => ({
  getServerUser: vi.fn().mockResolvedValue({ uid: 'U1', email: 'u@example.com' })
}))

describe('Orders parity between dashboard and order history', () => {
  it('dashboard count equals API orders length', async () => {
    const totals = await getUserTotals('U1')
    const req = new (require('next/server').NextRequest)('http://localhost/api/my-orders')
    const res = await (MyOrdersRoute as any).GET(req)
    const json = await (res as any).json()
    const list = Array.isArray(json?.orders) ? json.orders : []
    expect(totals.ordersCount).toBe(list.length)
  })
})