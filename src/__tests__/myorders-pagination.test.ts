import { describe, it, expect, vi } from 'vitest'
import { NextRequest } from 'next/server'
import * as MyOrdersRoute from '@/app/api/my-orders/route'

vi.mock('@/lib/authServer', () => ({
  getServerUser: vi.fn().mockResolvedValue({ uid: 'U1', email: 'u@example.com' })
}))

vi.mock('@/lib/firebase/admin', () => {
  let startAfterCalled = false
  const docs1 = [
    { id: 'o1', data: () => ({ userId: 'U1', createdAt: { toDate: () => new Date('2025-01-02') } }) },
    { id: 'o2', data: () => ({ userId: 'U1', createdAt: { toDate: () => new Date('2025-01-01') } }) },
  ]
  const docs2 = [
    { id: 'o3', data: () => ({ userId: 'U1', createdAt: { toDate: () => new Date('2024-12-31') } }) },
  ]
  const q = {
    where: vi.fn().mockReturnThis(),
    orderBy: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    startAfter: vi.fn().mockImplementation(() => { startAfterCalled = true; return q }),
    get: vi.fn().mockImplementation(async () => ({ docs: startAfterCalled ? docs2 : docs1 }))
  }
  return {
    adminDb: {
      collection: vi.fn().mockReturnValue(q)
    }
  }
})

describe('/api/my-orders pagination', () => {
  it('returns nextCursor on first page and new orders on next page', async () => {
    // First page
    const req1 = new NextRequest('http://localhost/api/my-orders?limit=2')
    const res1 = await MyOrdersRoute.GET(req1)
    const j1 = await (res1 as any).json()
    expect(j1.orders.length).toBe(2)
    expect(j1.nextCursor).toBe('2025-01-01T00:00:00.000Z')

    // Next page with cursor
    const req2 = new NextRequest(`http://localhost/api/my-orders?cursor=${encodeURIComponent(j1.nextCursor)}`)
    const res2 = await MyOrdersRoute.GET(req2)
    const j2 = await (res2 as any).json()
    expect(j2.orders.length).toBe(1)
    expect(j2.nextCursor).toBe('2024-12-31T00:00:00.000Z')
  })
})