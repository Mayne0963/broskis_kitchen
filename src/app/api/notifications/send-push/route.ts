import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebaseAdmin';
import webpush from 'web-push';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  tag?: string;
  requireInteraction?: boolean;
}

interface SendPushRequest {
  userId: string;
  payload: NotificationPayload;
  targetDevices?: string[]; // Optional: specific device types to target
}

// Configure web-push with VAPID keys
if (process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    'mailto:support@broskiskitchen.com',
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );
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
    const requestingUserId = decodedToken.uid;

    const body: SendPushRequest = await request.json();

    // Validate request body
    if (!body.userId || !body.payload?.title || !body.payload?.body) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, payload.title, payload.body' },
        { status: 400 }
      );
    }

    // Check if VAPID keys are configured
    if (!process.env.VAPID_PUBLIC_KEY || !process.env.VAPID_PRIVATE_KEY) {
      console.error('VAPID keys not configured');
      return NextResponse.json(
        { error: 'Push notifications not configured' },
        { status: 500 }
      );
    }

    // Authorization check: users can send to themselves, or admins can send to anyone
    const isAdmin = decodedToken.admin === true;
    if (!isAdmin && body.userId !== requestingUserId) {
      return NextResponse.json(
        { error: 'Cannot send notifications to other users' },
        { status: 403 }
      );
    }

    // Get user's active push subscriptions
    let subscriptionsQuery = db
      .collection('push_subscriptions')
      .where('userId', '==', body.userId)
      .where('isActive', '==', true);

    // Filter by device types if specified
    if (body.targetDevices && body.targetDevices.length > 0) {
      subscriptionsQuery = subscriptionsQuery.where('deviceType', 'in', body.targetDevices);
    }

    const subscriptionsSnapshot = await subscriptionsQuery.get();

    if (subscriptionsSnapshot.empty) {
      return NextResponse.json({
        success: false,
        message: 'No active push subscriptions found for user',
        sentCount: 0
      });
    }

    // Prepare notification payload
    const notificationPayload = {
      title: body.payload.title,
      body: body.payload.body,
      icon: body.payload.icon || '/icons/icon-192x192.png',
      badge: body.payload.badge || '/icons/badge-72x72.png',
      image: body.payload.image,
      data: {
        ...body.payload.data,
        timestamp: Date.now(),
        url: body.payload.data?.url || '/'
      },
      actions: body.payload.actions || [],
      tag: body.payload.tag,
      requireInteraction: body.payload.requireInteraction || false,
      vibrate: [200, 100, 200], // Default vibration pattern
      silent: false
    };

    // Send notifications to all active subscriptions
    const sendPromises = subscriptionsSnapshot.docs.map(async (doc) => {
      const subscriptionData = doc.data();
      const pushSubscription = {
        endpoint: subscriptionData.endpoint,
        keys: subscriptionData.keys
      };

      try {
        await webpush.sendNotification(
          pushSubscription,
          JSON.stringify(notificationPayload),
          {
            TTL: 24 * 60 * 60, // 24 hours
            urgency: 'normal'
          }
        );

        // Update last used timestamp
        await doc.ref.update({
          lastUsed: new Date().toISOString()
        });

        return { success: true, subscriptionId: doc.id };
      } catch (error: any) {
        console.error(`Failed to send notification to subscription ${doc.id}:`, error);

        // Handle expired or invalid subscriptions
        if (error.statusCode === 410 || error.statusCode === 404) {
          // Mark subscription as inactive
          await doc.ref.update({
            isActive: false,
            invalidatedAt: new Date().toISOString(),
            invalidationReason: `HTTP ${error.statusCode}: ${error.body}`
          });
        }

        return { 
          success: false, 
          subscriptionId: doc.id, 
          error: error.message,
          statusCode: error.statusCode
        };
      }
    });

    const results = await Promise.all(sendPromises);
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.filter(r => !r.success).length;

    // Log notification activity
    await db.collection('notification_logs').add({
      type: 'push_notification',
      userId: body.userId,
      sentBy: requestingUserId,
      payload: body.payload,
      targetDevices: body.targetDevices,
      totalSubscriptions: subscriptionsSnapshot.size,
      successCount,
      failureCount,
      results,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: successCount > 0,
      message: `Sent ${successCount} notifications, ${failureCount} failed`,
      sentCount: successCount,
      failedCount: failureCount,
      totalSubscriptions: subscriptionsSnapshot.size,
      results: results.map(r => ({
        subscriptionId: r.subscriptionId,
        success: r.success,
        error: r.success ? undefined : r.error
      }))
    });

  } catch (error) {
    console.error('Error sending push notification:', error);
    
    if (error instanceof Error && error.message.includes('Firebase ID token')) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to send push notification' },
      { status: 500 }
    );
  }
}

// Get notification history for a user
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
    const requestingUserId = decodedToken.uid;

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || requestingUserId;
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Authorization check
    const isAdmin = decodedToken.admin === true;
    if (!isAdmin && userId !== requestingUserId) {
      return NextResponse.json(
        { error: 'Cannot access notification history for other users' },
        { status: 403 }
      );
    }

    // Get notification logs
    const logsSnapshot = await db
      .collection('notification_logs')
      .where('userId', '==', userId)
      .where('type', '==', 'push_notification')
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .offset(offset)
      .get();

    const logs = logsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({
      logs,
      count: logs.length,
      hasMore: logs.length === limit
    });

  } catch (error) {
    console.error('Error getting notification history:', error);
    
    if (error instanceof Error && error.message.includes('Firebase ID token')) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to get notification history' },
      { status: 500 }
    );
  }
}