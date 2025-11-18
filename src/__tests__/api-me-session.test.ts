import { describe, it, expect, beforeEach, vi } from 'vitest'
import { NextRequest } from 'next/server'
import { GET } from '@/app/api/me/route'

const hoistedMocks = vi.hoisted(() => {
  return {
    sessionCookie: vi.fn(),
    serverUser: vi.fn(),
    serverSession: vi.fn(),
    verifyIdToken: vi.fn(),
    docGet: vi.fn()
  }
})

vi.mock('@/lib/auth/session', () => ({
  getSessionCookie: hoistedMocks.sessionCookie
}))

vi.mock('@/lib/authServer', () => ({
  getServerUser: hoistedMocks.serverUser
}))

vi.mock('next-auth', () => ({
  getServerSession: hoistedMocks.serverSession
}))

vi.mock('@/lib/auth/options', () => ({
  authOptions: {}
}))

vi.mock('@/lib/firebase/admin', () => {
  const doc = { get: hoistedMocks.docGet }
  return {
    adminDb: {
      collection: vi.fn(() => ({
        doc: vi.fn(() => doc)
      }))
    },
    adminAuth: {
      verifyIdToken: hoistedMocks.verifyIdToken
    }
  }
})

describe('/api/me session handling', () => {
  beforeEach(() => {
    hoistedMocks.sessionCookie.mockReset()
    hoistedMocks.serverUser.mockReset()
    hoistedMocks.serverSession.mockReset()
    hoistedMocks.verifyIdToken.mockReset()
    hoistedMocks.docGet.mockReset()
    hoistedMocks.docGet.mockResolvedValue({ exists: true, data: () => ({ displayName: 'Chef' }) })
  })

  it('returns Firebase session user without requiring NextAuth', async () => {
    hoistedMocks.sessionCookie.mockResolvedValue({
      uid: 'user_cookie',
      email: 'cookie@example.com',
      role: 'customer',
      sessionExpiry: Math.floor(Date.now() / 1000) + 600
    })
    hoistedMocks.serverUser.mockResolvedValue(null)
    hoistedMocks.serverSession.mockResolvedValue(null)

    const req = new NextRequest('http://localhost/api/me')
    const res = await GET(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.sessionValid).toBe(true)
    expect(json.sessionSource).toBe('firebase_cookie')
    expect(json.user.uid).toBe('user_cookie')
    expect(json.sessionExpiration).toBeGreaterThan(Date.now())
  })

  it('falls back to Authorization header when no session cookie exists', async () => {
    hoistedMocks.sessionCookie.mockResolvedValue(null)
    hoistedMocks.serverUser.mockResolvedValue(null)
    hoistedMocks.serverSession.mockResolvedValue(null)
    hoistedMocks.verifyIdToken.mockResolvedValue({
      uid: 'bearer_user',
      email: 'bearer@example.com',
      exp: Math.floor(Date.now() / 1000) + 300
    })

    const req = new NextRequest('http://localhost/api/me', {
      headers: { authorization: 'Bearer test.token' }
    })
    const res = await GET(req)
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json.sessionSource).toBe('bearer')
    expect(json.user.uid).toBe('bearer_user')
  })

  it('returns unauthorized when no auth mechanism succeeds', async () => {
    hoistedMocks.sessionCookie.mockResolvedValue(null)
    hoistedMocks.serverUser.mockResolvedValue(null)
    hoistedMocks.serverSession.mockResolvedValue(null)

    const req = new NextRequest('http://localhost/api/me')
    const res = await GET(req)
    const json = await res.json()

    expect(res.status).toBe(401)
    expect(json.error).toBe('unauthorized')
  })

  it('rejects expired Firebase sessions with a specific error', async () => {
    hoistedMocks.sessionCookie.mockResolvedValue({
      uid: 'stale_user',
      email: 'stale@example.com',
      role: 'customer',
      sessionExpiry: Math.floor(Date.now() / 1000) - 10
    })
    hoistedMocks.serverUser.mockResolvedValue(null)
    hoistedMocks.serverSession.mockResolvedValue(null)

    const req = new NextRequest('http://localhost/api/me')
    const res = await GET(req)
    const json = await res.json()

    expect(res.status).toBe(401)
    expect(json.error).toBe('session_expired')
  })
})
