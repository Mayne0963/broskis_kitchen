export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { auth, db } from '@/lib/firebaseAdmin';

interface DriverInfo {
  id: string;
  name: string;
  phone: string;
  email?: string;
  vehicle: {
    type: 'car' | 'bike' | 'scooter' | 'walking';
    make?: string;
    model?: string;
    color?: string;
    licensePlate?: string;
  };
  location: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    timestamp: string;
  };
  status: 'available' | 'busy' | 'offline' | 'on_delivery';
  rating: number;
  totalDeliveries: number;
}

// GET - Get driver information
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

    // Check if user is admin or the driver themselves
    const isAdmin = decodedToken.admin === true;
    const isDriver = decodedToken.role === 'driver' && requestingUserId === driverId;
    
    if (!isAdmin && !isDriver) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    // Get driver information
    const driverDoc = await db.collection('drivers').doc(driverId).get();
    
    if (!driverDoc.exists) {
      return NextResponse.json(
        { error: 'Driver not found' },
        { status: 404 }
      );
    }

    const driverData = driverDoc.data() as DriverInfo;
    
    // Remove sensitive information if not admin or the driver themselves
    if (!isAdmin && !isDriver) {
      delete driverData.phone;
      delete driverData.email;
    }

    return NextResponse.json(driverData);

  } catch (error) {
    console.error('Error getting driver info:', error);
    
    if (error instanceof Error && error.message.includes('Firebase ID token')) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to get driver information' },
      { status: 500 }
    );
  }
}

// PUT - Update driver information
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

    // Check if user is admin or the driver themselves
    const isAdmin = decodedToken.admin === true;
    const isDriver = decodedToken.role === 'driver' && requestingUserId === driverId;
    
    if (!isAdmin && !isDriver) {
      return NextResponse.json(
        { error: 'Access denied' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const allowedFields = ['name', 'phone', 'email', 'vehicle'];
    
    // Filter only allowed fields
    const updateData: any = {};
    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    // Add timestamp
    updateData.updatedAt = new Date().toISOString();

    // Update driver document
    await db.collection('drivers').doc(driverId).update(updateData);

    // Log the update
    await db.collection('driver_activity_logs').add({
      driverId,
      action: 'profile_updated',
      updatedBy: requestingUserId,
      changes: updateData,
      timestamp: new Date().toISOString()
    });

    return NextResponse.json({
      success: true,
      message: 'Driver information updated successfully'
    });

  } catch (error) {
    console.error('Error updating driver info:', error);
    
    if (error instanceof Error && error.message.includes('Firebase ID token')) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to update driver information' },
      { status: 500 }
    );
  }
}