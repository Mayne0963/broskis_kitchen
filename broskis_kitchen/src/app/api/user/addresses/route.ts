import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie } from '@/lib/auth/session';
import { adb } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Helper to get user ID from session
const getUserId = async () => {
  const session = await getSessionCookie();
  if (!session) throw new Error('Unauthorized');
  return session.uid;
};

// GET: Fetch user's addresses
export async function GET() {
  try {
    const userId = await getUserId();
    const addressesRef = adb.collection(`users/${userId}/addresses`);
    const snapshot = await addressesRef.get();
    const addresses = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json(addresses);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// POST: Add new address
export async function POST(request: NextRequest) {
  try {
    const userId = await getUserId();
    const addressData = await request.json();
    const addressesRef = adb.collection(`users/${userId}/addresses`);
    const docRef = await addressesRef.add(addressData);
    return NextResponse.json({ id: docRef.id, ...addressData });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// PUT: Update address
export async function PUT(request: NextRequest) {
  try {
    const userId = await getUserId();
    const { id, ...updateData } = await request.json();
    const addressRef = adb.collection(`users/${userId}/addresses`).doc(id);
    await addressRef.update(updateData);
    return NextResponse.json({ id, ...updateData });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// DELETE: Remove address
export async function DELETE(request: NextRequest) {
  try {
    const userId = await getUserId();
    const { id } = await request.json();
    const addressRef = adb.collection(`users/${userId}/addresses`).doc(id);
    await addressRef.delete();
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}