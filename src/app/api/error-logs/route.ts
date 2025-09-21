export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, ensureAdmin } from '@/lib/firebaseAdmin';

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
    const docRef = await adminDb.collection('error_logs').add(errorLog);
    
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
    await ensureAdmin(request);
    
    return NextResponse.json({
      success: true,
      message: 'Admin access verified'
    });
  } catch (error) {
    console.error('Error verifying token:', error);
    return NextResponse.json(
      { success: false, error: 'Invalid authentication token' },
      { status: 401 }
    );
  }
}