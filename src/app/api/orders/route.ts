import { NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { COLLECTIONS } from '@/lib/firebase/collections';
import { Order } from '@/types/firestore';
import { Timestamp } from 'firebase-admin/firestore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const db = getAdminDb();
    
    // Fetch latest 50 orders ordered by createdAt desc
    const snapshot = await db
      .collection(COLLECTIONS.ORDERS)
      .orderBy('createdAt', 'desc')
      .limit(50)
      .get();
    
    const orders = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        // Convert Firestore Timestamps to ISO strings
        createdAt: data.createdAt instanceof Timestamp ? data.createdAt.toDate().toISOString() : data.createdAt,
        updatedAt: data.updatedAt instanceof Timestamp ? data.updatedAt.toDate().toISOString() : data.updatedAt
      };
    });
    
    return NextResponse.json({
      ok: true,
      orders
    });
    
  } catch (error) {
    console.error('Failed to fetch orders:', error);
    return NextResponse.json(
      { 
        ok: false, 
        error: 'Failed to fetch orders',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}