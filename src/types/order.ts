export interface OrderItem {
  id: string
  name: string
  price: number
  quantity: number
  image?: string
  customizations?: {
    [categoryId: string]: CustomizationOption[]
  }
}

export interface CustomizationOption {
  id: string
  name: string
  price: number
}

export interface DeliveryAddress {
  firstName: string
  lastName: string
  street: string
  apartment?: string
  city: string
  state: string
  zipCode: string
  deliveryInstructions?: string
}

export interface PaymentInfo {
  cardNumber: string
  cardName: string
  expiryDate: string
  cvv: string
  // Add Stripe-specific fields
  stripePaymentIntentId?: string
  stripePaymentMethodId?: string
}

export interface Order {
  id: string
  userId?: string
  items: OrderItem[]
  subtotal: number
  tax: number
  deliveryFee: number
  total: number
  status: OrderStatus
  orderType: 'delivery' | 'pickup'
  deliveryAddress?: DeliveryAddress
  pickupLocation?: string
  contactInfo: {
    email: string
    phone: string
  }
  paymentInfo?: Partial<PaymentInfo>
  specialInstructions?: string
  estimatedTime?: string
  scheduledTime?: string
  createdAt: Date
  updatedAt: Date
  otwOrderId?: string
  driverInfo?: {
    name: string
    phone: string
    vehicle: string
    location?: { lat: number; lng: number }
  }
  // Add payment status
  paymentStatus?: 'pending' | 'processing' | 'succeeded' | 'failed' | 'canceled'
  stripePaymentIntentId?: string
  couponCode?: string
  couponDiscount?: number
}

export type OrderStatus = 
  | 'pending'
  | 'confirmed'
  | 'preparing'
  | 'ready'
  | 'out-for-delivery'
  | 'delivered'
  | 'completed'
  | 'cancelled'

export interface OrderContextType {
  currentOrder: Order | null
  orders: Order[]
  isLoading: boolean
  error: string | null
  createOrder: (orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>) => Promise<string>
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>
  getOrder: (orderId: string) => Promise<Order | null>
  getUserOrders: (userId?: string) => Promise<Order[]>
  cancelOrder: (orderId: string) => Promise<void>
  trackOrder: (orderId: string) => Promise<Order | null>
  clearCurrentOrder: () => void
}

export interface OrderFormData {
  // Contact Information
  email: string
  phone: string

  // Order Type
  orderType: 'delivery' | 'pickup'

  // Delivery Information (if delivery)
  deliveryAddress?: DeliveryAddress

  // Pickup Information (if pickup)
  pickupLocation?: string

  // Timing
  deliveryTime: 'asap' | 'scheduled'
  scheduledTime?: string

  // Payment
  paymentMethod: 'card' | 'cash'
  paymentInfo?: PaymentInfo

  // Additional
  specialInstructions?: string
  couponCode?: string
  couponDiscount?: number

}
