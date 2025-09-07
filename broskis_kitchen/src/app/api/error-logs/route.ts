import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// POST - Log error to Firebase
// PUT - Verify authentication token
export async function POST(request: NextRequest) {
  try {
    const errorLog = await request.json();
    
    if (!errorLog.message || !errorLog.name) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: message, name' },
        { status: 400 }
      );
    }

    // Add timestamp if not provided
    if (!errorLog.timestamp) {
      errorLog.timestamp = new Date().toISOString();
    }

    // Log to Firebase
    const docRef = await db.collection('error_logs').add(errorLog);
    
    return NextResponse.json({
      success: true,
      id: docRef.id
    });
  } catch (error) {
    console.error('Error logging to Firebase:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to log error' },
      { status: 500 }
    );
  }
}

// PUT - Verify authentication token
export async function PUT(request: NextRequest) {
  try {
    const { token } = await request.json();
    
    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Missing token' },
        { status: 400 }
      );
    }

    const decodedToken = await auth.verifyIdToken(token);
    
    return NextResponse.json({
      success: true,
      user: {
        uid: decodedToken.uid,
        email: decodedToken.email,
        claims: {
          admin: decodedToken.admin,
          role: decodedToken.role,
          kitchen: decodedToken.kitchen
        }
      }
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    return NextResponse.json(
      { success: false, error: 'Invalid authentication token' },
      { status: 401 }
    );
  }
}