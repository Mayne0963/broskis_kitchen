import { cookies } from 'next/headers';
import { auth as adminAuth } from 'firebase-admin';

export type AppUser = {
  uid: string;
  email?: string | null;
  name?: string | null;
  roles?: string[];
};

export async function getServerUser(): Promise<AppUser | null> {
  const c = cookies();
  const token = c.get('session')?.value; // Firebase ID token/JWT set at login
  if (!token) return null;
  
  try {
    const decoded = await adminAuth().verifyIdToken(token, true);
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