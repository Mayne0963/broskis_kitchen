import { getSessionCookie } from '@/lib/auth/session';
import { verifyAdminAccess } from '@/lib/auth/rbac';

export async function requireAdmin() {
  try {
    const user = await getSessionCookie();
    if (!user) {
      return new Response('Unauthorized', { status: 401 });
    }
    
    const isAdmin = await verifyAdminAccess(user.uid);
    if (!isAdmin) {
      return new Response('Forbidden', { status: 403 });
    }
    
    return null; // Success - no response means continue
  } catch (error) {
    console.error('Admin verification error:', error);
    return new Response('Internal Server Error', { status: 500 });
  }
}