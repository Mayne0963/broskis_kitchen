export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const { sessionCookie } = await request.json();

    if (!sessionCookie) {
      return NextResponse.json({ valid: false, error: 'No session cookie provided' });
    }

    if (!adminAuth) {
      return NextResponse.json({ valid: false, error: 'Firebase Admin not initialized' });
    }

    // Verify the session cookie
    const decodedClaims = await adminAuth.verifySessionCookie(sessionCookie, true);
    
    return NextResponse.json({ 
      valid: true, 
      uid: decodedClaims.uid,
      email: decodedClaims.email 
    });
  } catch (error) {
    console.error('Session verification error:', error);
    return NextResponse.json({ 
      valid: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
}