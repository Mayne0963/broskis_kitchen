/**
 * Admin Offers API endpoint
 * GET /api/admin/offers - Retrieve offers with filtering
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/adminOnly';
import { db } from '@/lib/firebase/admin';
import { Offer, OffersQuery, OffersResponse } from '@/types/firestore';
import { COLLECTIONS } from '@/lib/firebase/collections';
import { Timestamp } from 'firebase-admin/firestore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';
export const preferredRegion = ["iad1"]; // Co-locate near US East for admin traffic

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    await requireAdmin(request);
    
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const query: OffersQuery = {
      activeOnly: searchParams.get('activeOnly') === 'true',
      cursor: searchParams.get('cursor') || undefined,
      limit: parseInt(searchParams.get('limit') || '20')
    };
    
    // Validate limit
    if (query.limit > 100) {
      query.limit = 100;
    }
    
    // Build Firestore query
    let firestoreQuery = db.collection(COLLECTIONS.OFFERS).orderBy('createdAt', 'desc');
    
    // Apply active filter
    if (query.activeOnly) {
      const now = Timestamp.now();
      firestoreQuery = firestoreQuery
        .where('active', '==', true)
        .where('startsAt', '<=', now)
        .where('endsAt', '>', now);
    }
    
    // Apply cursor for pagination
    if (query.cursor) {
      try {
        const cursorDoc = await db.collection(COLLECTIONS.OFFERS).doc(query.cursor).get();
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
    const offers: Offer[] = [];
    let hasMore = false;
    let nextCursor: string | undefined;
    
    snapshot.docs.forEach((doc, index) => {
      if (index < query.limit) {
        const data = doc.data();
        offers.push({
          id: doc.id,
          ...data,
          // Convert Firestore Timestamps to JavaScript Dates for JSON serialization
          startsAt: data.startsAt,
          endsAt: data.endsAt,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        } as Offer);
      } else {
        // We have more results
        hasMore = true;
        nextCursor = snapshot.docs[query.limit - 1].id;
      }
    });
    
    // Prepare response
    const response: OffersResponse = {
      data: offers,
      hasMore,
      nextCursor: hasMore ? nextCursor : undefined,
      total: undefined
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Admin offers API error:', error);
    
    // Handle authentication errors
    if (error instanceof NextResponse) {
      return error;
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch offers', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST endpoint for creating/updating offers
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    await requireAdmin(request);
    
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['title', 'description', 'startsAt', 'endsAt'];
    const missingFields = requiredFields.filter(field => !(field in body));
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }
    
    // Validate dates
    const startsAt = Timestamp.fromDate(new Date(body.startsAt));
    const endsAt = Timestamp.fromDate(new Date(body.endsAt));
    
    if (startsAt.toDate() >= endsAt.toDate()) {
      return NextResponse.json(
        { error: 'endsAt must be after startsAt' },
        { status: 400 }
      );
    }
    
    // Validate target audience
    if (body.targetAudience && !['all', 'new', 'loyal', 'vip'].includes(body.targetAudience)) {
      return NextResponse.json(
        { error: 'targetAudience must be one of: all, new, loyal, vip' },
        { status: 400 }
      );
    }
    
    // Prepare offer data
    const now = Timestamp.now();
    const offerData: Partial<Offer> = {
      title: body.title.trim(),
      description: body.description.trim(),
      active: body.active !== undefined ? body.active : true,
      startsAt,
      endsAt,
      rewardBonus: body.rewardBonus || 0,
      imageUrl: body.imageUrl || '',
      terms: body.terms || '',
      targetAudience: body.targetAudience || 'all',
      updatedAt: now
    };
    
    let offerId: string;
    
    if (body.id) {
      // Update existing offer
      offerId = body.id;
      await db.collection(COLLECTIONS.OFFERS).doc(offerId).update(offerData);
    } else {
      // Create new offer
      offerData.createdAt = now;
      const docRef = await db.collection(COLLECTIONS.OFFERS).add(offerData);
      offerId = docRef.id;
    }
    
    // Fetch and return the created/updated offer
    const offerDoc = await db.collection(COLLECTIONS.OFFERS).doc(offerId).get();
    const offer = {
      id: offerDoc.id,
      ...offerDoc.data()
    } as Offer;
    
    return NextResponse.json(offer, { status: body.id ? 200 : 201 });
    
  } catch (error) {
    console.error('Admin offers POST API error:', error);
    
    // Handle authentication errors
    if (error instanceof NextResponse) {
      return error;
    }
    
    return NextResponse.json(
      { error: 'Failed to create/update offer', details: error instanceof Error ? error.message : 'Unknown error' },
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
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}