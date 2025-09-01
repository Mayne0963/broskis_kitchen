/**
 * Admin Users API endpoint
 * GET /api/admin/users - Retrieve users with search and pagination
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/adminOnly';
import { db } from '@/lib/firebase/admin';
import { User, UsersQuery, UsersResponse, UserRoles } from '@/types/firestore';
import { COLLECTIONS } from '@/lib/firebase/collections';

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
    const query: UsersQuery = {
      query: searchParams.get('query') || undefined,
      cursor: searchParams.get('cursor') || undefined,
      limit: parseInt(searchParams.get('limit') || '20'),
      role: searchParams.get('role') as keyof UserRoles || undefined
    };
    
    // Validate limit
    if (query.limit > 100) {
      query.limit = 100;
    }
    
    // Build Firestore query
    let firestoreQuery = db.collection(COLLECTIONS.USERS).orderBy('createdAt', 'desc');
    
    // Apply role filter
    if (query.role) {
      firestoreQuery = firestoreQuery.where(`roles.${query.role}`, '==', true);
    }
    
    // Apply cursor for pagination
    if (query.cursor) {
      try {
        const cursorDoc = await db.collection(COLLECTIONS.USERS).doc(query.cursor).get();
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
    let users: User[] = [];
    let hasMore = false;
    let nextCursor: string | undefined;
    
    snapshot.docs.forEach((doc, index) => {
      if (index < query.limit) {
        const data = doc.data();
        users.push({
          uid: doc.id,
          ...data,
          // Convert Firestore Timestamps to JavaScript Dates for JSON serialization
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        } as User);
      } else {
        // We have more results
        hasMore = true;
        nextCursor = snapshot.docs[query.limit - 1].id;
      }
    });
    
    // Apply text search filter (client-side filtering for simplicity)
    // For production, consider using Algolia or similar for better search performance
    if (query.query) {
      const searchTerm = query.query.toLowerCase();
      users = users.filter(user => 
        user.email.toLowerCase().includes(searchTerm) ||
        user.displayName.toLowerCase().includes(searchTerm) ||
        (user.phone && user.phone.includes(searchTerm))
      );
      
      // Recalculate pagination after filtering
      if (users.length < query.limit && hasMore) {
        // We might need to fetch more results to fill the page
        // For simplicity, we'll just indicate there might be more
        hasMore = true;
      }
    }
    
    // Prepare response
    const response: UsersResponse = {
      data: users,
      hasMore,
      nextCursor: hasMore ? nextCursor : undefined,
      total: undefined // We don't calculate total for performance reasons
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Admin users API error:', error);
    
    // Handle authentication errors
    if (error instanceof NextResponse) {
      return error;
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch users', details: error instanceof Error ? error.message : 'Unknown error' },
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