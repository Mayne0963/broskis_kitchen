export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, auth } from '@/lib/firebaseAdmin';
import { COLLECTIONS } from '@/lib/firebase/collections';

interface UnsubscribeRequest {
  userId: string;
  endpoint: string;
}

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const body: UnsubscribeRequest = await request.json();

    // Validate request body
    if (!body.endpoint) {
      return NextResponse.json(
        { error: 'Endpoint is required' },
        { status: 400 }
      );
    }

    // Ensure the user can only unsubscribe for themselves
    if (body.userId !== userId) {
      return NextResponse.json(
        { error: 'Cannot unsubscribe for another user' },
        { status: 403 }
      );
    }

    // Generate subscription ID from endpoint
    const subscriptionId = Buffer.from(body.endpoint).toString('base64url');
    
    // Check if subscription exists and belongs to the user
    const subscriptionDoc = await adminDb.collection('push_subscriptions').doc(subscriptionId).get();
    
    if (!subscriptionDoc.exists) {
      return NextResponse.json(
        { error: 'Subscription not found' },
        { status: 404 }
      );
    }

    const subscriptionData = subscriptionDoc.data();
    if (subscriptionData?.userId !== userId) {
      return NextResponse.json(
        { error: 'Cannot unsubscribe for another user' },
        { status: 403 }
      );
    }

    // Mark subscription as inactive instead of deleting
    await adminDb.collection('push_subscriptions').doc(subscriptionId).update({
      isActive: false,
      unsubscribedAt: new Date().toISOString()
    });

    // Check if user has any other active subscriptions
    const activeSubscriptionsSnapshot = await adminDb
      .collection('push_subscriptions')
      .where('userId', '==', userId)
      .where('isActive', '==', true)
      .get();

    // If no active subscriptions, update user preferences
    if (activeSubscriptionsSnapshot.empty) {
      await adminDb.collection(COLLECTIONS.USERS).doc(userId).update({
        'notificationPreferences.pushNotifications': false,
        'notificationPreferences.lastUnsubscribed': new Date().toISOString()
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Successfully unsubscribed from push notifications'
    });

  } catch (error) {
    console.error('Error unsubscribing from push notifications:', error);
    
    if (error instanceof Error && error.message.includes('Firebase ID token')) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to unsubscribe from push notifications' },
      { status: 500 }
    );
  }
}

// Get unsubscribe status for a specific endpoint
export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    const decodedToken = await auth.verifyIdToken(token);
    const userId = decodedToken.uid;

    const { searchParams } = new URL(request.url);
    const endpoint = searchParams.get('endpoint');

    if (!endpoint) {
      return NextResponse.json(
        { error: 'Endpoint parameter is required' },
        { status: 400 }
      );
    }

    // Generate subscription ID from endpoint
    const subscriptionId = Buffer.from(endpoint).toString('base64url');
    
    // Get subscription status
    const subscriptionDoc = await adminDb.collection('push_subscriptions').doc(subscriptionId).get();
    
    if (!subscriptionDoc.exists) {
      return NextResponse.json({
        exists: false,
        isActive: false
      });
    }

    const subscriptionData = subscriptionDoc.data();
    
    // Ensure the subscription belongs to the requesting user
    if (subscriptionData?.userId !== userId) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    return NextResponse.json({
      exists: true,
      isActive: subscriptionData?.isActive || false,
      createdAt: subscriptionData?.createdAt,
      lastUsed: subscriptionData?.lastUsed,
      unsubscribedAt: subscriptionData?.unsubscribedAt
    });

  } catch (error) {
    console.error('Error getting subscription status:', error);
    
    if (error instanceof Error && error.message.includes('Firebase ID token')) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to get subscription status' },
      { status: 500 }
    );
  }
}