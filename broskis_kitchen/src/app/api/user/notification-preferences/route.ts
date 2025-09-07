import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebaseAdmin';
import { COLLECTIONS } from '@/lib/firebase/collections';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

interface NotificationPreferences {
  email: {
    orderConfirmation: boolean;
    orderUpdates: boolean;
    promotions: boolean;
    newsletter: boolean;
  };
  sms: {
    orderConfirmation: boolean;
    orderUpdates: boolean;
    deliveryUpdates: boolean;
    promotions: boolean;
  };
  push: {
    enabled: boolean;
    orderUpdates: boolean;
    promotions: boolean;
    marketing: boolean;
  };
  general: {
    frequency: 'all' | 'important' | 'minimal';
    quietHours: {
      enabled: boolean;
      start: string;
      end: string;
    };
  };
}

const defaultPreferences: NotificationPreferences = {
  email: {
    orderConfirmation: true,
    orderUpdates: true,
    promotions: false,
    newsletter: false
  },
  sms: {
    orderConfirmation: true,
    orderUpdates: true,
    deliveryUpdates: true,
    promotions: false
  },
  push: {
    enabled: false,
    orderUpdates: true,
    promotions: false,
    marketing: false
  },
  general: {
    frequency: 'all',
    quietHours: {
      enabled: false,
      start: '22:00',
      end: '08:00'
    }
  }
};

// GET - Retrieve user's notification preferences
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

    // Get user's notification preferences
    const userDoc = await db.collection(COLLECTIONS.USERS).doc(userId).get();
    
    if (!userDoc.exists) {
      // Create user document with default preferences
      const userData = {
        notificationPreferences: defaultPreferences,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      await db.collection(COLLECTIONS.USERS).doc(userId).set(userData);
      
      return NextResponse.json({
        preferences: defaultPreferences,
        isDefault: true
      });
    }

    const userData = userDoc.data();
    const preferences = userData?.notificationPreferences || defaultPreferences;

    // Merge with defaults to ensure all fields are present
    const mergedPreferences = {
      email: { ...defaultPreferences.email, ...preferences.email },
      sms: { ...defaultPreferences.sms, ...preferences.sms },
      push: { ...defaultPreferences.push, ...preferences.push },
      general: {
        ...defaultPreferences.general,
        ...preferences.general,
        quietHours: {
          ...defaultPreferences.general.quietHours,
          ...preferences.general?.quietHours
        }
      }
    };

    return NextResponse.json({
      preferences: mergedPreferences,
      lastUpdated: userData?.updatedAt,
      isDefault: false
    });

  } catch (error) {
    console.error('Error getting notification preferences:', error);
    
    if (error instanceof Error && error.message.includes('Firebase ID token')) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to get notification preferences' },
      { status: 500 }
    );
  }
}

// PUT - Update user's notification preferences
export async function PUT(request: NextRequest) {
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

    const body = await request.json();
    const { preferences } = body;

    // Validate preferences structure
    if (!preferences || typeof preferences !== 'object') {
      return NextResponse.json(
        { error: 'Invalid preferences data' },
        { status: 400 }
      );
    }

    // Validate required sections
    const requiredSections = ['email', 'sms', 'push', 'general'];
    for (const section of requiredSections) {
      if (!preferences[section] || typeof preferences[section] !== 'object') {
        return NextResponse.json(
          { error: `Missing or invalid ${section} preferences` },
          { status: 400 }
        );
      }
    }

    // Validate frequency value
    if (!['all', 'important', 'minimal'].includes(preferences.general.frequency)) {
      return NextResponse.json(
        { error: 'Invalid frequency value' },
        { status: 400 }
      );
    }

    // Validate quiet hours format
    if (preferences.general.quietHours?.enabled) {
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(preferences.general.quietHours.start) || 
          !timeRegex.test(preferences.general.quietHours.end)) {
        return NextResponse.json(
          { error: 'Invalid quiet hours time format' },
          { status: 400 }
        );
      }
    }

    // Merge with existing preferences to preserve any fields not included in the update
    const existingDoc = await db.collection(COLLECTIONS.USERS).doc(userId).get();
    const existingData = existingDoc.exists ? existingDoc.data() : {};
    const existingPreferences = existingData?.notificationPreferences || {};

    const mergedPreferences = {
      email: { ...existingPreferences.email, ...preferences.email },
      sms: { ...existingPreferences.sms, ...preferences.sms },
      push: { ...existingPreferences.push, ...preferences.push },
      general: {
        ...existingPreferences.general,
        ...preferences.general,
        quietHours: {
          ...existingPreferences.general?.quietHours,
          ...preferences.general?.quietHours
        }
      }
    };

    // Update user document
    const updateData = {
      notificationPreferences: mergedPreferences,
      updatedAt: new Date().toISOString()
    };

    // If document doesn't exist, create it
    if (!existingDoc.exists) {
      updateData.createdAt = new Date().toISOString();
      await db.collection(COLLECTIONS.USERS).doc(userId).set(updateData);
    } else {
      await db.collection(COLLECTIONS.USERS).doc(userId).update(updateData);
    }

    // Log preference changes for analytics
    await db.collection('user_activity_logs').add({
      userId,
      action: 'notification_preferences_updated',
      changes: preferences,
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
    });

    return NextResponse.json({
      success: true,
      message: 'Notification preferences updated successfully',
      preferences: mergedPreferences,
      updatedAt: updateData.updatedAt
    });

  } catch (error) {
    console.error('Error updating notification preferences:', error);
    
    if (error instanceof Error && error.message.includes('Firebase ID token')) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update notification preferences' },
      { status: 500 }
    );
  }
}

// DELETE - Reset notification preferences to defaults
export async function DELETE(request: NextRequest) {
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

    // Reset to default preferences
    const updateData = {
      notificationPreferences: defaultPreferences,
      updatedAt: new Date().toISOString()
    };

    await db.collection(COLLECTIONS.USERS).doc(userId).update(updateData);

    // Log the reset action
    await db.collection('user_activity_logs').add({
      userId,
      action: 'notification_preferences_reset',
      timestamp: new Date().toISOString(),
      userAgent: request.headers.get('user-agent'),
      ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
    });

    return NextResponse.json({
      success: true,
      message: 'Notification preferences reset to defaults',
      preferences: defaultPreferences,
      updatedAt: updateData.updatedAt
    });

  } catch (error) {
    console.error('Error resetting notification preferences:', error);
    
    if (error instanceof Error && error.message.includes('Firebase ID token')) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to reset notification preferences' },
      { status: 500 }
    );
  }
}