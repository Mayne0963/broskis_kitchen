export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { ensureAdmin, adminAuth } from '@/lib/firebaseAdmin';

export async function POST(req: Request) {
  try {
    const { uid, role } = await req.json();
    
    if (!uid) {
      return NextResponse.json(
        { error: 'Missing uid' },
        { status: 400 }
      );
    }
    
    ensureAdmin();
    await adminAuth.setCustomUserClaims(uid, { admin: true });
    
    return NextResponse.json(
      { message: 'Permissions Updated' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error setting custom claims:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to refresh permissions' },
      { status: 500 }
    );
  }
}

// Handle non-POST requests
export async function GET() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function PUT() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}

export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed' },
    { status: 405 }
  );
}