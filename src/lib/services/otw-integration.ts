import { Order } from '@/types/order'

// OTW API Configuration
const OTW_API_BASE_URL = process.env.OTW_API_URL || 'https://api.otw-delivery.com'
const OTW_API_KEY = process.env.OTW_API_KEY
const OTW_RESTAURANT_ID = process.env.OTW_RESTAURANT_ID

// OTW Order Interface
interface OTWOrder {
  restaurant_id: string
  order_id: string
  customer: {
    name: string
    phone: string
    email: string
  }
  delivery_address: {
    street: string
    apartment?: string
    city: string
    state: string
    zip_code: string
    instructions?: string
  }
  items: Array<{
    name: string
    quantity: number
    price: number
    special_instructions?: string
  }>
  totals: {
    subtotal: number
    tax: number
    delivery_fee: number
    total: number
  }
  estimated_prep_time: number // in minutes
  special_instructions?: string
  payment_method: string
}

// OTW Response Interface
interface OTWResponse {
  success: boolean
  otw_order_id?: string
  estimated_delivery_time?: string
  driver_info?: {
    name: string
    phone: string
    vehicle: string
  }
  tracking_url?: string
  error?: string
}

/**
 * Convert Broski's order to OTW format
 */
function convertToOTWOrder(order: Order): OTWOrder {
  if (!order.deliveryAddress) {
    throw new Error('Delivery address is required for OTW integration')
  }

  return {
    restaurant_id: OTW_RESTAURANT_ID || 'broskis-kitchen',
    order_id: order.id,
    customer: {
      name: `${order.deliveryAddress.firstName} ${order.deliveryAddress.lastName}`,
      phone: order.contactInfo.phone,
      email: order.contactInfo.email
    },
    delivery_address: {
      street: order.deliveryAddress.street,
      apartment: order.deliveryAddress.apartment,
      city: order.deliveryAddress.city,
      state: order.deliveryAddress.state,
      zip_code: order.deliveryAddress.zipCode,
      instructions: order.deliveryAddress.deliveryInstructions
    },
    items: order.items.map(item => ({
      name: item.name,
      quantity: item.quantity,
      price: item.price,
      special_instructions: item.customizations ? 
        Object.values(item.customizations)
          .flat()
          .map(c => c.name)
          .join(', ') : undefined
    })),
    totals: {
      subtotal: order.subtotal,
      tax: order.tax,
      delivery_fee: order.deliveryFee,
      total: order.total
    },
    estimated_prep_time: 25, // Default 25 minutes prep time
    special_instructions: order.specialInstructions,
    payment_method: order.paymentInfo?.cardNumber ? 'card' : 'cash'
  }
}

/**
 * Submit order to OTW delivery service
 */
export async function submitOrderToOTW(order: Order): Promise<OTWResponse> {
  try {
    // Only process delivery orders
    if (order.orderType !== 'delivery') {
      throw new Error('OTW integration only supports delivery orders')
    }

    // Check if OTW integration is configured
    if (!OTW_API_KEY || !OTW_RESTAURANT_ID) {
      console.warn('OTW integration not configured - skipping order submission')
      return {
        success: false,
        error: 'OTW integration not configured'
      }
    }

    const otwOrder = convertToOTWOrder(order)

    const response = await fetch(`${OTW_API_BASE_URL}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OTW_API_KEY}`,
        'X-Restaurant-ID': OTW_RESTAURANT_ID
      },
      body: JSON.stringify(otwOrder)
    })

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(`OTW API error: ${response.status} - ${errorData.message || 'Unknown error'}`)
    }

    const result = await response.json()
    
    console.log('Order successfully submitted to OTW:', {
      broskis_order_id: order.id,
      otw_order_id: result.otw_order_id
    })

    return {
      success: true,
      otw_order_id: result.otw_order_id,
      estimated_delivery_time: result.estimated_delivery_time,
      driver_info: result.driver_info,
      tracking_url: result.tracking_url
    }

  } catch (error) {
    console.error('Failed to submit order to OTW:', error)
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }
  }
}

/**
 * Get order status from OTW
 */
export async function getOTWOrderStatus(otwOrderId: string): Promise<{
  status: string
  driver_location?: { lat: number; lng: number }
  estimated_arrival?: string
  driver_info?: { name: string; phone: string; vehicle: string }
}> {
  try {
    if (!OTW_API_KEY) {
      throw new Error('OTW API key not configured')
    }

    const response = await fetch(`${OTW_API_BASE_URL}/orders/${otwOrderId}/status`, {
      headers: {
        'Authorization': `Bearer ${OTW_API_KEY}`,
        'X-Restaurant-ID': OTW_RESTAURANT_ID || 'broskis-kitchen'
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to get OTW order status: ${response.status}`)
    }

    return await response.json()
  } catch (error) {
    console.error('Failed to get OTW order status:', error)
    throw error
  }
}

/**
 * Cancel order with OTW
 */
export async function cancelOTWOrder(otwOrderId: string, reason: string): Promise<boolean> {
  try {
    if (!OTW_API_KEY) {
      throw new Error('OTW API key not configured')
    }

    const response = await fetch(`${OTW_API_BASE_URL}/orders/${otwOrderId}/cancel`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OTW_API_KEY}`,
        'X-Restaurant-ID': OTW_RESTAURANT_ID || 'broskis-kitchen'
      },
      body: JSON.stringify({ reason })
    })

    return response.ok
  } catch (error) {
    console.error('Failed to cancel OTW order:', error)
    return false
  }
}

/**
 * Update order ready status with OTW
 */
export async function notifyOTWOrderReady(otwOrderId: string): Promise<boolean> {
  try {
    if (!OTW_API_KEY) {
      throw new Error('OTW API key not configured')
    }

    const response = await fetch(`${OTW_API_BASE_URL}/orders/${otwOrderId}/ready`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OTW_API_KEY}`,
        'X-Restaurant-ID': OTW_RESTAURANT_ID || 'broskis-kitchen'
      }
    })

    return response.ok
  } catch (error) {
    console.error('Failed to notify OTW order ready:', error)
    return false
  }
}