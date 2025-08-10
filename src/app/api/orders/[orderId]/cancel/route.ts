import { NextRequest, NextResponse } from 'next/server';
import { refundService } from '@/lib/services/refund-service';
import { auth } from '@/lib/firebaseAdmin';
import { db } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

export async function POST(request: NextRequest, { params }: { params: { orderId: string } }) {
  try {
    const orderId = params.orderId;
    const body = await request.json();
    const { reason, refundAmount } = body;

    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Verify Firebase token
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(token);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Get order to verify ownership or admin access
    const orderRef = doc(db, 'orders', orderId);
    const orderSnap = await getDoc(orderRef);
    
    if (!orderSnap.exists()) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const orderData = orderSnap.data();
    
    // Check if user has permission (order owner or admin)
    const isOrderOwner = orderData.customerId === decodedToken.uid;
    const isAdmin = decodedToken.admin === true || decodedToken.role === 'admin';
    
    if (!isOrderOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Insufficient permissions to cancel this order' },
        { status: 403 }
      );
    }

    // Validate cancellation request
    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        { error: 'Cancellation reason is required' },
        { status: 400 }
      );
    }

    // Check if order can be cancelled
    if (['delivered', 'cancelled', 'refunded'].includes(orderData.status)) {
      return NextResponse.json(
        { error: `Cannot cancel order with status: ${orderData.status}` },
        { status: 400 }
      );
    }

    // Determine cancellation type and user
    let cancelledBy: 'customer' | 'admin' | 'system' = 'customer';
    if (isAdmin && !isOrderOwner) {
      cancelledBy = 'admin';
    } else if (isAdmin && isOrderOwner) {
      // Admin cancelling their own order
      cancelledBy = 'customer';
    }

    // Validate refund amount if provided
    if (refundAmount !== undefined) {
      const orderTotal = orderData.pricing?.total || 0;
      if (refundAmount < 0 || refundAmount > orderTotal) {
        return NextResponse.json(
          { error: 'Invalid refund amount' },
          { status: 400 }
        );
      }
    }

    // Cancel order
    const success = await refundService.cancelOrder({
      orderId,
      reason,
      cancelledBy,
      userId: decodedToken.uid,
      refundAmount
    });

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to cancel order' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Order cancelled successfully',
      orderId,
      cancelledBy,
      reason
    });

  } catch (error) {
    console.error('Error cancelling order:', error);
    return NextResponse.json(
      { 
        error: 'Failed to cancel order',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Get cancellation information
export async function GET(request: NextRequest, { params }: { params: { orderId: string } }) {
  try {
    const orderId = params.orderId;

    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Verify Firebase token
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(token);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Get order
    const orderRef = doc(db, 'orders', orderId);
    const orderSnap = await getDoc(orderRef);
    
    if (!orderSnap.exists()) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const orderData = orderSnap.data();
    
    // Check if user has permission
    const isOrderOwner = orderData.customerId === decodedToken.uid;
    const isAdmin = decodedToken.admin === true || decodedToken.role === 'admin';
    
    if (!isOrderOwner && !isAdmin) {
      return NextResponse.json(
        { error: 'Insufficient permissions to view this order' },
        { status: 403 }
      );
    }

    // Return cancellation information
    const cancellationInfo = {
      canCancel: !['delivered', 'cancelled', 'refunded'].includes(orderData.status),
      status: orderData.status,
      cancellationInfo: orderData.cancellationInfo || null,
      refundInfo: orderData.refundInfo || null,
      estimatedRefundTime: orderData.status === 'cancelled' && orderData.refundInfo 
        ? '5-10 business days' 
        : null
    };

    return NextResponse.json({
      success: true,
      cancellation: cancellationInfo
    });

  } catch (error) {
    console.error('Error getting cancellation info:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get cancellation information',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}