import { getServerUser } from '@/lib/session';
import { verifyAdminAccess } from '@/lib/auth/rbac';

export async function requireAdmin() {
  try {
    const user = await getServerUser();
    if (!user) {
      return new Response(JSON.stringify({ success: false, error: 'UNAUTHORIZED' }), { 
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    const isAdmin = await verifyAdminAccess(user.uid);
    if (!isAdmin) {
      return new Response(JSON.stringify({ success: false, error: 'FORBIDDEN' }), { 
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      });
    }
    
    return null; // Success - no response means continue
  } catch (error) {
    console.error('Admin verification error:', error);
    return new Response(JSON.stringify({ success: false, error: 'INTERNAL' }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}