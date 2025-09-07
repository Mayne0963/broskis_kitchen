import { OrderStatus } from '@/types/order'

// Valid status transitions
export const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  'pending': ['confirmed', 'cancelled'],
  'confirmed': ['preparing', 'cancelled'],
  'preparing': ['ready', 'cancelled'],
  'ready': ['out-for-delivery', 'completed', 'cancelled'], // completed for pickup orders
  'out-for-delivery': ['delivered', 'cancelled'],
  'delivered': ['completed'],
  'completed': [], // Final state
  'cancelled': [] // Final state
}

// Role permissions for status updates
export const ROLE_PERMISSIONS: Record<string, OrderStatus[]> = {
  'admin': ['pending', 'confirmed', 'preparing', 'ready', 'out-for-delivery', 'delivered', 'completed', 'cancelled'],
  'kitchen': ['confirmed', 'preparing', 'ready'],
  'customer': ['cancelled'] // Only allow cancellation
}

// Status display information
export const STATUS_INFO: Record<OrderStatus, {
  label: string
  description: string
  color: string
  icon: string
}> = {
  'pending': {
    label: 'Pending',
    description: 'Order received, awaiting confirmation',
    color: 'yellow',
    icon: 'Clock'
  },
  'confirmed': {
    label: 'Confirmed',
    description: 'Order confirmed, preparing to cook',
    color: 'blue',
    icon: 'CheckCircle'
  },
  'preparing': {
    label: 'Preparing',
    description: 'Food is being prepared',
    color: 'orange',
    icon: 'ChefHat'
  },
  'ready': {
    label: 'Ready',
    description: 'Order is ready for pickup/delivery',
    color: 'green',
    icon: 'Package'
  },
  'out-for-delivery': {
    label: 'Out for Delivery',
    description: 'Order is on the way',
    color: 'purple',
    icon: 'Truck'
  },
  'delivered': {
    label: 'Delivered',
    description: 'Order has been delivered',
    color: 'green',
    icon: 'MapPin'
  },
  'completed': {
    label: 'Completed',
    description: 'Order completed successfully',
    color: 'green',
    icon: 'CheckCircle2'
  },
  'cancelled': {
    label: 'Cancelled',
    description: 'Order has been cancelled',
    color: 'red',
    icon: 'XCircle'
  }
}

/**
 * Validate if a status transition is allowed
 */
export function isValidStatusTransition(currentStatus: OrderStatus, newStatus: OrderStatus): boolean {
  return STATUS_TRANSITIONS[currentStatus]?.includes(newStatus) || false
}

/**
 * Check if user role can update to specific status
 */
export function canUserUpdateStatus(userRole: string, newStatus: OrderStatus): boolean {
  const allowedStatuses = ROLE_PERMISSIONS[userRole] || []
  return allowedStatuses.includes(newStatus)
}

/**
 * Validate status update based on order type
 */
export function validateStatusForOrderType(orderType: 'delivery' | 'pickup', newStatus: OrderStatus): boolean {
  // Pickup orders can't be 'out-for-delivery' or 'delivered'
  if (orderType === 'pickup' && (newStatus === 'out-for-delivery' || newStatus === 'delivered')) {
    return false
  }
  
  // Delivery orders should go through delivery flow
  if (orderType === 'delivery' && newStatus === 'completed') {
    // For delivery, should be 'delivered' first, then 'completed'
    return false
  }
  
  return true
}

/**
 * Get next possible statuses for current status
 */
export function getNextStatuses(currentStatus: OrderStatus, orderType: 'delivery' | 'pickup'): OrderStatus[] {
  const possibleStatuses = STATUS_TRANSITIONS[currentStatus] || []
  
  return possibleStatuses.filter(status => 
    validateStatusForOrderType(orderType, status)
  )
}

/**
 * Get next possible statuses for user role
 */
export function getNextStatusesForRole(
  currentStatus: OrderStatus, 
  orderType: 'delivery' | 'pickup', 
  userRole: string
): OrderStatus[] {
  const nextStatuses = getNextStatuses(currentStatus, orderType)
  
  return nextStatuses.filter(status => 
    canUserUpdateStatus(userRole, status)
  )
}

/**
 * Calculate estimated time based on status and order type
 */
export function calculateEstimatedTime(status: OrderStatus, orderType: 'delivery' | 'pickup'): string | undefined {
  const now = new Date()
  let minutes = 0
  
  switch (status) {
    case 'confirmed':
      minutes = orderType === 'pickup' ? 15 : 25
      break
    case 'preparing':
      minutes = orderType === 'pickup' ? 10 : 20
      break
    case 'ready':
      minutes = orderType === 'pickup' ? 0 : 15 // Ready for pickup or ready for delivery
      break
    case 'out-for-delivery':
      minutes = 20
      break
    default:
      return undefined
  }
  
  if (minutes > 0) {
    const estimatedTime = new Date(now.getTime() + minutes * 60000)
    return estimatedTime.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit'
    })
  }
  
  return undefined
}

/**
 * Check if order can be cancelled
 */
export function canCancelOrder(currentStatus: OrderStatus): boolean {
  return !['delivered', 'completed', 'cancelled'].includes(currentStatus)
}

/**
 * Get status color class for UI
 */
export function getStatusColorClass(status: OrderStatus): string {
  const colorMap: Record<string, string> = {
    yellow: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    blue: 'bg-blue-100 text-blue-800 border-blue-200',
    orange: 'bg-orange-100 text-orange-800 border-orange-200',
    green: 'bg-green-100 text-green-800 border-green-200',
    purple: 'bg-purple-100 text-purple-800 border-purple-200',
    red: 'bg-red-100 text-red-800 border-red-200'
  }
  
  const color = STATUS_INFO[status]?.color || 'gray'
  return colorMap[color] || 'bg-gray-100 text-gray-800 border-gray-200'
}

/**
 * Get status progress percentage
 */
export function getStatusProgress(status: OrderStatus, orderType: 'delivery' | 'pickup'): number {
  const deliveryFlow = ['pending', 'confirmed', 'preparing', 'ready', 'out-for-delivery', 'delivered', 'completed']
  const pickupFlow = ['pending', 'confirmed', 'preparing', 'ready', 'completed']
  
  const flow = orderType === 'delivery' ? deliveryFlow : pickupFlow
  const currentIndex = flow.indexOf(status)
  
  if (currentIndex === -1 || status === 'cancelled') {
    return 0
  }
  
  return Math.round((currentIndex / (flow.length - 1)) * 100)
}

/**
 * Validate status update request
 */
export function validateStatusUpdate({
  currentStatus,
  newStatus,
  orderType,
  userRole
}: {
  currentStatus: OrderStatus
  newStatus: OrderStatus
  orderType: 'delivery' | 'pickup'
  userRole: string
}): { valid: boolean; error?: string } {
  // Check if status transition is valid
  if (!isValidStatusTransition(currentStatus, newStatus)) {
    return {
      valid: false,
      error: `Invalid status transition from '${currentStatus}' to '${newStatus}'`
    }
  }
  
  // Check if status is valid for order type
  if (!validateStatusForOrderType(orderType, newStatus)) {
    return {
      valid: false,
      error: `Status '${newStatus}' is not valid for ${orderType} orders`
    }
  }
  
  // Check role permissions
  if (!canUserUpdateStatus(userRole, newStatus)) {
    return {
      valid: false,
      error: `Role '${userRole}' cannot update status to '${newStatus}'`
    }
  }
  
  // Check if order can be cancelled
  if (newStatus === 'cancelled' && !canCancelOrder(currentStatus)) {
    return {
      valid: false,
      error: 'Cannot cancel completed or delivered orders'
    }
  }
  
  return { valid: true }
}