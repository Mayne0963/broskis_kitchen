import { describe, it, expect, vi } from 'vitest'
import { NextResponse } from 'next/server'
import * as MyOrdersRoute from '@/app/api/my-orders/route'

vi.mock('@/lib/firebase/admin', () => ({
  adminDb: {
    collection: vi.fn().mockImplementation(() => ({
      where: vi.fn().mockImplementation(() => ({
        orderBy: vi.fn().mockImplementation(() => ({
          limit: vi.fn().mockImplementation(() => ({
            get: vi.fn().mockRejectedValue({ code: 'FAILED_PRECONDITION', message: 'requires an index' })
          }))
        }))
      }))
    }))
  },
}))

vi.mock('@/lib/authServer', () => ({
  getServerUser: vi.fn().mockResolvedValue({ uid: 'U1', email: 'u@example.com' })
}))

describe('my-orders API handles index errors gracefully', () => {
  it('returns helpful error when index is missing', async () => {
    const req = new (require('next/server').NextRequest)('http://localhost/api/my-orders')
    const res = await (MyOrdersRoute as any).GET(req)
    const json = await (res as any).json()
    expect((res as any).status).toBe(500)
    expect(String(json?.details || '')).toContain('index')
  })
})