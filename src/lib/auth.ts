import { NextRequest } from 'next/server';
import { auth } from '@/lib/firebaseAdmin';
import { cookies } from 'next/headers';

export interface AuthUser {
  uid: string;
  email?: string;
  emailVerified: boolean;
  customClaims?: Record<string, any>;
}

export async function requireAuth(req: NextRequest): Promise<AuthUser> {
  try {
    let token: string | undefined;
    
    // First try to get token from session cookie
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('__session');
    
    if (sessionCookie) {
      // Verify session cookie
      try {
        const decodedToken = await auth.verifySessionCookie(sessionCookie.value);
        return {
          uid: decodedToken.uid,
          email: decodedToken.email,
          emailVerified: decodedToken.email_verified || false,
          customClaims: decodedToken
        };
      } catch (cookieError) {
        console.log('Session cookie verification failed, trying Bearer token');
      }
    }
    
    // Fallback to Authorization header
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7); // Remove 'Bearer ' prefix
      
      // Verify the token using Firebase Admin
      const decodedToken = await auth.verifyIdToken(token);
      
      return {
        uid: decodedToken.uid,
        email: decodedToken.email,
        emailVerified: decodedToken.email_verified || false,
        customClaims: decodedToken
      };
    }
    
    throw new Error('No valid authentication found');
  } catch (error) {
    console.error('Error verifying auth token:', error);
    throw new Error('Authentication failed');
  }
}

export async function verifyUser(req: NextRequest): Promise<AuthUser | null> {
  try {
    return await requireAuth(req);
  } catch (error) {
    return null;
  }
}

export async function verifyAdminToken(req: NextRequest): Promise<AuthUser | null> {
  try {
    const user = await requireAuth(req);
    
    // Check if user has admin claims
    const isAdmin = user.customClaims?.admin === true || 
                   user.customClaims?.role === 'admin';
    
    if (!isAdmin) {
      return null;
    }

    return user;
  } catch (error) {
    console.error('Error verifying admin token:', error);
    return null;
  }
}

export function isAdmin(customClaims?: Record<string, any>): boolean {
  return customClaims?.admin === true || customClaims?.role === 'admin';
}