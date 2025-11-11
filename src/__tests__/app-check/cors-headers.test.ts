import { describe, it, expect } from 'vitest'
import { GET as statusGET, OPTIONS as statusOPTIONS } from '@/app/api/auth/status/route'
import { POST as refreshPOST, OPTIONS as refreshOPTIONS } from '@/app/api/auth/refresh/route'

function makeRequest(origin: string) {
  const headers = new Headers({ origin })
  return { headers } as any
}

describe('CORS headers include App Check', () => {
  it('status OPTIONS includes x-firebase-appcheck', async () => {
    const res = await statusOPTIONS(makeRequest('http://localhost:3000'))
    expect(res.headers.get('Access-Control-Allow-Headers') || '').toMatch(/x-firebase-appcheck/i)
  })

  it('refresh OPTIONS includes x-firebase-appcheck', async () => {
    const res = await refreshOPTIONS(makeRequest('http://localhost:3000'))
    expect(res.headers.get('Access-Control-Allow-Headers') || '').toMatch(/x-firebase-appcheck/i)
  })
})