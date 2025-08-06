import { NextRequest, NextResponse } from 'next/server'
import { Order, OrderStatus } from '@/types/order'
import { db, isFirebaseConfigured } from '@/lib/services/firebase'
import { 
  collection, 
  addDoc, 
  doc, 
  updateDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  Timestamp,
  deleteDoc
} from 'firebase/firestore'

// Collection name for orders
const ORDERS_COLLECTION = 'orders'

// In-memory storage as fallback
let orders: Order[] = []

// Generate unique order ID
function generateOrderId(): string {
  const timestamp = Date.now().toString(36)
  const randomStr = Math.random().toString(36).substring(2, 8)
  return `ORD-${timestamp}-${randomStr}`.toUpperCase()
}

// Calculate delivery fee
function calculateDeliveryFee(subtotal: number, orderType: 'delivery' | 'pickup'): number {
  if (orderType === 'pickup') return 0
  if (subtotal >= 50) return 0 // Free delivery over $50
  return 4.99 // Standard delivery fee
}

// GET /api/orders - Get all orders or user orders
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const orderId = searchParams.get('orderId')

    // Try Firebase first
    if (isFirebaseConfigured && db) {
      try {
        if (orderId) {
          // Get specific order from Firebase
          const q = query(
            collection(db, ORDERS_COLLECTION),
            where('id', '==', orderId)
          )
          const querySnapshot = await getDocs(q)
          
          if (!querySnapshot.empty) {
            const doc = querySnapshot.docs[0]
            const data = doc.data()
            const order = {
              ...data,
              createdAt: data.createdAt.toDate(),
              updatedAt: data.updatedAt.toDate()
            } as Order
            return NextResponse.json({ order })
          }
        } else if (userId) {
          // Get user orders from Firebase
          const q = query(
            collection(db, ORDERS_COLLECTION),
            where('userId', '==', userId),
            orderBy('createdAt', 'desc')
          )
          const querySnapshot = await getDocs(q)
          const userOrders: Order[] = []
          
          querySnapshot.forEach((doc) => {
            const data = doc.data()
            userOrders.push({
              ...data,
              createdAt: data.createdAt.toDate(),
              updatedAt: data.updatedAt.toDate()
            } as Order)
          })
          
          return NextResponse.json({ orders: userOrders })
        } else {
          // Get all orders from Firebase
          const q = query(
            collection(db, ORDERS_COLLECTION),
            orderBy('createdAt', 'desc')
          )
          const querySnapshot = await getDocs(q)
          const allOrders: Order[] = []
          
          querySnapshot.forEach((doc) => {
            const data = doc.data()
            allOrders.push({
              ...data,
              createdAt: data.createdAt.toDate(),
              updatedAt: data.updatedAt.toDate()
            } as Order)
          })
          
          return NextResponse.json({ orders: allOrders })
        }
      } catch (firebaseError) {
        console.warn('Firebase fetch failed, using fallback:', firebaseError)
      }
    }

    // Fallback to in-memory storage
    if (orderId) {
      const order = orders.find(o => o.id === orderId)
      if (!order) {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        )
      }
      return NextResponse.json({ order })
    }

    if (userId) {
      const userOrders = orders.filter(order => order.userId === userId)
      return NextResponse.json({ orders: userOrders })
    }

    return NextResponse.json({ orders })
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch orders' },
      { status: 500 }
    )
  }
}

// POST /api/orders - Create new order
export async function POST(request: NextRequest) {
  try {
    const orderData = await request.json()

    // Validate required fields
    if (!orderData.items || orderData.items.length === 0) {
      return NextResponse.json(
        { error: 'Order must contain at least one item' },
        { status: 400 }
      )
    }

    // Validate contact information (required for all orders)
    if (!orderData.contactInfo?.email || !orderData.contactInfo?.phone) {
      return NextResponse.json(
        { error: 'Contact information is required' },
        { status: 400 }
      )
    }

    if (orderData.orderType === 'delivery' && !orderData.deliveryAddress) {
      return NextResponse.json(
        { error: 'Delivery address is required for delivery orders' },
        { status: 400 }
      )
    }

    if (orderData.orderType === 'pickup' && !orderData.pickupLocation) {
      return NextResponse.json(
        { error: 'Pickup location is required for pickup orders' },
        { status: 400 }
      )
    }

    // Calculate totals
    const subtotal = orderData.items.reduce((total: number, item: any) => 
      total + (item.price * item.quantity), 0
    )
    const tax = subtotal * 0.0825 // 8.25% tax rate
    const deliveryFee = calculateDeliveryFee(subtotal, orderData.orderType)
    const total = subtotal + tax + deliveryFee

    // Create new order
    const newOrder: Order = {
      id: generateOrderId(),
      userId: orderData.userId || null, // Allow null for guest orders
      items: orderData.items,
      subtotal,
      tax,
      deliveryFee,
      total,
      status: 'pending',
      orderType: orderData.orderType,
      deliveryAddress: orderData.deliveryAddress,
      pickupLocation: orderData.pickupLocation,
      contactInfo: orderData.contactInfo,
      paymentInfo: orderData.paymentInfo,
      specialInstructions: orderData.specialInstructions,
      estimatedTime: orderData.estimatedTime,
      scheduledTime: orderData.scheduledTime,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    // Try to save to Firebase first
    if (isFirebaseConfigured && db) {
      try {
        const orderDoc = {
          ...newOrder,
          createdAt: Timestamp.fromDate(newOrder.createdAt),
          updatedAt: Timestamp.fromDate(newOrder.updatedAt)
        }
        
        await addDoc(collection(db, ORDERS_COLLECTION), orderDoc)
        console.log('Order saved to Firebase with ID:', newOrder.id)
      } catch (firebaseError) {
        console.warn('Failed to save to Firebase, using fallback:', firebaseError)
        // Add to in-memory storage as fallback
        orders.unshift(newOrder)
      }
    } else {
      // Add to in-memory storage
      orders.unshift(newOrder)
    }

    // Simulate processing time
    setTimeout(() => {
      // Auto-update order status after creation
      const orderIndex = orders.findIndex(o => o.id === newOrder.id)
      if (orderIndex !== -1) {
        orders[orderIndex].status = 'confirmed'
        orders[orderIndex].updatedAt = new Date()
        
        // Set estimated time based on order type
        const estimatedMinutes = orderData.orderType === 'pickup' ? 15 : 30
        const estimatedTime = new Date(Date.now() + estimatedMinutes * 60000)
        orders[orderIndex].estimatedTime = estimatedTime.toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit'
        })
      }
    }, 2000)

    return NextResponse.json(
      { 
        message: 'Order created successfully',
        order: newOrder
      },
      { status: 201 }
    )
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json(
      { error: 'Failed to create order' },
      { status: 500 }
    )
  }
}

// PUT /api/orders - Update order status
export async function PUT(request: NextRequest) {
  try {
    const { orderId, status, estimatedTime } = await request.json()

    if (!orderId || !status) {
      return NextResponse.json(
        { error: 'Order ID and status are required' },
        { status: 400 }
      )
    }

    let updatedOrder: Order | null = null

    // Try Firebase first
    if (isFirebaseConfigured && db) {
      try {
        const q = query(
          collection(db, ORDERS_COLLECTION),
          where('id', '==', orderId)
        )
        const querySnapshot = await getDocs(q)
        
        if (!querySnapshot.empty) {
          const orderDoc = querySnapshot.docs[0]
          const updateData = {
            status: status as OrderStatus,
            estimatedTime,
            updatedAt: Timestamp.now()
          }
          
          await updateDoc(orderDoc.ref, updateData)
          
          // Get updated order
          const updatedData = { ...orderDoc.data(), ...updateData }
          updatedOrder = {
            ...updatedData,
            createdAt: updatedData.createdAt.toDate(),
            updatedAt: updatedData.updatedAt.toDate()
          } as Order
          
          console.log('Order updated in Firebase:', orderId)
        }
      } catch (firebaseError) {
        console.warn('Failed to update in Firebase, using fallback:', firebaseError)
      }
    }

    // Fallback to in-memory storage if Firebase failed or not configured
    if (!updatedOrder) {
      const orderIndex = orders.findIndex(order => order.id === orderId)
      if (orderIndex === -1) {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        )
      }

      orders[orderIndex] = {
        ...orders[orderIndex],
        status: status as OrderStatus,
        estimatedTime,
        updatedAt: new Date()
      }
      
      updatedOrder = orders[orderIndex]
    }

    return NextResponse.json({
      message: 'Order updated successfully',
      order: updatedOrder
    })
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json(
      { error: 'Failed to update order' },
      { status: 500 }
    )
  }
}

// DELETE /api/orders - Cancel order
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    let cancelledOrder: Order | null = null

    // Try Firebase first
    if (isFirebaseConfigured && db) {
      try {
        const q = query(
          collection(db, ORDERS_COLLECTION),
          where('id', '==', orderId)
        )
        const querySnapshot = await getDocs(q)
        
        if (!querySnapshot.empty) {
          const orderDoc = querySnapshot.docs[0]
          const orderData = orderDoc.data() as Order
          
          // Check if order can be cancelled
          if (['delivered', 'completed', 'cancelled'].includes(orderData.status)) {
            return NextResponse.json(
              { error: 'Order cannot be cancelled' },
              { status: 400 }
            )
          }
          
          const updateData = {
            status: 'cancelled' as OrderStatus,
            updatedAt: Timestamp.now()
          }
          
          await updateDoc(orderDoc.ref, updateData)
          
          cancelledOrder = {
            ...orderData,
            status: 'cancelled' as OrderStatus,
            updatedAt: new Date()
          }
          
          console.log('Order cancelled in Firebase:', orderId)
        }
      } catch (firebaseError) {
        console.warn('Failed to cancel in Firebase, using fallback:', firebaseError)
      }
    }

    // Fallback to in-memory storage if Firebase failed or not configured
    if (!cancelledOrder) {
      const orderIndex = orders.findIndex(order => order.id === orderId)
      if (orderIndex === -1) {
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        )
      }

      // Check if order can be cancelled
      const order = orders[orderIndex]
      if (['delivered', 'completed', 'cancelled'].includes(order.status)) {
        return NextResponse.json(
          { error: 'Order cannot be cancelled' },
          { status: 400 }
        )
      }

      // Update order status to cancelled
      orders[orderIndex] = {
        ...order,
        status: 'cancelled',
        updatedAt: new Date()
      }
      
      cancelledOrder = orders[orderIndex]
    }

    return NextResponse.json({
      message: 'Order cancelled successfully',
      order: cancelledOrder
    })
  } catch (error) {
    console.error('Error cancelling order:', error)
    return NextResponse.json(
      { error: 'Failed to cancel order' },
      { status: 500 }
    )
  }
}