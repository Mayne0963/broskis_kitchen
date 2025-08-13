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
    const activeOnly = searchParams.get('activeOnly') === 'true';
    const cursor = searchParams.get('cursor');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sort = searchParams.get('sort') || 'createdAt';
    const dir = searchParams.get('dir') || 'desc';
    const includeExpired = searchParams.get('includeExpired') === 'true';

    // Validate limit
    const pageLimit = Math.min(Math.max(limit, 1), 100);

    // Build query
    let query = adminDb.collection('offers');

    // Apply active filter
    if (activeOnly) {
      query = query.where('active', '==', true);
      
      // Also filter by date range if activeOnly is true
      if (!includeExpired) {
        const now = Timestamp.now();
        query = query.where('startsAt', '<=', now)
                    .where('endsAt', '>=', now);
      }
    }

    // Apply sorting
    const sortDirection = dir === 'asc' ? 'asc' : 'desc';
    query = query.orderBy(sort, sortDirection);

    // Apply cursor-based pagination
    if (cursor) {
      try {
        const cursorDoc = await adminDb.collection('offers').doc(cursor).get();
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
    
    // Transform results and add computed fields
    const now = new Date();
    const offers = snapshot.docs.map(doc => {
      const data = doc.data();
      const startsAt = data.startsAt?.toDate?.() || new Date(data.startsAt);
      const endsAt = data.endsAt?.toDate?.() || new Date(data.endsAt);
      
      // Calculate offer status
      const isCurrentlyActive = data.active && 
                               startsAt <= now && 
                               endsAt >= now;
      
      const isExpired = endsAt < now;
      const isUpcoming = startsAt > now;
      
      let status = 'inactive';
      if (isCurrentlyActive) status = 'active';
      else if (isExpired) status = 'expired';
      else if (isUpcoming) status = 'upcoming';
      
      // Calculate time remaining
      let timeRemaining = null;
      if (isCurrentlyActive) {
        const msRemaining = endsAt.getTime() - now.getTime();
        const daysRemaining = Math.ceil(msRemaining / (1000 * 60 * 60 * 24));
        timeRemaining = {
          days: daysRemaining,
          hours: Math.ceil(msRemaining / (1000 * 60 * 60)),
          milliseconds: msRemaining
        };
      }

      return {
        id: doc.id,
        ...data,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
        status,
        isCurrentlyActive,
        isExpired,
        isUpcoming,
        timeRemaining
      };
    });

    // Get summary statistics
    const stats = {
      total: offers.length,
      active: offers.filter(o => o.isCurrentlyActive).length,
      expired: offers.filter(o => o.isExpired).length,
      upcoming: offers.filter(o => o.isUpcoming).length,
      inactive: offers.filter(o => o.status === 'inactive').length
    };

    // Prepare pagination info
    const hasMore = offers.length === pageLimit;
    const nextCursor = hasMore && offers.length > 0 ? offers[offers.length - 1].id : null;

    return NextResponse.json({
      success: true,
      data: offers,
      stats,
      pagination: {
        limit: pageLimit,
        hasMore,
        nextCursor,
        count: offers.length
      },
      filters: {
        activeOnly,
        includeExpired,
        sort,
        dir
      }
    });

  } catch (error) {
    console.error('Error fetching offers:', error);
    
    if (error instanceof Response) {
      return error;
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch offers',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// POST /api/admin/offers - Create or update offer
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const adminUser = await requireAdmin(request);

    const body = await request.json();
    const { 
      id, 
      title, 
      description, 
      active, 
      startsAt, 
      endsAt, 
      rewardBonus,
      imageUrl,
      terms,
      priority
    } = body;

    // Validation
    if (!title || !description) {
      return NextResponse.json(
        { success: false, error: 'Title and description are required' },
        { status: 400 }
      );
    }

    // Validate dates
    const startDate = new Date(startsAt || Date.now());
    const endDate = new Date(endsAt);
    
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      return NextResponse.json(
        { success: false, error: 'Invalid date format' },
        { status: 400 }
      );
    }

    if (endDate <= startDate) {
      return NextResponse.json(
        { success: false, error: 'End date must be after start date' },
        { status: 400 }
      );
    }

    // Prepare offer data
    const offerData = {
      title: title.trim(),
      description: description.trim(),
      active: Boolean(active),
      startsAt: Timestamp.fromDate(startDate),
      endsAt: Timestamp.fromDate(endDate),
      rewardBonus: rewardBonus || null,
      imageUrl: imageUrl || null,
      terms: terms || '',
      priority: priority || 0,
      updatedAt: Timestamp.now(),
      updatedBy: adminUser.uid
    };

    let offerId;
    let operation;

    if (id) {
      // Update existing offer
      offerId = id;
      operation = 'updated';
      
      // Preserve original creation data
      const existingDoc = await adminDb.collection('offers').doc(id).get();
      if (existingDoc.exists) {
        const existingData = existingDoc.data();
        offerData.createdAt = existingData.createdAt;
        offerData.createdBy = existingData.createdBy;
      }
      
      await adminDb.collection('offers').doc(id).set(offerData, { merge: true });
    } else {
      // Create new offer
      operation = 'created';
      offerData.createdAt = Timestamp.now();
      offerData.createdBy = adminUser.uid;
      
      const docRef = await adminDb.collection('offers').add(offerData);
      offerId = docRef.id;
    }

    // Fetch the created/updated offer
    const offerDoc = await adminDb.collection('offers').doc(offerId).get();
    const offerResult = {
      id: offerDoc.id,
      ...offerDoc.data(),
      startsAt: offerData.startsAt.toDate().toISOString(),
      endsAt: offerData.endsAt.toDate().toISOString(),
      createdAt: offerData.createdAt.toDate().toISOString(),
      updatedAt: offerData.updatedAt.toDate().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: offerResult,
      message: `Offer ${operation} successfully`
    });

  } catch (error) {
    console.error('Error creating/updating offer:', error);
    
    if (error instanceof Response) {
      return error;
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create/update offer',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}