// /src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { auth as adminAuth } from 'firebase-admin';

// Read Firebase ID token from cookie "session"
async function decodeSessionCookie(req: NextRequest) {
  const token = req.cookies.get('session')?.value;
  if (!token) return null;
  try {
    const decoded = await adminAuth().verifyIdToken(token, true);
    return decoded as { uid: string; email?: string; roles?: string[] };
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname, searchParams } = req.nextUrl;

  // Public paths (NEVER gate with auth)
  const PUBLIC = [
    '/', '/login', '/signup', '/menu', '/contact', '/shop', '/events', '/catering', '/api/health'
  ];
  if (PUBLIC.includes(pathname)) return NextResponse.next();

  // Paths that require a signed-in user (but NOT admin):
  const USER_ONLY = [
    '/rewards', '/dashboard', '/profile'
  ];
  // Prefix matches (e.g., /rewards/*)
  const isUserOnly =
    USER_ONLY.some(p => pathname === p || pathname.startsWith(p + '/'));

  // Paths that require ADMIN:
  const isAdminPath =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api/rewards/admin');

  const user = await decodeSessionCookie(req);

  // Handle ADMIN area
  if (isAdminPath) {
    if (!user) {
      const url = req.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }
    const roles = user.roles ?? [];
    if (!roles.includes('admin')) {
      const url = req.nextUrl.clone();
      url.pathname = '/403';
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Handle USER-ONLY area (rewards/dashboard/profile)
  if (isUserOnly) {
    if (!user) {
      const url = req.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('next', pathname + (searchParams.size ? `?${searchParams.toString()}` : ''));
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Everything else: allow
  return NextResponse.next();
}

// Only run on pages we care about
export const config = {
  matcher: [
    '/((?!_next|static|favicon.ico|images|assets).*)'
  ]
};