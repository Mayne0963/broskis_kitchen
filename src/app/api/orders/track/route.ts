export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server'
import { adminDb } from '@/lib/firebase/admin'

// In-memory fallback storage
let orders: any[] = []

const ORDERS_COLLECTION = 'orders'

export async function POST(request: NextRequest) {
  try {
    const { orderId, email } = await request.json()

    if (!orderId || !email) {
      return NextResponse.json(
        { error: 'Order ID and email are required' },
        { status: 400 }
      )
    }

    let foundOrder = null

    // Try Firebase Admin SDK first
    if (adminDb) {
      try {
        const querySnapshot = await adminDb.collection(ORDERS_COLLECTION)
          .where('id', '==', orderId)
          .get()
        
        if (!querySnapshot.empty) {
          const orderDoc = querySnapshot.docs[0]
          const orderData = orderDoc.data()
          
          // Verify email matches
          if (orderData.contactInfo?.email?.toLowerCase() === email.toLowerCase()) {
            foundOrder = {
              ...orderData,
              createdAt: orderData.createdAt.toDate(),
              updatedAt: orderData.updatedAt.toDate()
            }
          }
        }
      } catch (firebaseError) {
        console.warn('Failed to search Firebase, using fallback:', firebaseError)
      }
    }

    // Fallback to in-memory storage if Firebase failed or not configured
    if (!foundOrder) {
      foundOrder = orders.find(order => 
        order.id === orderId && 
        order.contactInfo?.email?.toLowerCase() === email.toLowerCase()
      )
    }

    if (!foundOrder) {
      return NextResponse.json(
        { error: 'Order not found or email does not match' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      message: 'Order found',
      order: foundOrder
    })
  } catch (error) {
    console.error('Error tracking order:', error)
    return NextResponse.json(
      { error: 'Failed to track order' },
      { status: 500 }
    )
  }
}