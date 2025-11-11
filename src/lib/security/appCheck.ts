import type { NextRequest } from 'next/server'
import { admin } from '@/lib/firebase/admin'

/**
 * Verify App Check token from request headers if present.
 * Returns true when:
 * - Token is present and valid
 * - Token is missing (optional enforcement)
 * - Verification not available (gracefully continues)
 * Returns false only when a token is present and fails verification.
 */
export async function verifyAppCheckHeader(req: NextRequest | { headers: Headers }): Promise<boolean> {
  try {
    const headers = (req as any).headers as Headers
    if (!headers || typeof headers.get !== 'function') return true

    const token = headers.get('X-Firebase-AppCheck') || headers.get('x-firebase-appcheck')
    if (!token) return true

    // Verify via Admin SDK when available
    try {
      await admin.appCheck().verifyToken(token)
      return true
    } catch (err) {
      // Invalid token
      return false
    }
  } catch {
    // Any unexpected failure should not block requests if token is optional
    return true
  }
}

/**
 * Enforce App Check when desired: throws Response 403 on invalid token.
 */
export async function requireValidAppCheck(req: NextRequest | { headers: Headers }): Promise<void> {
  const ok = await verifyAppCheckHeader(req)
  if (!ok) throw new Response('Invalid App Check token', { status: 403 })
}