import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { requireAdmin } from "@/lib/auth/adminOnly";
import { Timestamp } from "firebase-admin/firestore";

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    
    // Extract query parameters
    const status = searchParams.get('status');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const cursor = searchParams.get('cursor');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sort = searchParams.get('sort') || 'createdAt';
    const dir = searchParams.get('dir') || 'desc';
    const userId = searchParams.get('userId');

    // Validate limit
    const pageLimit = Math.min(Math.max(limit, 1), 100);

    // Build query
    let query = adminDb.collection('orders');

    // Apply filters
    if (status) {
      query = query.where('status', '==', status);
    }

    if (userId) {
      query = query.where('userId', '==', userId);
    }

    // Date range filtering
    if (from) {
      const fromDate = new Date(from);
      if (!isNaN(fromDate.getTime())) {
        query = query.where('createdAt', '>=', Timestamp.fromDate(fromDate));
      }
    }

    if (to) {
      const toDate = new Date(to);
      if (!isNaN(toDate.getTime())) {
        // Add one day to include the entire 'to' date
        toDate.setDate(toDate.getDate() + 1);
        query = query.where('createdAt', '<', Timestamp.fromDate(toDate));
      }
    }

    // Apply sorting
    const sortDirection = dir === 'asc' ? 'asc' : 'desc';
    query = query.orderBy(sort, sortDirection);

    // Apply cursor-based pagination
    if (cursor) {
      try {
        const cursorDoc = await adminDb.collection('orders').doc(cursor).get();
        if (cursorDoc.exists) {
          query = query.startAfter(cursorDoc);
        }
      } catch (error) {
        console.error('Invalid cursor:', error);
      }
    }

    // Apply limit
    query = query.limit(pageLimit);

    // Execute query
    const snapshot = await query.get();
    
    // Transform results
    const orders = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
      };
    });

    // Get total count for pagination info (optional, can be expensive)
    let totalCount = null;
    if (searchParams.get('includeCount') === 'true') {
      try {
        let countQuery = adminDb.collection('orders');
        if (status) countQuery = countQuery.where('status', '==', status);
        if (userId) countQuery = countQuery.where('userId', '==', userId);
        
        const countSnapshot = await countQuery.count().get();
        totalCount = countSnapshot.data().count;
      } catch (error) {
        console.error('Error getting count:', error);
      }
    }

    // Prepare pagination info
    const hasMore = orders.length === pageLimit;
    const nextCursor = hasMore && orders.length > 0 ? orders[orders.length - 1].id : null;

    return NextResponse.json({
      success: true,
      data: orders,
      pagination: {
        limit: pageLimit,
        hasMore,
        nextCursor,
        totalCount,
        count: orders.length
      },
      filters: {
        status,
        from,
        to,
        userId,
        sort,
        dir
      }
    });

  } catch (error) {
    console.error('Error fetching admin orders:', error);
    
    if (error instanceof Response) {
      return error;
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch orders',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}