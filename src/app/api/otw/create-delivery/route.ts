export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { otwService } from '@/lib/services/otw-service';
import { adb } from '@/lib/firebaseAdmin';
import { COLLECTIONS } from '@/lib/firebase/collections';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderId, deliveryAddress, customerInfo, specialInstructions } = body;

    // Validate required fields
    if (!orderId || !deliveryAddress || !customerInfo) {
      return NextResponse.json(
        { error: 'Missing required fields: orderId, deliveryAddress, customerInfo' },
        { status: 400 }
      );
    }

    // Get order details from Firebase
    const orderRef = adb.collection(COLLECTIONS.ORDERS).doc(orderId);
    const orderSnap = await orderRef.get();
    
    if (!orderSnap.exists()) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    const orderData = orderSnap.data();
    
    // Restaurant pickup address (Broski's Kitchen)
    const pickupAddress = {
      street: '123 Food Street',
      city: 'San Francisco',
      state: 'CA',
      zipCode: '94102',
      latitude: 37.7749,
      longitude: -122.4194,
      instructions: 'Restaurant pickup - Ask for Broski\'s Kitchen order'
    };

    // Prepare delivery request
    const deliveryRequest = {
      orderId: orderId,
      pickupAddress,
      deliveryAddress: {
        street: deliveryAddress.street,
        city: deliveryAddress.city,
        state: deliveryAddress.state,
        zipCode: deliveryAddress.zipCode,
        latitude: deliveryAddress.latitude,
        longitude: deliveryAddress.longitude,
        instructions: deliveryAddress.instructions || specialInstructions
      },
      customerInfo: {
        name: customerInfo.name,
        phone: customerInfo.phone,
        email: customerInfo.email
      },
      orderValue: orderData.pricing?.total || 0,
      items: orderData.items?.map((item: any) => ({
        name: item.name,
        quantity: item.quantity,
        specialInstructions: item.customizations?.join(', ')
      })) || [],
      priority: orderData.priority || 'standard',
      specialInstructions: specialInstructions
    };

    // Create delivery with OTW
    const deliveryResponse = await otwService.createDelivery(deliveryRequest);

    // Update order with delivery information
    await orderRef.update({
      deliveryInfo: {
        otwDeliveryId: deliveryResponse.deliveryId,
        status: deliveryResponse.status,
        estimatedPickupTime: deliveryResponse.estimatedPickupTime,
        estimatedDeliveryTime: deliveryResponse.estimatedDeliveryTime,
        trackingUrl: deliveryResponse.trackingUrl,
        driverInfo: deliveryResponse.driverInfo,
        cost: deliveryResponse.cost
      },
      status: 'confirmed',
      estimatedTime: Math.ceil((new Date(deliveryResponse.estimatedDeliveryTime).getTime() - Date.now()) / (1000 * 60)),
      updatedAt: new Date().toISOString(),
      timeline: [
        ...(orderData.timeline || []),
        {
          status: 'delivery_scheduled',
          timestamp: new Date().toISOString(),
          description: `Delivery scheduled with OTW. Estimated delivery: ${deliveryResponse.estimatedDeliveryTime}`,
          userId: 'system'
        }
      ]
    });

    return NextResponse.json({
      success: true,
      deliveryId: deliveryResponse.deliveryId,
      estimatedDeliveryTime: deliveryResponse.estimatedDeliveryTime,
      trackingUrl: deliveryResponse.trackingUrl,
      driverInfo: deliveryResponse.driverInfo,
      cost: deliveryResponse.cost
    });

  } catch (error) {
    console.error('Error creating OTW delivery:', error);
    return NextResponse.json(
      { 
        error: 'Failed to create delivery',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const deliveryId = searchParams.get('deliveryId');

    if (!deliveryId) {
      return NextResponse.json(
        { error: 'Missing deliveryId parameter' },
        { status: 400 }
      );
    }

    // Get delivery status from OTW
    const deliveryUpdate = await otwService.getDeliveryStatus(deliveryId);

    return NextResponse.json({
      success: true,
      delivery: deliveryUpdate
    });

  } catch (error) {
    console.error('Error getting delivery status:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get delivery status',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}