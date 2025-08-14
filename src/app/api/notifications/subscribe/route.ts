import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebaseAdmin';
import { COLLECTIONS } from '@/lib/firebase/collections';

interface SubscriptionRequest {
  userId: string;
  subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  };
  deviceType: 'desktop' | 'mobile' | 'tablet';
  userAgent: string;
  createdAt: string;
  lastUsed: string;
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

    const body: SubscriptionRequest = await request.json();

    // Validate request body
    if (!body.subscription?.endpoint || !body.subscription?.keys?.p256dh || !body.subscription?.keys?.auth) {
      return NextResponse.json(
        { error: 'Invalid subscription data' },
        { status: 400 }
      );
    }

    // Ensure the user can only subscribe for themselves
    if (body.userId !== userId) {
      return NextResponse.json(
        { error: 'Cannot subscribe for another user' },
        { status: 403 }
      );
    }

    // Create subscription document
    const subscriptionData = {
      userId,
      endpoint: body.subscription.endpoint,
      keys: body.subscription.keys,
      deviceType: body.deviceType,
      userAgent: body.userAgent,
      createdAt: new Date().toISOString(),
      lastUsed: new Date().toISOString(),
      isActive: true
    };

    // Use endpoint as document ID to prevent duplicates
    const subscriptionId = Buffer.from(body.subscription.endpoint).toString('base64url');
    
    await db.collection('push_subscriptions').doc(subscriptionId).set(subscriptionData);

    // Update user's notification preferences
    await db.collection(COLLECTIONS.USERS).doc(userId).update({
      'notificationPreferences.pushNotifications': true,
      'notificationPreferences.lastSubscribed': new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Successfully subscribed to push notifications',
      subscriptionId
    });

  } catch (error) {
    console.error('Error subscribing to push notifications:', error);
    
    if (error instanceof Error && error.message.includes('Firebase ID token')) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to subscribe to push notifications' },
      { status: 500 }
    );
  }
}

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

    // Get user's active subscriptions
    const subscriptionsSnapshot = await db
      .collection('push_subscriptions')
      .where('userId', '==', userId)
      .where('isActive', '==', true)
      .get();

    const subscriptions = subscriptionsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({
      subscriptions,
      count: subscriptions.length
    });

  } catch (error) {
    console.error('Error getting push subscriptions:', error);
    
    if (error instanceof Error && error.message.includes('Firebase ID token')) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to get push subscriptions' },
      { status: 500 }
    );
  }
}