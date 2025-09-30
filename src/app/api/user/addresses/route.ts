export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/session';
import { adminDb } from '@/lib/firebase/admin';

// Helper to get user ID from session
const getUserId = async () => {
  const user = await getServerUser();
  if (!user) throw new Error('Unauthorized');
  return user.uid;
};

// GET: Fetch user's addresses
export async function GET() {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
    }
    
    const addressesRef = adminDb.collection(`users/${user.uid}/addresses`);
    const snapshot = await addressesRef.get();
    const addresses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    
    const headers = { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' };
    return new NextResponse(JSON.stringify(addresses), { status: 200, headers });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'INTERNAL' }, { status: 500 });
  }
}

// POST: Add new address
export async function POST(request: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
    }
    
    const addressData = await request.json();
    const addressesRef = adminDb.collection(`users/${user.uid}/addresses`);
    const docRef = await addressesRef.add(addressData);
    
    const headers = { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' };
    return new NextResponse(JSON.stringify({ id: docRef.id, ...addressData }), { status: 200, headers });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'INTERNAL' }, { status: 500 });
  }
}

// PUT: Update address
export async function PUT(request: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
    }
    
    const { id, ...updateData } = await request.json();
    const addressRef = adminDb.collection(`users/${user.uid}/addresses`).doc(id);
    await addressRef.update(updateData);
    
    const headers = { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' };
    return new NextResponse(JSON.stringify({ id, ...updateData }), { status: 200, headers });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'INTERNAL' }, { status: 500 });
  }
}

// DELETE: Remove address
export async function DELETE(request: NextRequest) {
  try {
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ success: false, error: 'UNAUTHORIZED' }, { status: 401 });
    }
    
    const { id } = await request.json();
    const addressRef = adminDb.collection(`users/${user.uid}/addresses`).doc(id);
    await addressRef.delete();
    
    const headers = { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' };
    return new NextResponse(JSON.stringify({ success: true }), { status: 200, headers });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'INTERNAL' }, { status: 500 });
  }
}