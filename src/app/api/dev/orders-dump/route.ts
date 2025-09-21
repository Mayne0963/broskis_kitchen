export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';
import { COLLECTIONS } from '@/lib/firebase/collections';

export async function GET() {
  try {
    // Test admin SDK access
    const db = adminDb;
    
    // Try to list collections first
    const collections = await db.listCollections();
    const collectionNames = collections.map(col => col.id);
    
    // Try to get orders collection info
    const ordersRef = db.collection(COLLECTIONS.ORDERS);
    const querySnapshot = await ordersRef.limit(5).get();
    
    const orders = querySnapshot.docs.map(doc => ({
      id: doc.id,
      data: doc.data()
    }));
    
    return NextResponse.json({
      collections: collectionNames,
      orders_count: querySnapshot.size,
      orders: orders
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders', details: error.message },
      { status: 500 }
    );
  }
}