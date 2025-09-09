import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { COLLECTIONS } from '@/lib/firebase/collections';
import { Order } from '@/types/firestore';
import { Timestamp, FieldValue } from 'firebase-admin/firestore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED_STATUSES: Order['status'][] = ['pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled'];

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const db = getAdminDb();
    
    const doc = await db.collection(COLLECTIONS.ORDERS).doc(id).get();
    
    if (!doc.exists) {
      return NextResponse.json(
        { ok: false, error: 'Order not found' },
        { status: 404 }
      );
    }
    
    const data = doc.data()!;
    const order = {
      id: doc.id,
      ...data,
      // Convert Firestore Timestamps to ISO strings
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt
    };
    
    return NextResponse.json({
      ok: true,
      order
    });
    
  } catch (error) {
    console.error('Failed to fetch order:', error);
    return NextResponse.json(
      { 
        ok: false, 
        error: 'Failed to fetch order',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { status } = body;
    
    // Validate status
    if (!status || !ALLOWED_STATUSES.includes(status)) {
      return NextResponse.json(
        { 
          ok: false, 
          error: 'Invalid status',
          details: `Status must be one of: ${ALLOWED_STATUSES.join(', ')}`
        },
        { status: 400 }
      );
    }
    
    const db = getAdminDb();
    const docRef = db.collection(COLLECTIONS.ORDERS).doc(id);
    
    // Check if order exists
    const doc = await docRef.get();
    if (!doc.exists) {
      return NextResponse.json(
        { ok: false, error: 'Order not found' },
        { status: 404 }
      );
    }
    
    // Update the order
    await docRef.update({
      status,
      updatedAt: FieldValue.serverTimestamp()
    });
    
    // Fetch updated order
    const updatedDoc = await docRef.get();
    const data = updatedDoc.data()!;
    const order = {
      id: updatedDoc.id,
      ...data,
      // Convert Firestore Timestamps to ISO strings
      createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
      updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt
    };
    
    return NextResponse.json({
      ok: true,
      order
    });
    
  } catch (error) {
    console.error('Failed to update order:', error);
    return NextResponse.json(
      { 
        ok: false, 
        error: 'Failed to update order',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}