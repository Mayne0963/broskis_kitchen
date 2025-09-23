export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

/**
 * Development-only debug route to dump recent orders from Firestore
 * Purpose: Verify that Stripe webhook events are successfully creating order documents
 * Usage: GET /api/dev/orders-dump
 */
export async function GET(request: NextRequest) {
  try {
    // Only allow in development environment
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { error: 'This endpoint is only available in development' },
        { status: 403 }
      );
    }

    // Query the last 5 orders from Firestore, ordered by createdAt descending
    const ordersRef = adminDb.collection('orders');
    const snapshot = await ordersRef
      .orderBy('createdAt', 'desc')
      .limit(5)
      .get();

    // Convert Firestore documents to plain objects
    const orders = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      // Convert Firestore Timestamp to ISO string for JSON serialization
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || doc.data().createdAt
    }));

    return NextResponse.json({
      success: true,
      count: orders.length,
      orders,
      timestamp: new Date().toISOString(),
      message: 'Recent orders from Firestore (for webhook debugging)'
    });

  } catch (error) {
    console.error('Error fetching orders for debug:', error);
    
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch orders',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}