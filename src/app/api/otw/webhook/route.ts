export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { otwService } from '@/lib/services/otw-service';
import { adminDb } from '@/lib/firebaseAdmin';
import { COLLECTIONS } from '@/lib/firebase/collections';

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-otw-signature');
    const body = await request.text();

    // Verify webhook signature
    if (!signature || !otwService.verifyWebhookSignature(body, signature)) {
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    const event = JSON.parse(body);
    const deliveryUpdate = otwService.processWebhookEvent(event);

    if (!deliveryUpdate) {
      return NextResponse.json(
        { error: 'Invalid webhook event' },
        { status: 400 }
      );
    }

    // Find order by OTW delivery ID
    const ordersSnap = await adminDb.collection(COLLECTIONS.ORDERS)
      .where('deliveryInfo.otwDeliveryId', '==', deliveryUpdate.deliveryId)
      .get();
    
    if (ordersSnap.empty) {
      console.warn(`No order found for delivery ID: ${deliveryUpdate.deliveryId}`);
      return NextResponse.json({ success: true, message: 'Order not found' });
    }

    const orderDoc = ordersSnap.docs[0];
    const orderData = orderDoc.data();
    const orderId = orderDoc.id;

    // Map OTW status to our order status
    let orderStatus = orderData.status;
    let statusDescription = '';
    
    switch (deliveryUpdate.status) {
      case 'assigned':
        orderStatus = 'confirmed';
        statusDescription = `Driver assigned: ${deliveryUpdate.driverInfo?.name || 'Driver'}`;
        break;
      case 'picked_up':
        orderStatus = 'out_for_delivery';
        statusDescription = 'Order picked up by driver and on the way';
        break;
      case 'in_transit':
        orderStatus = 'out_for_delivery';
        statusDescription = 'Order is in transit to delivery address';
        break;
      case 'delivered':
        orderStatus = 'delivered';
        statusDescription = 'Order successfully delivered';
        break;
      case 'cancelled':
        orderStatus = 'cancelled';
        statusDescription = 'Delivery cancelled';
        break;
      default:
        statusDescription = `Delivery status: ${deliveryUpdate.status}`;
    }

    // Update order in Firebase
    const updateData: any = {
      status: orderStatus,
      updatedAt: new Date().toISOString(),
      deliveryInfo: {
        ...orderData.deliveryInfo,
        status: deliveryUpdate.status,
        driverInfo: deliveryUpdate.driverInfo,
        estimatedArrival: deliveryUpdate.estimatedArrival,
        location: deliveryUpdate.location
      },
      timeline: [
        ...(orderData.timeline || []),
        {
          status: deliveryUpdate.status,
          timestamp: new Date().toISOString(),
          description: statusDescription,
          userId: 'otw_system'
        }
      ]
    };

    // Update estimated time for delivery
    if (deliveryUpdate.estimatedArrival) {
      const estimatedMinutes = Math.ceil(
        (new Date(deliveryUpdate.estimatedArrival).getTime() - Date.now()) / (1000 * 60)
      );
      updateData.estimatedTime = Math.max(0, estimatedMinutes);
    }

    await adminDb.collection(COLLECTIONS.ORDERS).doc(orderId).update(updateData);

    // Note: Email and SMS notifications have been disabled
    // Push notifications can be implemented via Firebase Cloud Messaging
    console.log(`Delivery status updated for order ${orderData.orderNumber || orderId}: ${deliveryUpdate.status}`);
    
    // TODO: Implement push notifications for delivery updates if needed

    console.log(`Order ${orderId} updated with delivery status: ${deliveryUpdate.status}`);

    return NextResponse.json({
      success: true,
      orderId,
      status: orderStatus,
      deliveryStatus: deliveryUpdate.status
    });

  } catch (error) {
    console.error('Error processing OTW webhook:', error);
    return NextResponse.json(
      { 
        error: 'Failed to process webhook',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Handle webhook verification (GET request)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const challenge = searchParams.get('challenge');
  
  if (challenge) {
    return NextResponse.json({ challenge });
  }
  
  return NextResponse.json({ message: 'OTW webhook endpoint is active' });
}