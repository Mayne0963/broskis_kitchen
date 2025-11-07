import { cookies } from 'next/headers';
import { adminAuth } from '@/lib/firebase/admin';

export type AppUser = {
  uid: string;
  email?: string | null;
  name?: string | null;
  roles?: string[];
};

export async function getServerUser(): Promise<AppUser | null> {
  const c = await cookies();
  // Normalize to Firebase default session cookie name
  const sessionCookie = c.get('__session')?.value || c.get('session')?.value;
  if (!sessionCookie) return null;

  try {
    // Verify Firebase Session Cookie (not ID token)
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    return {
      uid: decoded.uid,
      email: decoded.email ?? null,
      name: (decoded as any).name ?? null,
      roles: (decoded as any).roles ?? []
    };
  } catch {
    return null;
  }
}