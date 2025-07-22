import { NextRequest, NextResponse } from 'next/server';
import { getSessionCookie } from '@/lib/auth/session';
import { db } from '@/lib/services/firebase';
import { collection, addDoc, getDocs, doc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';

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
    const addressesRef = collection(db, `users/${userId}/addresses`);
    const snapshot = await getDocs(addressesRef);
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
    const addressesRef = collection(db, `users/${userId}/addresses`);
    const docRef = await addDoc(addressesRef, addressData);
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
    const addressRef = doc(db, `users/${userId}/addresses`, id);
    await updateDoc(addressRef, updateData);
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
    const addressRef = doc(db, `users/${userId}/addresses`, id);
    await deleteDoc(addressRef);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}