import { NextRequest, NextResponse } from 'next/server'
import { Order, OrderStatus } from '@/types/order'

// In a real application, this would connect to a database
// For demo purposes, we'll use in-memory storage
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

    if (orderId) {
      // Get specific order
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
      // Get user orders
      const userOrders = orders.filter(order => order.userId === userId)
      return NextResponse.json({ orders: userOrders })
    }

    // Get all orders
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
      userId: orderData.userId,
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

    // Add to orders array
    orders.unshift(newOrder)

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

    const orderIndex = orders.findIndex(order => order.id === orderId)
    if (orderIndex === -1) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Update order
    orders[orderIndex] = {
      ...orders[orderIndex],
      status: status as OrderStatus,
      estimatedTime,
      updatedAt: new Date()
    }

    return NextResponse.json({
      message: 'Order updated successfully',
      order: orders[orderIndex]
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

    return NextResponse.json({
      message: 'Order cancelled successfully',
      order: orders[orderIndex]
    })
  } catch (error) {
    console.error('Error cancelling order:', error)
    return NextResponse.json(
      { error: 'Failed to cancel order' },
      { status: 500 }
    )
  }
}