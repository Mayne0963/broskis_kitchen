import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

export async function GET() {
  try {
    const ordersRef = collection(db, 'orders');
    const q = query(ordersRef, orderBy('created_at', 'desc'), limit(1));
    const querySnapshot = await getDocs(q);
    
    if (querySnapshot.empty) {
      return NextResponse.json({ message: 'No orders found' });
    }
    
    const lastOrder = querySnapshot.docs[0];
    const orderData = lastOrder.data();
    
    return NextResponse.json({
      id: lastOrder.id,
      amount_total: orderData.amount_total,
      items_length: orderData.items?.length || 0,
      created_at: orderData.created_at,
      status: orderData.status
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 });
  }
}