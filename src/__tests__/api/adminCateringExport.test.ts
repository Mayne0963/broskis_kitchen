import { describe, it, expect, vi, beforeEach } from 'vitest'
import { NextRequest } from 'next/server'

// Mock ensureAdmin behavior and Firestore
vi.mock('@/lib/firebase/admin', () => ({
  ensureAdmin: vi.fn(),
}))

vi.mock('next-auth', () => ({
  getServerSession: vi.fn(async () => ({ user: { role: 'user' } })),
}))

vi.mock('@/app/api/auth/[...nextauth]/route', () => ({
  authOptions: {},
}))

vi.mock('firebase-admin/firestore', () => ({
  getFirestore: () => ({
    collection: () => ({
      orderBy: () => ({
        get: async () => ({ docs: [] }),
      }),
    }),
  }),
}))

vi.mock('@/lib/catering/transform', () => ({
  mapDoc: vi.fn((id: string, data: any) => ({ id, ...data })),
}))

// Minimal env for auth options
process.env.NEXTAUTH_URL = 'http://localhost'

import { GET } from '@/app/api/admin/catering/export/route'
import { ensureAdmin } from '@/lib/firebase/admin'
import { getServerSession } from 'next-auth'

describe('Admin Catering Export Route', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('returns 403 when not admin (ensureAdmin fails and session role is not admin)', async () => {
    ;(ensureAdmin as any).mockRejectedValue(new Response('Forbidden', { status: 403 }))
    ;(getServerSession as any).mockResolvedValue({ user: { role: 'user' } })

    const req = new NextRequest(new URL('http://localhost/api/admin/catering/export'))
    const res = await GET(req)
    expect(res.status).toBe(403)
  })

  it('returns 200 when admin (ensureAdmin succeeds)', async () => {
    ;(ensureAdmin as any).mockResolvedValue({ uid: 'admin', admin: true })

    const req = new NextRequest(new URL('http://localhost/api/admin/catering/export'))
    const res = await GET(req)
    expect(res.status).toBe(200)
    const text = await res.text()
    expect(text.split('\n')[0]).toContain('id')
  })
})
