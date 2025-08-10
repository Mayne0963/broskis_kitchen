// Guest Order Tracking Utilities

interface GuestOrder {
  orderId: string
  email: string
  phone: string
  createdAt: string
  total: number
  status: string
}

const GUEST_ORDERS_KEY = 'broski_guest_orders'

export const guestOrderUtils = {
  // Save a guest order to session storage
  saveGuestOrder: (orderData: {
    orderId: string
    email: string
    phone: string
    total: number
    status: string
  }) => {
    try {
      const existingOrders = guestOrderUtils.getGuestOrders()
      const newOrder: GuestOrder = {
        ...orderData,
        createdAt: new Date().toISOString()
      }
      
      const updatedOrders = [newOrder, ...existingOrders.slice(0, 9)] // Keep last 10 orders
      sessionStorage.setItem(GUEST_ORDERS_KEY, JSON.stringify(updatedOrders))
      
      return newOrder
    } catch (error) {
      console.error('Failed to save guest order:', error)
      return null
    }
  },

  // Get all guest orders from session storage
  getGuestOrders: (): GuestOrder[] => {
    try {
      const orders = sessionStorage.getItem(GUEST_ORDERS_KEY)
      return orders ? JSON.parse(orders) : []
    } catch (error) {
      console.error('Failed to get guest orders:', error)
      return []
    }
  },

  // Get a specific guest order by ID
  getGuestOrder: (orderId: string): GuestOrder | null => {
    try {
      const orders = guestOrderUtils.getGuestOrders()
      return orders.find(order => order.orderId === orderId) || null
    } catch (error) {
      console.error('Failed to get guest order:', error)
      return null
    }
  },

  // Update guest order status
  updateGuestOrderStatus: (orderId: string, status: string): boolean => {
    try {
      const orders = guestOrderUtils.getGuestOrders()
      const orderIndex = orders.findIndex(order => order.orderId === orderId)
      
      if (orderIndex !== -1) {
        orders[orderIndex].status = status
        sessionStorage.setItem(GUEST_ORDERS_KEY, JSON.stringify(orders))
        return true
      }
      
      return false
    } catch (error) {
      console.error('Failed to update guest order status:', error)
      return false
    }
  },

  // Clear all guest orders (useful for cleanup)
  clearGuestOrders: () => {
    try {
      sessionStorage.removeItem(GUEST_ORDERS_KEY)
    } catch (error) {
      console.error('Failed to clear guest orders:', error)
    }
  },

  // Check if running in browser environment
  isClient: () => typeof window !== 'undefined' && typeof sessionStorage !== 'undefined'
}

export default guestOrderUtils