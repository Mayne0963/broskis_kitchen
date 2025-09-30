/**
 * Optimized Admin Users API endpoint
 * GET /api/admin/users - Retrieve users with indexed queries and pagination
 * 
 * Features:
 * - O(1) indexed queries for role filtering
 * - Optimized email search using indexed email field
 * - Cursor-based pagination for consistent performance
 * - Standardized user document structure
 */

import { NextRequest, NextResponse } from 'next/server';
import { fastAdminGuard } from '@/lib/auth/fastGuard';
import { 
  getUsersByRole, 
  searchUsersByEmail, 
  getUserStats,
  UserWithId,
  UserDocument 
} from '@/lib/user';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
export const preferredRegion = ["iad1"]; // Co-locate near US East for admin traffic

// Response interfaces
interface UsersQuery {
  query?: string;
  cursor?: string;
  limit: number; // Always defined after parsing
  role?: "admin" | "user";
}

interface UsersResponse {
  data: UserWithId[];
  hasMore: boolean;
  nextCursor?: string;
  stats?: {
    totalUsers: number;
    adminUsers: number;
    regularUsers: number;
    recentUsers: number;
  };
}

export async function GET(request: NextRequest) {
  try {
    // Fast admin authentication guard
    const authResponse = await fastAdminGuard(request);
    if (authResponse) return authResponse;
    
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters with validation
    const query: UsersQuery = {
      query: searchParams.get('query') || undefined,
      cursor: searchParams.get('cursor') || undefined,
      limit: Math.min(parseInt(searchParams.get('limit') || '20'), 100), // Cap at 100
      role: (() => {
        const role = searchParams.get('role');
        return (role === 'admin' || role === 'user') ? role : undefined;
      })()
    };
    
    // Include stats in response if requested
    const includeStats = searchParams.get('includeStats') === 'true';
    
    let users: UserWithId[] = [];
    let hasMore = false;
    let nextCursor: string | undefined;
    let stats: UsersResponse['stats'] | undefined;
    
    // Handle email search with optimized indexed queries
    if (query.query) {
      try {
        users = await searchUsersByEmail(query.query, query.limit);
        hasMore = users.length === query.limit;
        nextCursor = hasMore ? users[users.length - 1].id : undefined;
      } catch (error) {
        console.error('Error searching users by email:', error);
        // Fallback to empty results
        users = [];
        hasMore = false;
      }
    } 
    // Handle role-based filtering with indexed queries
    else if (query.role) {
      try {
        // Get cursor document for pagination
        let startAfterDoc: FirebaseFirestore.DocumentSnapshot | undefined;
        if (query.cursor) {
          const { db } = await import('@/lib/firebase/admin');
          try {
            startAfterDoc = await db.collection('users').doc(query.cursor).get();
            if (!startAfterDoc.exists) {
              startAfterDoc = undefined;
            }
          } catch (error) {
            console.warn('Invalid cursor provided:', query.cursor);
          }
        }
        
        // Fetch one extra to check for more results
        const fetchLimit = query.limit + 1;
        const fetchedUsers = await getUsersByRole(query.role, fetchLimit, startAfterDoc);
        
        // Check if there are more results
        if (fetchedUsers.length > query.limit) {
          hasMore = true;
          users = fetchedUsers.slice(0, query.limit);
          nextCursor = users[users.length - 1].id;
        } else {
          hasMore = false;
          users = fetchedUsers;
        }
      } catch (error) {
        console.error('Error getting users by role:', error);
        users = [];
        hasMore = false;
      }
    } 
    // Handle general pagination without filters
    else {
      try {
        const { db } = await import('@/lib/firebase/admin');
        
        // Build query for all users
        let firestoreQuery = db
          .collection('users')
          .orderBy('createdAt', 'desc')
          .limit(query.limit + 1);
        
        // Apply cursor for pagination
        if (query.cursor) {
          try {
            const cursorDoc = await db.collection('users').doc(query.cursor).get();
            if (cursorDoc.exists) {
              firestoreQuery = firestoreQuery.startAfter(cursorDoc);
            }
          } catch (error) {
            console.warn('Invalid cursor provided:', query.cursor);
          }
        }
        
        const snapshot = await firestoreQuery.get();
        
        // Process results
        const fetchedUsers = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data() as UserDocument
        }));
        
        // Check if there are more results
        if (fetchedUsers.length > query.limit) {
          hasMore = true;
          users = fetchedUsers.slice(0, query.limit);
          nextCursor = users[users.length - 1].id;
        } else {
          hasMore = false;
          users = fetchedUsers;
        }
      } catch (error) {
        console.error('Error getting all users:', error);
        users = [];
        hasMore = false;
      }
    }
    
    // Get user statistics if requested
    if (includeStats) {
      try {
        stats = await getUserStats();
      } catch (error) {
        console.error('Error getting user stats:', error);
        // Continue without stats
      }
    }
    
    // Prepare optimized response
    const response: UsersResponse = {
      data: users,
      hasMore,
      nextCursor: hasMore ? nextCursor : undefined,
      stats
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