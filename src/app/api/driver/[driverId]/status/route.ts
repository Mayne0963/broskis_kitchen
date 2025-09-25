export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { auth, adminDb } from '@/lib/firebaseAdmin';

type DriverStatus = 'available' | 'busy' | 'offline' | 'on_delivery';

// PUT - Update driver status
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ driverId: string }> }
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
    const { driverId } = await params;

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
    const { status } = body;

    // Validate status
    const validStatuses: DriverStatus[] = ['available', 'busy', 'offline', 'on_delivery'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Get current driver data
    const driverDoc = await adminDb.collection('drivers').doc(driverId).get();
    if (!driverDoc.exists) {
      return NextResponse.json(
        { error: 'Driver not found' },
        { status: 404 }
      );
    }

    const currentDriverData = driverDoc.data();
    const currentStatus = currentDriverData?.status;

    // Validate status transitions
    const validTransitions = {
      'offline': ['available'],
      'available': ['busy', 'offline', 'on_delivery'],
      'busy': ['available', 'offline'],
      'on_delivery': ['available', 'offline']
    };

    if (currentStatus && !validTransitions[currentStatus as DriverStatus]?.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status transition from ${currentStatus} to ${status}` },
        { status: 400 }
      );
    }

    // Special handling for on_delivery status
    if (status === 'on_delivery') {
      // Check if driver has an active delivery
      if (!currentDriverData?.currentDeliveryId) {
        return NextResponse.json(
          { error: 'Cannot set status to on_delivery without an active delivery' },
          { status: 400 }
        );
      }
    }

    // Special handling when going offline during delivery
    if (status === 'offline' && currentStatus === 'on_delivery') {
      // This should trigger alerts to support team
      await this.handleDriverOfflineAlert(driverId, currentDriverData?.currentDeliveryId);
    }

    // Update driver status
    const updateData = {
      status,
      lastStatusUpdate: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Clear current delivery if going offline or available
    if ((status === 'offline' || status === 'available') && currentStatus === 'on_delivery') {
      updateData.currentDeliveryId = null;
      updateData.lastDeliveryCompleted = new Date().toISOString();
    }

    await adminDb.collection('drivers').doc(driverId).update(updateData);

    // Log status change
    await adminDb.collection('driver_status_history').add({
      driverId,
      previousStatus: currentStatus,
      newStatus: status,
      changedBy: requestingUserId,
      timestamp: new Date().toISOString(),
      metadata: {
        userAgent: request.headers.get('user-agent'),
        ip: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip')
      }
    });

    // Update availability metrics
    await this.updateDriverMetrics(driverId, currentStatus, status);

    return NextResponse.json({
      success: true,
      message: `Driver status updated to ${status}`,
      previousStatus: currentStatus,
      newStatus: status,
      timestamp: updateData.lastStatusUpdate
    });

  } catch (error) {
    console.error('Error updating driver status:', error);
    
    if (error instanceof Error && error.message.includes('Firebase ID token')) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update driver status' },
      { status: 500 }
    );
  }
}

// GET - Get driver status history
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ driverId: string }> }
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
    const { driverId } = await params;

    // Check if user is admin or the driver themselves
    const isAdmin = decodedToken.admin === true;
    const isDriver = decodedToken.role === 'driver' && requestingUserId === driverId;
    
    if (!isAdmin && !isDriver) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Build query
    let query = adminDb.collection('driver_status_history')
      .where('driverId', '==', driverId)
      .orderBy('timestamp', 'desc')
      .limit(limit);

    // Add date filters if provided
    if (startDate) {
      query = query.where('timestamp', '>=', startDate);
    }
    if (endDate) {
      query = query.where('timestamp', '<=', endDate);
    }

    const statusHistorySnapshot = await query.get();
    const statusHistory = statusHistorySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Get current status
    const driverDoc = await adminDb.collection('drivers').doc(driverId).get();
    const currentStatus = driverDoc.exists ? driverDoc.data()?.status : null;

    // Calculate status duration statistics
    const statusStats = this.calculateStatusStats(statusHistory);

    return NextResponse.json({
      currentStatus,
      history: statusHistory,
      statistics: statusStats,
      count: statusHistory.length
    });

  } catch (error) {
    console.error('Error getting driver status history:', error);
    
    if (error instanceof Error && error.message.includes('Firebase ID token')) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to get driver status history' },
      { status: 500 }
    );
  }
}

// Helper function to handle driver going offline during delivery
async function handleDriverOfflineAlert(driverId: string, deliveryId: string | null) {
  try {
    if (!deliveryId) return;

    // Create alert for support team
    await adminDb.collection('support_alerts').add({
      type: 'driver_offline_during_delivery',
      severity: 'high',
      driverId,
      deliveryId,
      message: `Driver ${driverId} went offline during active delivery ${deliveryId}`,
      timestamp: new Date().toISOString(),
      status: 'open',
      assignedTo: null
    });

    // Update delivery status
    await adminDb.collection('deliveries').doc(deliveryId).update({
      status: 'driver_unavailable',
      lastUpdate: new Date().toISOString(),
      alerts: adminDb.FieldValue.arrayUnion({
        type: 'driver_offline',
        timestamp: new Date().toISOString(),
        message: 'Driver went offline during delivery'
      })
    });

    console.log(`Alert created for driver ${driverId} going offline during delivery ${deliveryId}`);
  } catch (error) {
    console.error('Error handling driver offline alert:', error);
  }
}

// Helper function to update driver metrics
async function updateDriverMetrics(driverId: string, previousStatus: string, newStatus: string) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const metricsDocId = `${driverId}_${today}`;
    
    const metricsRef = adminDb.collection('driver_daily_metrics').doc(metricsDocId);
    const metricsDoc = await metricsRef.get();
    
    const currentMetrics = metricsDoc.exists ? metricsDoc.data() : {
      driverId,
      date: today,
      statusDurations: {
        available: 0,
        busy: 0,
        offline: 0,
        on_delivery: 0
      },
      statusChanges: 0,
      totalOnlineTime: 0,
      createdAt: new Date().toISOString()
    };

    // Increment status changes
    currentMetrics.statusChanges += 1;
    currentMetrics.updatedAt = new Date().toISOString();

    // Calculate online time (available + busy + on_delivery)
    const onlineStatuses = ['available', 'busy', 'on_delivery'];
    if (onlineStatuses.includes(newStatus) && !onlineStatuses.includes(previousStatus)) {
      // Driver came online
      currentMetrics.lastOnlineTime = new Date().toISOString();
    } else if (!onlineStatuses.includes(newStatus) && onlineStatuses.includes(previousStatus)) {
      // Driver went offline
      if (currentMetrics.lastOnlineTime) {
        const onlineTime = Date.now() - new Date(currentMetrics.lastOnlineTime).getTime();
        currentMetrics.totalOnlineTime += Math.round(onlineTime / 1000); // in seconds
      }
    }

    await metricsRef.set(currentMetrics, { merge: true });
  } catch (error) {
    console.error('Error updating driver metrics:', error);
  }
}

// Helper function to calculate status statistics
function calculateStatusStats(statusHistory: any[]) {
  const stats = {
    totalChanges: statusHistory.length,
    statusCounts: {
      available: 0,
      busy: 0,
      offline: 0,
      on_delivery: 0
    },
    averageSessionDuration: 0,
    mostCommonStatus: 'offline'
  };

  // Count status occurrences
  statusHistory.forEach(entry => {
    if (entry.newStatus && stats.statusCounts.hasOwnProperty(entry.newStatus)) {
      stats.statusCounts[entry.newStatus]++;
    }
  });

  // Find most common status
  let maxCount = 0;
  Object.entries(stats.statusCounts).forEach(([status, count]) => {
    if (count > maxCount) {
      maxCount = count;
      stats.mostCommonStatus = status;
    }
  });

  return stats;
}