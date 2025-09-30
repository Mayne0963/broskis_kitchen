export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { adminDb, ensureAdmin } from '@/lib/firebase/admin';

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
  { params }: { params: Promise<{ driverId: string }> }
) {
  try {
    // Verify admin authentication
    await ensureAdmin(request);
    const { driverId } = await params;

    // Admin access verified by ensureAdmin

    // Get driver information
    const driverDoc = await adminDb.collection('drivers').doc(driverId).get();
    
    if (!driverDoc.exists) {
      return NextResponse.json(
        { error: 'Driver not found' },
        { status: 404 }
      );
    }

    const driverData = driverDoc.data() as DriverInfo;
    
    // Admin has full access to driver data

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
  { params }: { params: Promise<{ driverId: string }> }
) {
  try {
    // Verify admin authentication
    await ensureAdmin(request);
    const { driverId } = await params;

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
    await adminDb.collection('drivers').doc(driverId).update(updateData);

    // Log the update
    await adminDb.collection('driver_activity_logs').add({
      driverId,
      action: 'profile_updated',
      updatedBy: 'admin',
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