import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { db } from '@/lib/firebase/admin';
import { AdminUsersResponse, AdminUserUpdateRequest } from '@/types/rewards';

// GET /api/rewards/admin/users - List users with pagination and filtering
export async function GET(req: NextRequest) {
  try {
    // Authenticate admin
    const adminOrRes = await requireAdmin(req as any);
    if (adminOrRes instanceof Response) return adminOrRes;
    
    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100); // Max 100
    const tier = searchParams.get('tier'); // 'regular', 'senior', 'volunteer'
    const search = searchParams.get('search'); // Search by email or name
    const sortBy = searchParams.get('sortBy') || 'createdAt'; // 'createdAt', 'currentPoints', 'totalEarned'
    const sortOrder = searchParams.get('sortOrder') || 'desc'; // 'asc', 'desc'
    
    // Build query
    let query = db.collection('loyalty');
    
    // Filter by tier if specified
    if (tier && ['regular', 'senior', 'volunteer'].includes(tier)) {
      query = query.where('tier', '==', tier);
    }
    
    // Apply sorting
    const orderDirection = sortOrder === 'asc' ? 'asc' : 'desc';
    query = query.orderBy(sortBy, orderDirection);
    
    // Get total count for pagination
    const totalSnapshot = await query.get();
    const total = totalSnapshot.size;
    
    // Apply pagination
    const offset = (page - 1) * limit;
    query = query.offset(offset).limit(limit);
    
    const snapshot = await query.get();
    
    // Process users
    const users = [];
    for (const doc of snapshot.docs) {
      const data = doc.data();
      
      // Apply search filter if specified (client-side filtering for simplicity)
      if (search) {
        const searchLower = search.toLowerCase();
        const email = data.email?.toLowerCase() || '';
        const name = data.name?.toLowerCase() || '';
        
        if (!email.includes(searchLower) && !name.includes(searchLower)) {
          continue;
        }
      }
      
      // Calculate expiring points
      const expiringPoints = data.pointsHistory?.filter((entry: any) => {
        const expiryDate = entry.expiresAt?.toDate();
        const thirtyDaysFromNow = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        return expiryDate && expiryDate <= thirtyDaysFromNow;
      }).reduce((sum: number, entry: any) => sum + entry.points, 0) || 0;
      
      users.push({
        userId: doc.id,
        email: data.email,
        name: data.name,
        tier: data.tier || 'regular',
        currentPoints: data.currentPoints || 0,
        totalEarned: data.totalEarned || 0,
        totalRedeemed: data.totalRedeemed || 0,
        expiringPoints,
        lastActivity: data.lastActivity?.toDate()?.toISOString(),
        createdAt: data.createdAt?.toDate()?.toISOString(),
        lastSpinDate: data.lastSpinDate?.toDate()?.toISOString()
      });
    }
    
    const response: AdminUsersResponse = {
      success: true,
      data: {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        },
        filters: {
          tier,
          search,
          sortBy,
          sortOrder
        }
      }
    };
    
    return NextResponse.json(response);
    
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// PUT /api/rewards/admin/users - Update user tier or other admin fields
export async function PUT(req: NextRequest) {
  try {
    // Authenticate admin
    const adminOrRes = await requireAdmin(req as any);
    if (adminOrRes instanceof Response) return adminOrRes;
    
    const body: AdminUserUpdateRequest = await req.json();
    const { userId, updates } = body;
    
    if (!userId) {
      return NextResponse.json({
        success: false,
        error: 'User ID is required'
      }, { status: 400 });
    }
    
    // Validate updates
    const allowedUpdates = ['tier', 'notes'];
    const updateData: any = {};
    
    for (const [key, value] of Object.entries(updates)) {
      if (!allowedUpdates.includes(key)) {
        return NextResponse.json({
          success: false,
          error: `Invalid update field: ${key}`
        }, { status: 400 });
      }
      
      // Validate tier values
      if (key === 'tier' && !['regular', 'senior', 'volunteer'].includes(value as string)) {
        return NextResponse.json({
          success: false,
          error: 'Invalid tier value. Must be: regular, senior, or volunteer'
        }, { status: 400 });
      }
      
      updateData[key] = value;
    }
    
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No valid updates provided'
      }, { status: 400 });
    }
    
    // Add update timestamp and admin info
    updateData.updatedAt = new Date();
    updateData.lastUpdatedBy = 'admin'; // In a real app, you'd get this from the authenticated admin
    
    // Update user in Firestore
    const userRef = db.collection('loyalty').doc(userId);
    const userDoc = await userRef.get();
    
    if (!userDoc.exists) {
      return NextResponse.json({
        success: false,
        error: 'User not found'
      }, { status: 404 });
    }
    
    await userRef.update(updateData);
    
    // Get updated user data
    const updatedDoc = await userRef.get();
    const updatedData = updatedDoc.data()!;
    
    return NextResponse.json({
      success: true,
      data: {
        userId,
        email: updatedData.email,
        name: updatedData.name,
        tier: updatedData.tier || 'regular',
        currentPoints: updatedData.currentPoints || 0,
        totalEarned: updatedData.totalEarned || 0,
        totalRedeemed: updatedData.totalRedeemed || 0,
        notes: updatedData.notes,
        updatedAt: updatedData.updatedAt?.toDate()?.toISOString(),
        lastUpdatedBy: updatedData.lastUpdatedBy
      }
    });
    
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}

// POST /api/rewards/admin/users/bulk - Bulk operations (tier updates, point adjustments)
export async function POST(req: NextRequest) {
  try {
    // Authenticate admin
    await requireAdmin(req);
    
    const body = await req.json();
    const { operation, userIds, data } = body;
    
    if (!operation || !userIds || !Array.isArray(userIds)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid request. Operation and userIds array required'
      }, { status: 400 });
    }
    
    if (userIds.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No users specified'
      }, { status: 400 });
    }
    
    if (userIds.length > 100) {
      return NextResponse.json({
        success: false,
        error: 'Maximum 100 users per bulk operation'
      }, { status: 400 });
    }
    
    const results = [];
    const errors = [];
    
    // Process each user
    for (const userId of userIds) {
      try {
        const userRef = db.collection('loyalty').doc(userId);
        const userDoc = await userRef.get();
        
        if (!userDoc.exists) {
          errors.push({ userId, error: 'User not found' });
          continue;
        }
        
        let updateData: any = {
          updatedAt: new Date(),
          lastUpdatedBy: 'admin'
        };
        
        switch (operation) {
          case 'updateTier':
            if (!data.tier || !['regular', 'senior', 'volunteer'].includes(data.tier)) {
              errors.push({ userId, error: 'Invalid tier value' });
              continue;
            }
            updateData.tier = data.tier;
            break;
            
          case 'adjustPoints':
            if (typeof data.pointsAdjustment !== 'number') {
              errors.push({ userId, error: 'Invalid points adjustment value' });
              continue;
            }
            const currentData = userDoc.data()!;
            const newPoints = Math.max(0, (currentData.currentPoints || 0) + data.pointsAdjustment);
            updateData.currentPoints = newPoints;
            
            // Record the adjustment as a transaction
            const transactionRef = db.collection('pointsTransactions').doc();
            await transactionRef.set({
              userId,
              points: data.pointsAdjustment,
              type: 'admin_adjustment',
              description: data.reason || 'Admin adjustment',
              createdAt: new Date(),
              expiresAt: null, // Admin adjustments don't expire
              metadata: {
                adminAction: true,
                reason: data.reason
              }
            });
            break;
            
          default:
            errors.push({ userId, error: 'Invalid operation' });
            continue;
        }
        
        await userRef.update(updateData);
        results.push({ userId, success: true });
        
      } catch (error) {
        console.error(`Error processing user ${userId}:`, error);
        errors.push({ userId, error: 'Processing failed' });
      }
    }
    
    return NextResponse.json({
      success: true,
      data: {
        operation,
        processed: results.length,
        failed: errors.length,
        results,
        errors
      }
    });
    
  } catch (error) {
    console.error('Error in bulk operation:', error);
    return NextResponse.json({
      success: false,
      error: 'Internal server error'
    }, { status: 500 });
  }
}