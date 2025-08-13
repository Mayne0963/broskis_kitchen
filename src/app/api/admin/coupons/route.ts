import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase/admin";
import { requireAdmin } from "@/lib/auth/adminOnly";
import { Timestamp } from "firebase-admin/firestore";

// GET /api/admin/coupons - Fetch coupons with filtering
export async function GET(request: NextRequest) {
  try {
    // Verify admin authentication
    await requireAdmin(request);

    const { searchParams } = new URL(request.url);
    
    // Extract query parameters
    const active = searchParams.get('active');
    const code = searchParams.get('code');
    const cursor = searchParams.get('cursor');
    const limit = parseInt(searchParams.get('limit') || '20');
    const sort = searchParams.get('sort') || 'createdAt';
    const dir = searchParams.get('dir') || 'desc';

    // Validate limit
    const pageLimit = Math.min(Math.max(limit, 1), 100);

    // Build query
    let query = adminDb.collection('coupons');

    // Apply filters
    if (active !== null) {
      const isActive = active === 'true';
      query = query.where('isActive', '==', isActive);
    }

    if (code) {
      // Exact code match
      query = query.where('code', '==', code.toUpperCase());
    }

    // Apply sorting
    const sortDirection = dir === 'asc' ? 'asc' : 'desc';
    query = query.orderBy(sort, sortDirection);

    // Apply cursor-based pagination
    if (cursor) {
      try {
        const cursorDoc = await adminDb.collection('coupons').doc(cursor).get();
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
    
    // Transform results and check expiration
    const now = new Date();
    const coupons = snapshot.docs.map(doc => {
      const data = doc.data();
      const startsAt = data.startsAt?.toDate?.() || new Date(data.startsAt);
      const endsAt = data.endsAt?.toDate?.() || new Date(data.endsAt);
      
      // Calculate if coupon is currently valid
      const isCurrentlyValid = data.isActive && 
                              startsAt <= now && 
                              endsAt >= now &&
                              (data.usageLimit === null || data.usageCount < data.usageLimit);

      return {
        id: doc.id,
        ...data,
        startsAt: startsAt.toISOString(),
        endsAt: endsAt.toISOString(),
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
        isCurrentlyValid,
        remainingUses: data.usageLimit ? Math.max(0, data.usageLimit - data.usageCount) : null
      };
    });

    // Prepare pagination info
    const hasMore = coupons.length === pageLimit;
    const nextCursor = hasMore && coupons.length > 0 ? coupons[coupons.length - 1].id : null;

    return NextResponse.json({
      success: true,
      data: coupons,
      pagination: {
        limit: pageLimit,
        hasMore,
        nextCursor,
        count: coupons.length
      },
      filters: {
        active,
        code,
        sort,
        dir
      }
    });

  } catch (error) {
    console.error('Error fetching coupons:', error);
    
    if (error instanceof Response) {
      return error;
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch coupons',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

// POST /api/admin/coupons - Create or update coupon
export async function POST(request: NextRequest) {
  try {
    // Verify admin authentication
    const adminUser = await requireAdmin(request);

    const body = await request.json();
    const { 
      id, 
      code, 
      discountType, 
      value, 
      isActive, 
      startsAt, 
      endsAt, 
      usageLimit,
      description,
      minimumOrderValue,
      maxDiscountAmount
    } = body;

    // Validation
    if (!code || !discountType || value === undefined) {
      return NextResponse.json(
        { success: false, error: 'Code, discountType, and value are required' },
        { status: 400 }
      );
    }

    if (!['percentage', 'fixed'].includes(discountType)) {
      return NextResponse.json(
        { success: false, error: 'discountType must be "percentage" or "fixed"' },
        { status: 400 }
      );
    }

    if (typeof value !== 'number' || value <= 0) {
      return NextResponse.json(
        { success: false, error: 'Value must be a positive number' },
        { status: 400 }
      );
    }

    if (discountType === 'percentage' && value > 100) {
      return NextResponse.json(
        { success: false, error: 'Percentage discount cannot exceed 100%' },
        { status: 400 }
      );
    }

    // Normalize and validate dates
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

    const normalizedCode = code.toUpperCase().trim();

    // Check for duplicate codes (excluding current coupon if updating)
    const existingCouponQuery = adminDb.collection('coupons').where('code', '==', normalizedCode);
    const existingCoupons = await existingCouponQuery.get();
    
    if (!existingCoupons.empty) {
      const duplicateExists = existingCoupons.docs.some(doc => doc.id !== id);
      if (duplicateExists) {
        return NextResponse.json(
          { success: false, error: 'Coupon code already exists' },
          { status: 409 }
        );
      }
    }

    // Prepare coupon data
    const couponData = {
      code: normalizedCode,
      discountType,
      value,
      isActive: Boolean(isActive),
      startsAt: Timestamp.fromDate(startDate),
      endsAt: Timestamp.fromDate(endDate),
      usageLimit: usageLimit || null,
      usageCount: 0,
      description: description || '',
      minimumOrderValue: minimumOrderValue || 0,
      maxDiscountAmount: maxDiscountAmount || null,
      updatedAt: Timestamp.now(),
      updatedBy: adminUser.uid
    };

    let couponId;
    let operation;

    if (id) {
      // Update existing coupon
      couponId = id;
      operation = 'updated';
      
      // Preserve original creation data
      const existingDoc = await adminDb.collection('coupons').doc(id).get();
      if (existingDoc.exists) {
        const existingData = existingDoc.data();
        couponData.createdAt = existingData.createdAt;
        couponData.createdBy = existingData.createdBy;
        couponData.usageCount = existingData.usageCount || 0;
      }
      
      await adminDb.collection('coupons').doc(id).set(couponData, { merge: true });
    } else {
      // Create new coupon
      operation = 'created';
      couponData.createdAt = Timestamp.now();
      couponData.createdBy = adminUser.uid;
      
      const docRef = await adminDb.collection('coupons').add(couponData);
      couponId = docRef.id;
    }

    // Fetch the created/updated coupon
    const couponDoc = await adminDb.collection('coupons').doc(couponId).get();
    const couponResult = {
      id: couponDoc.id,
      ...couponDoc.data(),
      startsAt: couponData.startsAt.toDate().toISOString(),
      endsAt: couponData.endsAt.toDate().toISOString(),
      createdAt: couponData.createdAt.toDate().toISOString(),
      updatedAt: couponData.updatedAt.toDate().toISOString()
    };

    return NextResponse.json({
      success: true,
      data: couponResult,
      message: `Coupon ${operation} successfully`
    });

  } catch (error) {
    console.error('Error creating/updating coupon:', error);
    
    if (error instanceof Response) {
      return error;
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create/update coupon',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    );
  }
}