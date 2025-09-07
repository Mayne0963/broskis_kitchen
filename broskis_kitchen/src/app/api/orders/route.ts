import { NextRequest, NextResponse } from 'next/server'
import { Order, OrderStatus } from '@/types/order'
import { adb } from '@/lib/firebaseAdmin'
import { withErrorHandler } from '@/lib/middleware/error-handler'
import { logger } from '@/lib/services/logging-service'

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
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
export const GET = withErrorHandler(async (request: NextRequest) => {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const orderId = searchParams.get('orderId')

    logger.logBusinessEvent('order_fetch_attempt', {
      userId,
      orderId,
      fetchType: orderId ? 'single' : userId ? 'user_orders' : 'all_orders'
    })

    // Try Firebase Admin first
    try {
      if (orderId) {
        // Get specific order from Firebase
        const querySnapshot = await adb.collection(ORDERS_COLLECTION)
          .where('id', '==', orderId)
          .get()
          
        if (!querySnapshot.empty) {
          const doc = querySnapshot.docs[0]
          const data = doc.data()
          const order = {
            ...data,
            createdAt: data.createdAt.toDate(),
            updatedAt: data.updatedAt.toDate()
          } as Order
            
            logger.logBusinessEvent('order_fetch_success', {
              orderId,
              orderStatus: order.status,
              orderType: order.orderType
            })
            
            return NextResponse.json({ order })
          }
      } else if (userId) {
        // Get user orders from Firebase
        const querySnapshot = await adb.collection(ORDERS_COLLECTION)
          .where('userId', '==', userId)
          .orderBy('createdAt', 'desc')
          .get()
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
        const querySnapshot = await adb.collection(ORDERS_COLLECTION)
          .orderBy('createdAt', 'desc')
          .get()
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
      logger.error('Firebase fetch failed, using fallback', {
        error: firebaseError,
        userId,
        orderId
      })
    }

    // Fallback to in-memory storage
    if (orderId) {
      const order = orders.find(o => o.id === orderId)
      if (!order) {
        logger.logBusinessEvent('order_not_found', { orderId })
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        )
      }
      logger.logBusinessEvent('order_fetch_success', {
        orderId,
        source: 'memory',
        orderStatus: order.status
      })
      return NextResponse.json({ order })
    }

    if (userId) {
      const userOrders = orders.filter(order => order.userId === userId)
      logger.logBusinessEvent('user_orders_fetch_success', {
        userId,
        orderCount: userOrders.length,
        source: 'memory'
      })
      return NextResponse.json({ orders: userOrders })
    }

    logger.logBusinessEvent('all_orders_fetch_success', {
      orderCount: orders.length,
      source: 'memory'
    })
    return NextResponse.json({ orders })
})

// POST /api/orders - Create new order
export const POST = withErrorHandler(async (request: NextRequest) => {
    const orderData = await request.json()

    logger.logBusinessEvent('order_creation_attempt', {
      orderType: orderData.orderType,
      itemCount: orderData.items?.length || 0,
      userId: orderData.userId
    })

    // Validate required fields
    if (!orderData.items || orderData.items.length === 0) {
      logger.logBusinessEvent('order_validation_failed', {
        reason: 'no_items',
        userId: orderData.userId
      })
      return NextResponse.json(
        { error: 'Order must contain at least one item' },
        { status: 400 }
      )
    }

    // Validate contact information (required for all orders)
    if (!orderData.contactInfo?.email || !orderData.contactInfo?.phone) {
      logger.logBusinessEvent('order_validation_failed', {
        reason: 'missing_contact_info',
        userId: orderData.userId
      })
      return NextResponse.json(
        { error: 'Contact information is required' },
        { status: 400 }
      )
    }

    if (orderData.orderType === 'delivery' && !orderData.deliveryAddress) {
      logger.logBusinessEvent('order_validation_failed', {
        reason: 'missing_delivery_address',
        userId: orderData.userId
      })
      return NextResponse.json(
        { error: 'Delivery address is required for delivery orders' },
        { status: 400 }
      )
    }

    if (orderData.orderType === 'pickup' && !orderData.pickupLocation) {
      logger.logBusinessEvent('order_validation_failed', {
        reason: 'missing_pickup_location',
        userId: orderData.userId
      })
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
    try {
      const orderDoc = {
        ...newOrder,
        createdAt: new Date(newOrder.createdAt),
        updatedAt: new Date(newOrder.updatedAt)
      }
      
      await adb.collection(ORDERS_COLLECTION).add(orderDoc)
      logger.logBusinessEvent('order_created_firebase', {
        orderId: newOrder.id,
        orderType: newOrder.orderType,
        total: newOrder.total,
        userId: newOrder.userId
      })
    } catch (firebaseError) {
      logger.error('Failed to save order to Firebase, using fallback', {
        error: firebaseError,
        orderId: newOrder.id,
        userId: newOrder.userId
      })
      // Add to in-memory storage as fallback
      orders.unshift(newOrder)
      logger.logBusinessEvent('order_created_memory', {
        orderId: newOrder.id,
        orderType: newOrder.orderType,
        total: newOrder.total,
        userId: newOrder.userId
      })
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

    logger.logBusinessEvent('order_creation_success', {
      orderId: newOrder.id,
      orderType: newOrder.orderType,
      total: newOrder.total,
      userId: newOrder.userId,
      itemCount: newOrder.items.length
    })

    return NextResponse.json(
      { 
        message: 'Order created successfully',
        order: newOrder
      },
      { status: 201 }
    )
})

// PUT /api/orders - Update order status
export const PUT = withErrorHandler(async (request: NextRequest) => {
    const { orderId, status, estimatedTime } = await request.json()

    logger.logBusinessEvent('order_update_attempt', {
      orderId,
      newStatus: status,
      estimatedTime
    })

    if (!orderId || !status) {
      logger.logBusinessEvent('order_update_validation_failed', {
        reason: 'missing_required_fields',
        orderId,
        status
      })
      return NextResponse.json(
        { error: 'Order ID and status are required' },
        { status: 400 }
      )
    }

    let updatedOrder: Order | null = null

    // Try Firebase first
    try {
      const querySnapshot = await adb.collection(ORDERS_COLLECTION)
        .where('id', '==', orderId)
        .get()
      
      if (!querySnapshot.empty) {
        const orderDoc = querySnapshot.docs[0]
        const updateData = {
          status: status as OrderStatus,
          estimatedTime,
          updatedAt: new Date()
        }
        
        await orderDoc.ref.update(updateData)
        
        // Get updated order
        const updatedData = { ...orderDoc.data(), ...updateData }
        updatedOrder = {
          ...updatedData,
          createdAt: updatedData.createdAt.toDate(),
          updatedAt: updatedData.updatedAt.toDate()
        } as Order
        
        logger.logBusinessEvent('order_updated_firebase', {
          orderId,
          newStatus: status,
          estimatedTime
        })
      }
    } catch (firebaseError) {
      logger.error('Failed to update order in Firebase, using fallback', {
        error: firebaseError,
        orderId,
        status
      })
    }

    // Fallback to in-memory storage if Firebase failed or not configured
    if (!updatedOrder) {
      const orderIndex = orders.findIndex(order => order.id === orderId)
      if (orderIndex === -1) {
        logger.logBusinessEvent('order_update_failed', {
          reason: 'order_not_found',
          orderId
        })
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
      logger.logBusinessEvent('order_updated_memory', {
        orderId,
        newStatus: status,
        estimatedTime
      })
    }

    logger.logBusinessEvent('order_update_success', {
      orderId,
      newStatus: status,
      previousStatus: updatedOrder?.status
    })

    return NextResponse.json({
      message: 'Order updated successfully',
      order: updatedOrder
    })
})

// DELETE /api/orders - Cancel order
export const DELETE = withErrorHandler(async (request: NextRequest) => {
    const { searchParams } = new URL(request.url)
    const orderId = searchParams.get('orderId')

    logger.logBusinessEvent('order_cancellation_attempt', { orderId })

    if (!orderId) {
      logger.logBusinessEvent('order_cancellation_validation_failed', {
        reason: 'missing_order_id'
      })
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    let cancelledOrder: Order | null = null

    // Try Firebase first
    try {
      const querySnapshot = await adb.collection(ORDERS_COLLECTION)
        .where('id', '==', orderId)
        .get()
      
      if (!querySnapshot.empty) {
        const orderDoc = querySnapshot.docs[0]
        const orderData = orderDoc.data() as Order
        
        // Check if order can be cancelled
        if (['delivered', 'completed', 'cancelled'].includes(orderData.status)) {
          logger.logBusinessEvent('order_cancellation_failed', {
            reason: 'invalid_status',
            orderId,
            currentStatus: orderData.status
          })
          return NextResponse.json(
            { error: 'Order cannot be cancelled' },
            { status: 400 }
          )
        }
        
        const updateData = {
          status: 'cancelled' as OrderStatus,
          updatedAt: new Date()
        }
        
        await orderDoc.ref.update(updateData)
        
        cancelledOrder = {
          ...orderData,
          status: 'cancelled' as OrderStatus,
          updatedAt: new Date()
        }
        
        logger.logBusinessEvent('order_cancelled_firebase', {
          orderId,
          previousStatus: orderData.status
        })
      }
    } catch (firebaseError) {
      logger.error('Failed to cancel order in Firebase, using fallback', {
        error: firebaseError,
        orderId
      })
    }

    // Fallback to in-memory storage if Firebase failed or not configured
    if (!cancelledOrder) {
      const orderIndex = orders.findIndex(order => order.id === orderId)
      if (orderIndex === -1) {
        logger.logBusinessEvent('order_cancellation_failed', {
          reason: 'order_not_found',
          orderId
        })
        return NextResponse.json(
          { error: 'Order not found' },
          { status: 404 }
        )
      }

      // Check if order can be cancelled
      const order = orders[orderIndex]
      if (['delivered', 'completed', 'cancelled'].includes(order.status)) {
        logger.logBusinessEvent('order_cancellation_failed', {
          reason: 'invalid_status',
          orderId,
          currentStatus: order.status
        })
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
      logger.logBusinessEvent('order_cancelled_memory', {
        orderId,
        previousStatus: order.status
      })
    }

    logger.logBusinessEvent('order_cancellation_success', {
      orderId,
      previousStatus: cancelledOrder?.status
    })

    return NextResponse.json({
      message: 'Order cancelled successfully',
      order: cancelledOrder
    })
})