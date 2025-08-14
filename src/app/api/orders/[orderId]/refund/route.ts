import { NextRequest, NextResponse } from 'next/server';
import { refundService } from '@/lib/services/refund-service';
import { auth, adb } from '@/lib/firebaseAdmin';
import { COLLECTIONS } from '@/lib/firebase/collections';

export async function POST(request: NextRequest, { params }: { params: { orderId: string } }) {
  try {
    const orderId = params.orderId;
    const body = await request.json();
    const { amount, reason, refundType = 'full' } = body;

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
    const orderSnap = await adb.collection(COLLECTIONS.ORDERS).doc(orderId).get();
    
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
        { error: 'Insufficient permissions to refund this order' },
        { status: 403 }
      );
    }

    // Validate refund request
    if (!reason || reason.trim().length === 0) {
      return NextResponse.json(
        { error: 'Refund reason is required' },
        { status: 400 }
      );
    }

    if (amount && (amount <= 0 || amount > (orderData.pricing?.total || 0))) {
      return NextResponse.json(
        { error: 'Invalid refund amount' },
        { status: 400 }
      );
    }

    // Process refund
    const refundResponse = await refundService.processRefund({
      orderId,
      amount,
      reason,
      refundType,
      adminUserId: isAdmin ? decodedToken.uid : undefined,
      customerRequested: isOrderOwner
    });

    return NextResponse.json({
      success: true,
      refund: refundResponse,
      message: 'Refund processed successfully'
    });

  } catch (error) {
    console.error('Error processing refund:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process refund',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest, { params }: { params: { orderId: string } }) {
  try {
    const orderId = params.orderId;
    const { searchParams } = new URL(request.url);
    const refundId = searchParams.get('refundId');

    if (!refundId) {
      return NextResponse.json(
        { error: 'Missing refundId parameter' },
        { status: 400 }
      );
    }

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

    // Get refund status
    const refundStatus = await refundService.getRefundStatus(refundId);

    return NextResponse.json({
      success: true,
      refund: refundStatus
    });

  } catch (error) {
    console.error('Error getting refund status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get refund status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}