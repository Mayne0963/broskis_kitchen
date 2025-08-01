import { db, isFirebaseConfigured } from './firebase'
import { 
  collection, 
  addDoc, 
  doc, 
  updateDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  Timestamp
} from 'firebase/firestore'
import { Order, OrderStatus } from '@/types/order'
import { submitOrderToOTW, getOTWOrderStatus } from './otw-integration'

// Collection name for orders
const ORDERS_COLLECTION = 'orders'

// Local storage key for orders fallback
const LOCAL_ORDERS_KEY = 'broskis_orders'

/**
 * Generate a unique order ID
 */
export const generateOrderId = (): string => {
  const timestamp = Date.now().toString(36)
  const randomStr = Math.random().toString(36).substring(2, 8)
  return `ORD-${timestamp}-${randomStr}`.toUpperCase()
}

/**
 * Calculate delivery fee based on order total and type
 */
export const calculateDeliveryFee = (subtotal: number, orderType: 'delivery' | 'pickup'): number => {
  if (orderType === 'pickup') return 0
  if (subtotal >= 50) return 0 // Free delivery over $50
  return 4.99 // Standard delivery fee
}

/**
 * Save order to Firebase or localStorage as fallback
 */
export const saveOrder = async (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> => {
  const orderId = generateOrderId()
  const deliveryFee = calculateDeliveryFee(orderData.subtotal, orderData.orderType)
  
  const newOrder: Order = {
    ...orderData,
    id: orderId,
    deliveryFee,
    total: orderData.subtotal + orderData.tax + deliveryFee - (orderData.couponDiscount || 0),
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date()
  }

  try {
    if (isFirebaseConfigured && db) {
      // Save to Firebase
      const orderDoc = {
        ...newOrder,
        createdAt: Timestamp.fromDate(newOrder.createdAt),
        updatedAt: Timestamp.fromDate(newOrder.updatedAt)
      }
      
      const docRef = await addDoc(collection(db, ORDERS_COLLECTION), orderDoc)
      console.log('Order saved to Firebase with ID:', docRef.id)
      
      // Submit to OTW if it's a delivery order
      if (newOrder.orderType === 'delivery') {
        try {
          const otwResult = await submitOrderToOTW(newOrder)
          if (otwResult.success && otwResult.otw_order_id) {
            // Update order with OTW ID
            await updateDoc(doc(db, ORDERS_COLLECTION, docRef.id), {
              otwOrderId: otwResult.otw_order_id,
              updatedAt: Timestamp.now()
            })
            console.log('Order submitted to OTW with ID:', otwResult.otw_order_id)
          }
        } catch (otwError) {
          console.warn('Failed to submit to OTW, order saved without delivery tracking:', otwError)
        }
      }
      
      return orderId
    } else {
      throw new Error('Firebase not configured')
    }
  } catch (error) {
    console.warn('Failed to save to Firebase, using localStorage:', error)
    
    // Fallback to localStorage
    if (typeof window !== 'undefined') {
      const savedOrders = JSON.parse(localStorage.getItem(LOCAL_ORDERS_KEY) || '[]')
      savedOrders.unshift(newOrder)
      localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(savedOrders))
      console.log('Order saved to localStorage with ID:', orderId)
    }
    
    return orderId
  }
}

/**
 * Get order by ID from Firebase or localStorage
 */
export const getOrderById = async (orderId: string): Promise<Order | null> => {
  try {
    if (isFirebaseConfigured && db) {
      // Search Firebase
      const q = query(
        collection(db, ORDERS_COLLECTION),
        where('id', '==', orderId)
      )
      
      const querySnapshot = await getDocs(q)
      
      if (!querySnapshot.empty) {
        const doc = querySnapshot.docs[0]
        const data = doc.data()
        return {
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate()
        } as Order
      }
    }
  } catch (error) {
    console.warn('Failed to get order from Firebase, checking localStorage:', error)
  }
  
  // Fallback to localStorage
  if (typeof window !== 'undefined') {
    const savedOrders = JSON.parse(localStorage.getItem(LOCAL_ORDERS_KEY) || '[]')
    const order = savedOrders.find((o: Order) => o.id === orderId)
    if (order) {
      return {
        ...order,
        createdAt: new Date(order.createdAt),
        updatedAt: new Date(order.updatedAt)
      }
    }
  }
  
  return null
}

/**
 * Get all orders for a user from Firebase or localStorage
 */
export const getUserOrders = async (userId?: string): Promise<Order[]> => {
  const targetUserId = userId || 'anonymous'
  
  try {
    if (isFirebaseConfigured && db) {
      // Get from Firebase
      const q = query(
        collection(db, ORDERS_COLLECTION),
        where('userId', '==', targetUserId),
        orderBy('createdAt', 'desc')
      )
      
      const querySnapshot = await getDocs(q)
      const orders: Order[] = []
      
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        orders.push({
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate()
        } as Order)
      })
      
      return orders
    }
  } catch (error) {
    console.warn('Failed to get orders from Firebase, using localStorage:', error)
  }
  
  // Fallback to localStorage
  if (typeof window !== 'undefined') {
    const savedOrders = JSON.parse(localStorage.getItem(LOCAL_ORDERS_KEY) || '[]')
    return savedOrders
      .filter((order: Order) => order.userId === targetUserId)
      .map((order: Order) => ({
        ...order,
        createdAt: new Date(order.createdAt),
        updatedAt: new Date(order.updatedAt)
      }))
      .sort((a: Order, b: Order) => b.createdAt.getTime() - a.createdAt.getTime())
  }
  
  return []
}

/**
 * Update order status in Firebase or localStorage
 */
export const updateOrderStatus = async (orderId: string, status: OrderStatus): Promise<void> => {
  try {
    if (isFirebaseConfigured && db) {
      // Update in Firebase
      const q = query(
        collection(db, ORDERS_COLLECTION),
        where('id', '==', orderId)
      )
      
      const querySnapshot = await getDocs(q)
      
      if (!querySnapshot.empty) {
        const docRef = querySnapshot.docs[0].ref
        await updateDoc(docRef, {
          status,
          updatedAt: Timestamp.now()
        })
        console.log('Order status updated in Firebase:', orderId, status)
        return
      }
    }
  } catch (error) {
    console.warn('Failed to update order in Firebase, updating localStorage:', error)
  }
  
  // Fallback to localStorage
  if (typeof window !== 'undefined') {
    const savedOrders = JSON.parse(localStorage.getItem(LOCAL_ORDERS_KEY) || '[]')
    const orderIndex = savedOrders.findIndex((o: Order) => o.id === orderId)
    
    if (orderIndex !== -1) {
      savedOrders[orderIndex].status = status
      savedOrders[orderIndex].updatedAt = new Date()
      localStorage.setItem(LOCAL_ORDERS_KEY, JSON.stringify(savedOrders))
      console.log('Order status updated in localStorage:', orderId, status)
    }
  }
}

/**
 * Cancel an order
 */
export const cancelOrder = async (orderId: string): Promise<void> => {
  const order = await getOrderById(orderId)
  
  if (!order) {
    throw new Error('Order not found')
  }
  
  // Cancel with OTW if it's a delivery order with OTW ID
  if (order.orderType === 'delivery' && order.otwOrderId) {
    try {
      await cancelOTWOrder(order.otwOrderId, 'Customer cancellation')
    } catch (error) {
      console.warn('Failed to cancel with OTW:', error)
    }
  }
  
  // Update order status to cancelled
  await updateOrderStatus(orderId, 'cancelled')
}

/**
 * Track order status (includes OTW tracking for delivery orders)
 */
export const trackOrder = async (orderId: string): Promise<Order | null> => {
  const order = await getOrderById(orderId)
  
  if (!order) {
    return null
  }
  
  // If it's a delivery order with OTW tracking, get latest status
  if (order.orderType === 'delivery' && order.otwOrderId) {
    try {
      const otwStatus = await getOTWOrderStatus(order.otwOrderId)
      if (otwStatus.status) {
        // Map OTW status to our order status
        let newStatus: OrderStatus = order.status
        
        switch (otwStatus.status) {
          case 'pending':
            newStatus = 'pending'
            break
          case 'confirmed':
            newStatus = 'confirmed'
            break
          case 'preparing':
            newStatus = 'preparing'
            break
          case 'ready':
            newStatus = 'ready'
            break
          case 'out_for_delivery':
            newStatus = 'out-for-delivery'
            break
          case 'delivered':
            newStatus = 'delivered'
            break
          case 'cancelled':
            newStatus = 'cancelled'
            break
        }
        
        // Update status if it changed
        if (newStatus !== order.status) {
          await updateOrderStatus(orderId, newStatus)
          order.status = newStatus
        }
      }
    } catch (error) {
      console.warn('Failed to get OTW status:', error)
    }
  }
  
  return order
}

/**
 * Get all orders (admin function)
 */
export const getAllOrders = async (): Promise<Order[]> => {
  try {
    if (isFirebaseConfigured && db) {
      const q = query(
        collection(db, ORDERS_COLLECTION),
        orderBy('createdAt', 'desc')
      )
      
      const querySnapshot = await getDocs(q)
      const orders: Order[] = []
      
      querySnapshot.forEach((doc) => {
        const data = doc.data()
        orders.push({
          ...data,
          createdAt: data.createdAt.toDate(),
          updatedAt: data.updatedAt.toDate()
        } as Order)
      })
      
      return orders
    }
  } catch (error) {
    console.warn('Failed to get all orders from Firebase:', error)
  }
  
  return []
}

// Import the cancelOTWOrder function

