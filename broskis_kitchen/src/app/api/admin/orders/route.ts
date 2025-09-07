/**
 * Admin Orders API endpoint
 * GET /api/admin/orders - Retrieve orders with filtering and pagination
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/adminOnly';
import { db } from '@/lib/firebase/admin';
import { Order, OrdersQuery, OrdersResponse } from '@/types/firestore';
import { COLLECTIONS } from '@/lib/firebase/collections';
import { Timestamp } from 'firebase-admin/firestore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Environment variable check
['FIREBASE_ADMIN_PROJECT_ID','FIREBASE_ADMIN_CLIENT_EMAIL','FIREBASE_ADMIN_PRIVATE_KEY']
  .forEach(k => { if (!process.env[k]) console.warn(`Missing env: ${k}`); });

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    await requireAdmin(request);
    
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const query: OrdersQuery = {
      status: searchParams.get('status') as Order['status'] || undefined,
      from: searchParams.get('from') || undefined,
      to: searchParams.get('to') || undefined,
      cursor: searchParams.get('cursor') || undefined,
      limit: parseInt(searchParams.get('limit') || '20'),
      sort: (searchParams.get('sort') as 'createdAt' | 'updatedAt' | 'total') || 'createdAt',
      dir: (searchParams.get('dir') as 'asc' | 'desc') || 'desc'
    };
    
    // Validate limit
    if (query.limit > 100) {
      query.limit = 100;
    }
    
    // Build Firestore query
    let firestoreQuery = db.collection(COLLECTIONS.ORDERS).orderBy(query.sort, query.dir);
    
    // Apply status filter
    if (query.status) {
      firestoreQuery = firestoreQuery.where('status', '==', query.status);
    }
    
    // Apply date range filters
    if (query.from) {
      const fromDate = Timestamp.fromDate(new Date(query.from));
      firestoreQuery = firestoreQuery.where('createdAt', '>=', fromDate);
    }
    
    if (query.to) {
      const toDate = Timestamp.fromDate(new Date(query.to));
      firestoreQuery = firestoreQuery.where('createdAt', '<=', toDate);
    }
    
    // Apply cursor for pagination
    if (query.cursor) {
      try {
        const cursorDoc = await db.collection(COLLECTIONS.ORDERS).doc(query.cursor).get();
        if (cursorDoc.exists) {
          firestoreQuery = firestoreQuery.startAfter(cursorDoc);
        }
      } catch (error) {
        console.warn('Invalid cursor provided:', query.cursor);
      }
    }
    
    // Apply limit (fetch one extra to check if there are more results)
    firestoreQuery = firestoreQuery.limit(query.limit + 1);
    
    // Execute query
    const snapshot = await firestoreQuery.get();
    
    // Process results
    const orders: Order[] = [];
    let hasMore = false;
    let nextCursor: string | undefined;
    
    snapshot.docs.forEach((doc, index) => {
      if (index < query.limit) {
        const data = doc.data();
        orders.push({
          id: doc.id,
          ...data,
          // Convert Firestore Timestamps to JavaScript Dates for JSON serialization
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        } as Order);
      } else {
        // We have more results
        hasMore = true;
        nextCursor = snapshot.docs[query.limit - 1].id;
      }
    });
    
    // Prepare response
    const response: OrdersResponse = {
      data: orders,
      hasMore,
      nextCursor: hasMore ? nextCursor : undefined,
      total: undefined // We don't calculate total for performance reasons
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Admin orders API error:', error);
    
    // Handle authentication errors
    if (error instanceof NextResponse) {
      return error;
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch orders', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}