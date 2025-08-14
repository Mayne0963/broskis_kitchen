/**
 * Admin Coupons API endpoints
 * GET /api/admin/coupons - Retrieve coupons with filtering
 * POST /api/admin/coupons - Create or update coupons
 */

import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/adminOnly';
import { adminCollections } from '@/lib/firebase/admin-collections';
import { Coupon, CouponsQuery, CouponsResponse } from '@/types/firestore';
import { Timestamp } from 'firebase-admin/firestore';

export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    await requireAdmin(request);
    
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const query: CouponsQuery = {
      active: searchParams.get('active') === 'true' ? true : searchParams.get('active') === 'false' ? false : undefined,
      code: searchParams.get('code') || undefined,
      cursor: searchParams.get('cursor') || undefined,
      limit: parseInt(searchParams.get('limit') || '20')
    };
    
    // Validate limit
    if (query.limit > 100) {
      query.limit = 100;
    }
    
    // Build Firestore query
    let firestoreQuery = adminCollections.coupons.orderBy('createdAt', 'desc');
    
    // Apply active filter
    if (query.active !== undefined) {
      firestoreQuery = firestoreQuery.where('isActive', '==', query.active);
    }
    
    // Apply code filter (exact match)
    if (query.code) {
      firestoreQuery = firestoreQuery.where('code', '==', query.code.toUpperCase());
    }
    
    // Apply cursor for pagination
    if (query.cursor) {
      try {
        const cursorDoc = await adminCollections.coupons.doc(query.cursor).get();
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
    const coupons: Coupon[] = [];
    let hasMore = false;
    let nextCursor: string | undefined;
    
    snapshot.docs.forEach((doc, index) => {
      if (index < query.limit) {
        const data = doc.data();
        coupons.push({
          id: doc.id,
          ...data,
          // Convert Firestore Timestamps to JavaScript Dates for JSON serialization
          startsAt: data.startsAt,
          endsAt: data.endsAt,
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        } as Coupon);
      } else {
        // We have more results
        hasMore = true;
        nextCursor = snapshot.docs[query.limit - 1].id;
      }
    });
    
    // Prepare response
    const response: CouponsResponse = {
      data: coupons,
      hasMore,
      nextCursor: hasMore ? nextCursor : undefined,
      total: undefined
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Admin coupons GET API error:', error);
    
    // Handle authentication errors
    if (error instanceof NextResponse) {
      return error;
    }
    
    return NextResponse.json(
      { error: 'Failed to fetch coupons', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    await requireAdmin(request);
    
    const body = await request.json();
    
    // Validate required fields
    const requiredFields = ['code', 'discountType', 'value', 'startsAt', 'endsAt', 'usageLimit'];
    const missingFields = requiredFields.filter(field => !(field in body));
    
    if (missingFields.length > 0) {
      return NextResponse.json(
        { error: `Missing required fields: ${missingFields.join(', ')}` },
        { status: 400 }
      );
    }
    
    // Validate field values
    if (!['percentage', 'fixed'].includes(body.discountType)) {
      return NextResponse.json(
        { error: 'discountType must be either "percentage" or "fixed"' },
        { status: 400 }
      );
    }
    
    if (typeof body.value !== 'number' || body.value <= 0) {
      return NextResponse.json(
        { error: 'value must be a positive number' },
        { status: 400 }
      );
    }
    
    if (body.discountType === 'percentage' && body.value > 100) {
      return NextResponse.json(
        { error: 'percentage discount cannot exceed 100%' },
        { status: 400 }
      );
    }
    
    if (typeof body.usageLimit !== 'number' || body.usageLimit < 0) {
      return NextResponse.json(
        { error: 'usageLimit must be a non-negative number' },
        { status: 400 }
      );
    }
    
    // Normalize and validate code
    const code = body.code.toUpperCase().trim();
    if (!/^[A-Z0-9]{3,20}$/.test(code)) {
      return NextResponse.json(
        { error: 'code must be 3-20 characters long and contain only letters and numbers' },
        { status: 400 }
      );
    }
    
    // Check for duplicate codes (unless updating existing coupon)
    if (!body.id) {
      const existingCoupon = await adminCollections.coupons
        .where('code', '==', code)
        .limit(1)
        .get();
      
      if (!existingCoupon.empty) {
        return NextResponse.json(
          { error: 'A coupon with this code already exists' },
          { status: 409 }
        );
      }
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
    
    // Prepare coupon data
    const now = Timestamp.now();
    const couponData: Partial<Coupon> = {
      code,
      discountType: body.discountType,
      value: body.value,
      isActive: body.isActive !== undefined ? body.isActive : true,
      startsAt,
      endsAt,
      usageLimit: body.usageLimit,
      usageCount: body.usageCount || 0,
      description: body.description || '',
      minimumOrderValue: body.minimumOrderValue || 0,
      applicableItems: body.applicableItems || [],
      updatedAt: now
    };
    
    let couponId: string;
    
    if (body.id) {
      // Update existing coupon
      couponId = body.id;
      await adminCollections.coupons.doc(couponId).update(couponData);
    } else {
      // Create new coupon
      couponData.createdAt = now;
      const docRef = await adminCollections.coupons.add(couponData);
      couponId = docRef.id;
    }
    
    // Fetch and return the created/updated coupon
    const couponDoc = await adminCollections.coupons.doc(couponId).get();
    const coupon = {
      id: couponDoc.id,
      ...couponDoc.data()
    } as Coupon;
    
    return NextResponse.json(coupon, { status: body.id ? 200 : 201 });
    
  } catch (error) {
    console.error('Admin coupons POST API error:', error);
    
    // Handle authentication errors
    if (error instanceof NextResponse) {
      return error;
    }
    
    return NextResponse.json(
      { error: 'Failed to create/update coupon', details: error instanceof Error ? error.message : 'Unknown error' },
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