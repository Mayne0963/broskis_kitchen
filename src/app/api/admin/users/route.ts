import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase/admin";
import { requireAdmin } from "@/lib/auth/adminOnly";

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    
    // Extract query parameters
    const query = searchParams.get('query');
    const cursor = searchParams.get('cursor');
    const limit = parseInt(searchParams.get('limit') || '20');
    const includeAuth = searchParams.get('includeAuth') === 'true';

    // Validate limit
    const pageLimit = Math.min(Math.max(limit, 1), 100);

    // Build Firestore query
    let firestoreQuery = adminDb.collection('users');

    // Apply search filter if provided
    if (query) {
      const searchTerm = query.toLowerCase().trim();
      
      // Search by email (exact match or prefix)
      if (searchTerm.includes('@')) {
        firestoreQuery = firestoreQuery.where('email', '>=', searchTerm)
                                      .where('email', '<=', searchTerm + '\uf8ff');
      } else {
        // Search by display name (prefix match)
        firestoreQuery = firestoreQuery.where('displayName', '>=', searchTerm)
                                      .where('displayName', '<=', searchTerm + '\uf8ff');
      }
    }

    // Apply cursor-based pagination
    if (cursor) {
      try {
        const cursorDoc = await adminDb.collection('users').doc(cursor).get();
        if (cursorDoc.exists) {
          firestoreQuery = firestoreQuery.startAfter(cursorDoc);
        }
      } catch (error) {
        console.error('Invalid cursor:', error);
      }
    }

    // Order by email for consistent pagination
    firestoreQuery = firestoreQuery.orderBy('email').limit(pageLimit);

    // Execute query
    const snapshot = await firestoreQuery.get();
    
    // Transform results
    const users = await Promise.all(
      snapshot.docs.map(async (doc) => {
        const data = doc.data();
        let authData = null;

        // Optionally include Firebase Auth data
        if (includeAuth) {
          try {
            const userRecord = await adminAuth.getUser(doc.id);
            authData = {
              emailVerified: userRecord.emailVerified,
              disabled: userRecord.disabled,
              lastSignInTime: userRecord.metadata.lastSignInTime,
              creationTime: userRecord.metadata.creationTime,
              customClaims: userRecord.customClaims || {},
              providerData: userRecord.providerData.map(provider => ({
                providerId: provider.providerId,
                uid: provider.uid,
                email: provider.email
              }))
            };
          } catch (error) {
            console.error(`Error fetching auth data for user ${doc.id}:`, error);
          }
        }

        return {
          uid: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
          updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
          lastLoginAt: data.lastLoginAt?.toDate?.()?.toISOString() || data.lastLoginAt,
          auth: authData
        };
      })
    );

    // Get total count for pagination info (optional)
    let totalCount = null;
    if (searchParams.get('includeCount') === 'true') {
      try {
        let countQuery = adminDb.collection('users');
        
        // Apply same search filter for count
        if (query) {
          const searchTerm = query.toLowerCase().trim();
          if (searchTerm.includes('@')) {
            countQuery = countQuery.where('email', '>=', searchTerm)
                                  .where('email', '<=', searchTerm + '\uf8ff');
          } else {
            countQuery = countQuery.where('displayName', '>=', searchTerm)
                                  .where('displayName', '<=', searchTerm + '\uf8ff');
          }
        }
        
        const countSnapshot = await countQuery.count().get();
        totalCount = countSnapshot.data().count;
      } catch (error) {
        console.error('Error getting user count:', error);
      }
    }

    // Prepare pagination info
    const hasMore = users.length === pageLimit;
    const nextCursor = hasMore && users.length > 0 ? users[users.length - 1].uid : null;

    return NextResponse.json({
      success: true,
      data: users,
      pagination: {
        limit: pageLimit,
        hasMore,
        nextCursor,
        totalCount,
        count: users.length
      },
      filters: {
        query,
        includeAuth
      }
    });

  } catch (error) {
    console.error('Error fetching admin users:', error);
    
    if (error instanceof Response) {
      return error;
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch users',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}