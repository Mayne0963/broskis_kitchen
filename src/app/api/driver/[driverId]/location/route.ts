import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebaseAdmin';

// PUT - Update driver location
export async function PUT(
  request: NextRequest,
  { params }: { params: { driverId: string } }
) {
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
    const { driverId } = params;

    // Check if user is the driver themselves or admin
    const isAdmin = decodedToken.admin === true;
    const isDriver = decodedToken.role === 'driver' && requestingUserId === driverId;
    
    if (!isAdmin && !isDriver) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { location } = body;

    // Validate location data
    if (!location || typeof location.latitude !== 'number' || typeof location.longitude !== 'number') {
      return NextResponse.json(
        { error: 'Invalid location data. Latitude and longitude are required.' },
        { status: 400 }
      );
    }

    // Validate coordinate ranges
    if (location.latitude < -90 || location.latitude > 90) {
      return NextResponse.json(
        { error: 'Invalid latitude. Must be between -90 and 90.' },
        { status: 400 }
      );
    }

    if (location.longitude < -180 || location.longitude > 180) {
      return NextResponse.json(
        { error: 'Invalid longitude. Must be between -180 and 180.' },
        { status: 400 }
      );
    }

    // Prepare location update
    const locationUpdate = {
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy || null,
      timestamp: location.timestamp || new Date().toISOString()
    };

    // Update driver location
    await db.collection('drivers').doc(driverId).update({
      location: locationUpdate,
      lastLocationUpdate: new Date().toISOString()
    });

    // Store location history for tracking
    await db.collection('driver_location_history').add({
      driverId,
      location: locationUpdate,
      timestamp: new Date().toISOString()
    });

    // If driver is on delivery, update delivery tracking
    const driverDoc = await db.collection('drivers').doc(driverId).get();
    const driverData = driverDoc.data();
    
    if (driverData?.status === 'on_delivery' && driverData?.currentDeliveryId) {
      await db.collection('delivery_tracking').doc(driverData.currentDeliveryId).update({
        driverLocation: locationUpdate,
        lastUpdate: new Date().toISOString()
      });

      // Notify customer of location update if they have opted in
      await notifyCustomerLocationUpdate(driverData.currentDeliveryId, locationUpdate);
    }

    return NextResponse.json({
      success: true,
      message: 'Location updated successfully',
      location: locationUpdate
    });

  } catch (error) {
    console.error('Error updating driver location:', error);
    
    if (error instanceof Error && error.message.includes('Firebase ID token')) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update driver location' },
      { status: 500 }
    );
  }
}

// GET - Get driver location history
export async function GET(
  request: NextRequest,
  { params }: { params: { driverId: string } }
) {
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
    const { driverId } = params;

    // Check if user is admin, the driver themselves, or has delivery access
    const isAdmin = decodedToken.admin === true;
    const isDriver = decodedToken.role === 'driver' && requestingUserId === driverId;
    
    if (!isAdmin && !isDriver) {
      // Check if user has an active delivery with this driver
      const { searchParams } = new URL(request.url);
      const deliveryId = searchParams.get('deliveryId');
      
      if (deliveryId) {
        const deliveryDoc = await db.collection('deliveries').doc(deliveryId).get();
        const deliveryData = deliveryDoc.data();
        
        if (!deliveryData || deliveryData.customerId !== requestingUserId || deliveryData.driverId !== driverId) {
          return NextResponse.json(
            { error: 'Access denied' },
            { status: 403 }
          );
        }
      } else {
        return NextResponse.json(
          { error: 'Access denied' },
          { status: 403 }
        );
      }
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const startTime = searchParams.get('startTime');
    const endTime = searchParams.get('endTime');

    // Build query
    let query = db.collection('driver_location_history')
      .where('driverId', '==', driverId)
      .orderBy('timestamp', 'desc')
      .limit(limit);

    // Add time filters if provided
    if (startTime) {
      query = query.where('timestamp', '>=', startTime);
    }
    if (endTime) {
      query = query.where('timestamp', '<=', endTime);
    }

    const locationHistorySnapshot = await query.get();
    const locationHistory = locationHistorySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Get current location from driver document
    const driverDoc = await db.collection('drivers').doc(driverId).get();
    const currentLocation = driverDoc.exists ? driverDoc.data()?.location : null;

    return NextResponse.json({
      currentLocation,
      history: locationHistory,
      count: locationHistory.length
    });

  } catch (error) {
    console.error('Error getting driver location history:', error);
    
    if (error instanceof Error && error.message.includes('Firebase ID token')) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to get driver location history' },
      { status: 500 }
    );
  }
}

// Helper function to notify customer of location updates
async function notifyCustomerLocationUpdate(deliveryId: string, location: any) {
  try {
    // Get delivery information
    const deliveryDoc = await db.collection('deliveries').doc(deliveryId).get();
    if (!deliveryDoc.exists) return;
    
    const deliveryData = deliveryDoc.data();
    const customerId = deliveryData?.customerId;
    
    if (!customerId) return;

    // Check if customer wants location updates
    const userDoc = await db.collection('users').doc(customerId).get();
    const userData = userDoc.data();
    const wantsLocationUpdates = userData?.notificationPreferences?.push?.orderUpdates !== false;
    
    if (!wantsLocationUpdates) return;

    // Send push notification with location update
    const notificationPayload = {
      title: '🚗 Driver Location Update',
      body: 'Your driver is on the way! Track their location in real-time.',
      data: {
        type: 'location_update',
        deliveryId,
        location,
        url: `/orders/${deliveryData.orderNumber}/track`
      },
      tag: `delivery-location-${deliveryId}`
    };

    // This would integrate with the push notification service
    // For now, we'll just log it
    console.log('Would send location update notification:', notificationPayload);
    
  } catch (error) {
    console.error('Error notifying customer of location update:', error);
  }
}