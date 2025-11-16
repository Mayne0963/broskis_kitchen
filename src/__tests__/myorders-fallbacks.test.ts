import { describe, it, expect, vi } from 'vitest'
import { NextRequest } from 'next/server'
import * as MyOrdersRoute from '@/app/api/my-orders/route'

vi.mock('@/lib/authServer', () => ({
  getServerUser: vi.fn().mockResolvedValue({ uid: 'U1', email: 'u@example.com' })
}))

describe('my-orders fallbacks', () => {
  it('falls back to email when uid query returns empty', async () => {
    const q = {
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      startAfter: vi.fn().mockReturnThis(),
      get: vi.fn().mockResolvedValueOnce({ docs: [] })
    }
    const byEmail = {
      docs: [
        { id: 'oE', data: () => ({ userEmail: 'u@example.com', userId: null, createdAt: { toDate: () => new Date('2025-01-01') } }) }
      ]
    }
    vi.mock('@/lib/firebase/admin', () => ({
      adminDb: {
        collection: vi.fn().mockReturnValue(q)
      }
    }))
    ;(q.get as any).mockResolvedValueOnce({ docs: [] })
    const adminDb = (await import('@/lib/firebase/admin')).adminDb as any
    adminDb.collection = vi.fn().mockReturnValue({
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      startAfter: vi.fn().mockReturnThis(),
      get: vi.fn().mockResolvedValueOnce(byEmail)
    })

    const req = new NextRequest('http://localhost/api/my-orders')
    const res = await (MyOrdersRoute as any).GET(req)
    const json = await (res as any).json()
    expect(Array.isArray(json.orders)).toBe(true)
    expect(json.orders.length).toBe(1)
    expect(json.pathUsed).toBe('orders_by_email')
  })

  it('falls back to collection group when both top-level paths return empty', async () => {
    const emptyGet = { docs: [] }
    const cgDocs = {
      docs: [
        { id: 'oCG', data: () => ({ userId: 'U1', createdAt: { toDate: () => new Date('2025-01-02') } }) }
      ]
    }
    const q = {
      where: vi.fn().mockReturnThis(),
      orderBy: vi.fn().mockReturnThis(),
      limit: vi.fn().mockReturnThis(),
      startAfter: vi.fn().mockReturnThis(),
      get: vi.fn().mockResolvedValue(emptyGet)
    }
    vi.mock('@/lib/firebase/admin', () => ({
      adminDb: {
        collection: vi.fn().mockReturnValue(q),
        collectionGroup: vi.fn().mockReturnValue({ ...q, get: vi.fn().mockResolvedValueOnce(cgDocs) })
      }
    }))

    const req = new NextRequest('http://localhost/api/my-orders')
    const res = await (MyOrdersRoute as any).GET(req)
    const json = await (res as any).json()
    expect(json.orders.length).toBe(1)
    expect(json.pathUsed).toBe('collection_group')
  })
})