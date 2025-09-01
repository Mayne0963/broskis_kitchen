import { NextRequest, NextResponse } from 'next/server'
import { adb } from '@/lib/firebaseAdmin'

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// In-memory fallback storage
let orders: any[] = []

const ORDERS_COLLECTION = 'orders'

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const orderId = params.orderId

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    let foundOrder = null

    // Try Firebase first
    try {
      const ordersRef = adb.collection(ORDERS_COLLECTION)
      const querySnapshot = await ordersRef.where('id', '==', orderId).get()
      
      if (!querySnapshot.empty) {
        const orderDoc = querySnapshot.docs[0]
        const orderData = orderDoc.data()
        
        foundOrder = {
          ...orderData,
          createdAt: orderData.createdAt.toDate(),
          updatedAt: orderData.updatedAt.toDate()
        }
      }
    } catch (firebaseError) {
      console.warn('Failed to search Firebase, using fallback:', firebaseError)
    }

    // Fallback to in-memory storage if Firebase failed or not configured
    if (!foundOrder) {
      foundOrder = orders.find(order => order.id === orderId)
    }

    if (!foundOrder) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: 'Order found',
      order: foundOrder
    })
  } catch (error) {
    console.error('Error getting order:', error)
    return NextResponse.json(
      { error: 'Failed to get order' },
      { status: 500 }
    )
  }
}