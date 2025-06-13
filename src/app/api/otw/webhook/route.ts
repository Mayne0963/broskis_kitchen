import { NextRequest, NextResponse } from 'next/server'
import { OrderStatus } from '@/types/order'

// OTW Webhook Event Types
interface OTWWebhookEvent {
  event_type: 'order_accepted' | 'driver_assigned' | 'driver_pickup' | 'order_delivered' | 'order_cancelled'
  order_id: string // OTW order ID
  restaurant_order_id: string // Broski's order ID
  timestamp: string
  data: {
    driver?: {
      name: string
      phone: string
      vehicle: string
      location?: { lat: number; lng: number }
    }
    estimated_delivery?: string
    delivery_time?: string
    cancellation_reason?: string
  }
}

// Webhook signature verification
function verifyWebhookSignature(payload: string, signature: string): boolean {
  const webhookSecret = process.env.OTW_WEBHOOK_SECRET
  if (!webhookSecret) {
    console.warn('OTW webhook secret not configured')
    return false
  }

  // In a real implementation, you would verify the signature using HMAC
  // For now, we'll do a simple check
  return signature === `sha256=${webhookSecret}`
}

// Map OTW status to Broski's order status
function mapOTWStatusToBroskiStatus(otwEventType: string): OrderStatus {
  switch (otwEventType) {
    case 'order_accepted':
      return 'confirmed'
    case 'driver_assigned':
      return 'preparing'
    case 'driver_pickup':
      return 'out_for_delivery'
    case 'order_delivered':
      return 'delivered'
    case 'order_cancelled':
      return 'cancelled'
    default:
      return 'pending'
  }
}

// Update order status in our system
async function updateOrderStatus(orderId: string, status: OrderStatus, additionalData?: any) {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/orders`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        orderId,
        status,
        ...additionalData
      })
    })

    if (!response.ok) {
      throw new Error(`Failed to update order status: ${response.status}`)
    }

    console.log(`Order ${orderId} status updated to ${status}`)
  } catch (error) {
    console.error('Failed to update order status:', error)
    throw error
  }
}

// Store driver information
async function storeDriverInfo(orderId: string, driverInfo: any) {
  try {
    // In a real app, you would store this in a database
    // For now, we'll just log it
    console.log(`Driver assigned to order ${orderId}:`, driverInfo)
    
    // You could also send a notification to the customer here
    // await sendCustomerNotification(orderId, 'driver_assigned', driverInfo)
  } catch (error) {
    console.error('Failed to store driver info:', error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const signature = request.headers.get('x-otw-signature')
    const payload = await request.text()

    // Verify webhook signature
    if (!signature || !verifyWebhookSignature(payload, signature)) {
      console.error('Invalid webhook signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    const event: OTWWebhookEvent = JSON.parse(payload)
    
    console.log('Received OTW webhook:', {
      event_type: event.event_type,
      restaurant_order_id: event.restaurant_order_id,
      timestamp: event.timestamp
    })

    // Map OTW status to our order status
    const newStatus = mapOTWStatusToBroskiStatus(event.event_type)
    
    // Prepare additional data based on event type
    const additionalData: any = {}
    
    switch (event.event_type) {
      case 'driver_assigned':
        if (event.data.driver) {
          additionalData.driverInfo = event.data.driver
          await storeDriverInfo(event.restaurant_order_id, event.data.driver)
        }
        if (event.data.estimated_delivery) {
          additionalData.estimatedTime = event.data.estimated_delivery
        }
        break
        
      case 'driver_pickup':
        additionalData.estimatedTime = event.data.estimated_delivery
        break
        
      case 'order_delivered':
        additionalData.deliveredAt = event.data.delivery_time || new Date().toISOString()
        break
        
      case 'order_cancelled':
        additionalData.cancellationReason = event.data.cancellation_reason
        break
    }

    // Update order status in our system
    await updateOrderStatus(event.restaurant_order_id, newStatus, additionalData)

    // Send success response to OTW
    return NextResponse.json({
      success: true,
      message: 'Webhook processed successfully',
      order_id: event.restaurant_order_id,
      status_updated: newStatus
    })

  } catch (error) {
    console.error('Error processing OTW webhook:', error)
    
    return NextResponse.json(
      { 
        error: 'Failed to process webhook',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// Handle GET requests for webhook verification
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const challenge = searchParams.get('challenge')
  
  // OTW webhook verification challenge
  if (challenge) {
    return NextResponse.json({ challenge })
  }
  
  return NextResponse.json({ message: 'OTW webhook endpoint is active' })
}