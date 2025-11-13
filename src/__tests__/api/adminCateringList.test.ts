import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

vi.mock('@/lib/firebase/admin', () => ({
  ensureAdmin: vi.fn(),
}))

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: () => ({
    collection: () => ({
      orderBy: () => ({
        limit: () => ({
          get: async () => ({ docs: [] }),
        }),
      }),
    }),
  }),
}))

vi.mock('@/lib/catering/transform', () => ({
  mapDoc: vi.fn((id: string, data: any) => ({ id, ...data })),
}))

import { GET } from '@/app/api/admin/catering/route'
import { ensureAdmin } from '@/lib/firebase/admin'

vi.mock('@/lib/auth/options', () => ({
  authOptions: {},
}))

process.env.NEXTAUTH_URL = 'http://localhost'

describe('Admin Catering List Route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('returns 403 when not admin', async () => {
    ;(ensureAdmin as any).mockRejectedValue(new Response('Forbidden', { status: 403 }))
    const req = new NextRequest(new URL('http://localhost/api/admin/catering'))
    const res = await GET(req)
    expect(res.status).toBe(403)
  })

  it('returns items when admin', async () => {
    ;(ensureAdmin as any).mockResolvedValue({ uid: 'admin', admin: true })
    const req = new NextRequest(new URL('http://localhost/api/admin/catering'))
    const res = await GET(req)
    expect(res.status).toBe(200)
    const data = await res.json()
    expect(Array.isArray(data.items)).toBe(true)
  })
})
