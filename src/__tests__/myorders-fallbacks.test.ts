import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import * as MyOrdersRoute from '@/app/api/my-orders/route'

const createQueryStub = () => ({
  where: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  startAfter: vi.fn().mockReturnThis(),
  get: vi.fn()
})

const queryState = {
  userQuery: createQueryStub(),
  emailQuery: createQueryStub(),
  collectionGroupQuery: createQueryStub()
}

const resetQueryState = () => {
  queryState.userQuery = createQueryStub()
  queryState.emailQuery = createQueryStub()
  queryState.collectionGroupQuery = createQueryStub()
}

vi.mock('@/lib/authServer', () => ({
  getServerUser: vi.fn().mockResolvedValue({ uid: 'U1', email: 'u@example.com' })
}))

vi.mock('@/lib/firebase/admin', () => ({
  adminDb: {
    collection: vi.fn(() => ({
      where: vi.fn((field: string) => {
        if (field === 'userId') return queryState.userQuery
        if (field === 'userEmail') return queryState.emailQuery
        throw new Error(`Unexpected where field ${field}`)
      })
    })),
    collectionGroup: vi.fn(() => queryState.collectionGroupQuery)
  }
}))

describe('my-orders fallbacks', () => {
  beforeEach(() => {
    resetQueryState()
  })

  it('falls back to email when uid query returns empty', async () => {
    queryState.userQuery.get.mockResolvedValueOnce({ docs: [] })
    const byEmail = {
      docs: [
        { id: 'oE', data: () => ({ userEmail: 'u@example.com', userId: null, createdAt: { toDate: () => new Date('2025-01-01') } }) }
      ]
    }
    queryState.emailQuery.get.mockResolvedValueOnce(byEmail)

    const req = new NextRequest('http://localhost/api/my-orders')
    const res = await (MyOrdersRoute as any).GET(req)
    const json = await (res as any).json()

    expect(Array.isArray(json.orders)).toBe(true)
    expect(json.orders.length).toBe(1)
    expect(json.pathUsed).toBe('orders_by_email')
  })

  it('falls back to collection group when both top-level paths return empty', async () => {
    queryState.userQuery.get.mockResolvedValueOnce({ docs: [] })
    queryState.emailQuery.get.mockResolvedValueOnce({ docs: [] })
    const cgDocs = {
      docs: [
        { id: 'oCG', data: () => ({ userId: 'U1', createdAt: { toDate: () => new Date('2025-01-02') } }) }
      ]
    }
    queryState.collectionGroupQuery.get.mockResolvedValueOnce(cgDocs)

    const req = new NextRequest('http://localhost/api/my-orders')
    const res = await (MyOrdersRoute as any).GET(req)
    const json = await (res as any).json()
    expect(json.orders.length).toBe(1)
    expect(json.pathUsed).toBe('collection_group')
  })
})
