import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/firebaseAdmin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get the last order from the orders collection
    const ordersRef = adminDb.collection('orders');
    const snapshot = await ordersRef
      .orderBy('created_at', 'desc')
      .limit(1)
      .get();

    if (snapshot.empty) {
      return NextResponse.json({ message: 'No orders found' }, { status: 404 });
    }

    const lastOrder = snapshot.docs[0];
    const orderData = lastOrder.data();

    // Return essential order info
    const orderInfo = {
      id: lastOrder.id,
      amount_total: orderData.amount_total,
      items_length: orderData.items?.length || 0,
      created_at: orderData.created_at,
      status: orderData.status,
      stripe_session_id: orderData.stripe_session_id
    };

    return NextResponse.json(orderInfo);
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    );