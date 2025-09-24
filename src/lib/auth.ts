import { NextApiRequest } from 'next';
import { getAuth } from 'firebase-admin/auth';
import { initializeFirebaseAdmin } from './firebase-admin';

export interface AuthUser {
  uid: string;
  email?: string;
  emailVerified: boolean;
  customClaims?: Record<string, any>;
}

export async function verifyAuthToken(req: NextApiRequest): Promise<AuthUser | null> {
  try {
    // Initialize Firebase Admin
    initializeFirebaseAdmin();
    
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify the token
    const auth = getAuth();
    const decodedToken = await auth.verifyIdToken(token);
    
    return {
      uid: decodedToken.uid,
      email: decodedToken.email,
      emailVerified: decodedToken.email_verified || false,
      customClaims: decodedToken
    };
  } catch (error) {
    console.error('Error verifying auth token:', error);
    return null;
  }
}

export async function verifyAdminToken(req: NextApiRequest): Promise<AuthUser | null> {
  try {
    const user = await verifyAuthToken(req);
    if (!user) {
      return null;
    }

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