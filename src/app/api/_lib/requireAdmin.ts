import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';

export async function requireAdmin() {
  const s = await getServerSession(authOptions);
  if (!s || !(s.user as any)?.isAdmin) return new Response('Forbidden', { status: 403 });
  return s;
}