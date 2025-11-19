import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'
import * as MyOrdersRoute from '@/app/api/my-orders/route'

const createQueryStub = () => ({
  where: vi.fn().mockReturnThis(),
  orderBy: vi.fn().mockReturnThis(),
  limit: vi.fn().mockReturnThis(),
  startAfter: vi.fn().mockReturnThis(),
  get: vi.fn().mockResolvedValue({ docs: [] })
})

const queryState = {
  userQuery: createQueryStub(),
  emailQuery: createQueryStub(),
  collectionGroupQuery: createQueryStub(),
  userSubcollectionQuery: createQueryStub()
}

const resetQueryState = () => {
  queryState.userQuery = createQueryStub()
  queryState.emailQuery = createQueryStub()
  queryState.collectionGroupQuery = createQueryStub()
  queryState.userSubcollectionQuery = createQueryStub()
}

vi.mock('@/lib/authServer', () => ({
  getServerUser: vi.fn().mockResolvedValue({ uid: 'U1', email: 'u@example.com' })
}))

vi.mock('@/lib/firebase/admin', () => ({
  adminDb: {
    collection: vi.fn((name: string) => {
      if (name === 'orders') {
        return {
          where: vi.fn((field: string) => {
            if (field === 'userId') return queryState.userQuery
            if (field === 'userEmail') return queryState.emailQuery
            throw new Error(`Unexpected where field ${field}`)
          }),
          orderBy: vi.fn().mockReturnThis(),
          limit: vi.fn().mockReturnThis(),
          startAfter: vi.fn().mockReturnThis(),
          get: vi.fn()
        }
      }
      if (name === 'users') {
        return {
          doc: vi.fn(() => ({
            collection: vi.fn((colName: string) => {
              if (colName !== 'orders') throw new Error(`Unexpected subcollection ${colName}`)
              return queryState.userSubcollectionQuery
            })
          }))
        }
      }
      throw new Error(`Unexpected collection ${name}`)
    }),
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

  it('falls back to the user orders subcollection when top-level collections return empty', async () => {
    queryState.userQuery.get.mockResolvedValueOnce({ docs: [] })
    queryState.emailQuery.get.mockResolvedValueOnce({ docs: [] })
    const subDocs = {
      docs: [
        { id: 'oSUB', data: () => ({ createdAt: { toDate: () => new Date('2025-01-02') } }) }
      ]
    }
    queryState.userSubcollectionQuery.get.mockResolvedValueOnce(subDocs)

    const req = new NextRequest('http://localhost/api/my-orders')
    const res = await (MyOrdersRoute as any).GET(req)
    const json = await (res as any).json()
    expect(json.orders.length).toBe(1)
    expect(json.pathUsed).toBe('user_subcollection')
  })

  it('falls back to collection group when both top-level paths return empty', async () => {
    queryState.userQuery.get.mockResolvedValueOnce({ docs: [] })
    queryState.emailQuery.get.mockResolvedValueOnce({ docs: [] })
    queryState.userSubcollectionQuery.get.mockResolvedValueOnce({ docs: [] })
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
