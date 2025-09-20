'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  Search, 
  Filter, 
  Clock, 
  CheckCircle, 
  Truck, 
  X,
  Eye,
  RefreshCw,
  AlertCircle,
  Package,
  ChefHat,
  MapPin
} from 'lucide-react'
import { toast } from 'sonner'
import { Order, OrderStatus } from '@/types/order'
import { db, isFirebaseConfigured } from '@/lib/services/firebase'
import { collection, query, orderBy, onSnapshot, doc, updateDoc, Timestamp } from 'firebase/firestore'
import { COLLECTIONS } from '@/lib/firebase/collections'
import OrderStatusUpdate from '@/components/orders/OrderStatusUpdate'
import { STATUS_INFO, getStatusColorClass } from '@/lib/utils/orderStatusValidation'
import { safeFetch } from '@/lib/utils/safeFetch'

interface OrdersTabProps {
  initialOrders?: Order[]
}

const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'pending':
        return AlertCircle
      case 'confirmed':
        return CheckCircle
      case 'preparing':
        return ChefHat
      case 'ready':
        return Package
      case 'out-for-delivery':
        return Truck
      case 'delivered':
        return MapPin
      case 'completed':
        return CheckCircle
      case 'cancelled':
        return X
      default:
        return AlertCircle
    }
  }

const formatTime = (date: Date) => {
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatDate = (date: Date) => {
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(amount)
}

export default function OrdersTab({ initialOrders = [] }: OrdersTabProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all')
  const [orderTypeFilter, setOrderTypeFilter] = useState<'all' | 'delivery' | 'pickup'>('all')
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Set up real-time Firebase listener
  useEffect(() => {
    if (!isFirebaseConfigured || !db) {
      setIsLoading(false)
      setOrders(initialOrders)
      return
    }

    const ordersRef = collection(db, COLLECTIONS.ORDERS)
    const q = query(ordersRef, orderBy('createdAt', 'desc'))

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const ordersData: Order[] = []
        snapshot.forEach((doc) => {
          const data = doc.data()
          ordersData.push({
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date()
          } as Order)
        })
        setOrders(ordersData)
        setIsLoading(false)
        setError(null)
      },
      (error) => {
        console.error('Error listening to orders:', error)
        setError('Failed to load orders')
        setIsLoading(false)
        // Fallback to initial orders
        setOrders(initialOrders)
      }
    )

    return () => unsubscribe()
  }, [initialOrders])

  // Filter orders based on search, status, order type, and date
  const filteredOrders = orders.filter(order => {
    const matchesSearch = 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.contactInfo?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    const matchesOrderType = orderTypeFilter === 'all' || order.orderType === orderTypeFilter
    
    // Date filtering
    let matchesDate = true
    if (dateFilter !== 'all') {
      const orderDate = new Date(order.createdAt)
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      
      switch (dateFilter) {
        case 'today':
          matchesDate = orderDate >= today
          break
        case 'week':
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000)
          matchesDate = orderDate >= weekAgo
          break
        case 'month':
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000)
          matchesDate = orderDate >= monthAgo
          break
      }
    }
    
    return matchesSearch && matchesStatus && matchesOrderType && matchesDate
  })

  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    // Status update is handled by OrderStatusUpdate component
    // Real-time listener will automatically update the UI
    toast.success(`Order ${orderId} status updated to ${newStatus}`)
  }

  const refreshOrders = async () => {
    try {
      const response = await safeFetch('/api/orders')
      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders || [])
        toast.success('Orders refreshed')
      }
    } catch (error) {
      console.error('Error refreshing orders:', error)
      toast.error('Failed to refresh orders')
    }
  }

const canAdvanceStatus = (status: OrderStatus) => {
    return !['completed', 'cancelled', 'delivered'].includes(status)
  }

  const getStatusDisplayName = (status: OrderStatus) => {
    return STATUS_INFO[status]?.label || status.replace('-', ' ')
  }

  return (
    <div className="space-y-6 bg-gradient-to-br from-black via-gray-900 to-black min-h-screen p-6">
      {/* Header and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white">Orders Management</h2>
          <p className="text-gray-300">
            Monitor and manage customer orders
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={refreshOrders}
            disabled={isLoading}
            className="bg-[#B7985A]/10 border-[#B7985A]/30 text-[#FFD700] hover:bg-[#B7985A]/20 backdrop-blur-sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" className="bg-gradient-to-r from-[#B7985A] to-[#D2BA6A] hover:from-[#D2BA6A] hover:to-[#B7985A] text-black border-0 shadow-lg shadow-[#B7985A]/30">
            Export Orders
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border border-red-500/30 bg-gradient-to-br from-red-900/20 to-red-800/20">
          <CardContent className="flex items-center gap-2 py-4">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <span className="text-red-300">{error}</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshOrders}
              className="ml-auto bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20"
            >
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#FFD700] h-4 w-4" />
            <Input
              placeholder="Search orders by ID, customer, or items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 bg-gray-900/50 border-[#B7985A]/30 text-white placeholder-gray-400 focus:border-[#FFD700] focus:ring-[#FFD700]/20"
              disabled={isLoading}
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter} disabled={isLoading}>
            <SelectTrigger className="w-[180px] bg-gray-900/50 border-[#B7985A]/30 text-white">
              <Filter className="h-4 w-4 mr-2 text-[#FFD700]" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-[#B7985A]/30">
              <SelectItem value="all" className="text-white hover:bg-[#B7985A]/20">All Status</SelectItem>
              <SelectItem value="pending" className="text-white hover:bg-[#B7985A]/20">Pending</SelectItem>
              <SelectItem value="confirmed" className="text-white hover:bg-[#B7985A]/20">Confirmed</SelectItem>
              <SelectItem value="preparing" className="text-white hover:bg-[#B7985A]/20">Preparing</SelectItem>
              <SelectItem value="ready" className="text-white hover:bg-[#B7985A]/20">Ready</SelectItem>
              <SelectItem value="out-for-delivery" className="text-white hover:bg-[#B7985A]/20">Out for Delivery</SelectItem>
              <SelectItem value="delivered" className="text-white hover:bg-[#B7985A]/20">Delivered</SelectItem>
              <SelectItem value="completed" className="text-white hover:bg-[#B7985A]/20">Completed</SelectItem>
              <SelectItem value="cancelled" className="text-white hover:bg-[#B7985A]/20">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Additional Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Select value={orderTypeFilter} onValueChange={setOrderTypeFilter} disabled={isLoading}>
            <SelectTrigger className="w-[150px] bg-gray-900/50 border-[#B7985A]/30 text-white">
              <SelectValue placeholder="Order Type" />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-[#B7985A]/30">
              <SelectItem value="all" className="text-white hover:bg-[#B7985A]/20">All Types</SelectItem>
              <SelectItem value="delivery" className="text-white hover:bg-[#B7985A]/20">Delivery</SelectItem>
              <SelectItem value="pickup" className="text-white hover:bg-[#B7985A]/20">Pickup</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={dateFilter} onValueChange={setDateFilter} disabled={isLoading}>
            <SelectTrigger className="w-[150px] bg-gray-900/50 border-[#B7985A]/30 text-white">
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent className="bg-gray-900 border-[#B7985A]/30">
              <SelectItem value="all" className="text-white hover:bg-[#B7985A]/20">All Time</SelectItem>
              <SelectItem value="today" className="text-white hover:bg-[#B7985A]/20">Today</SelectItem>
              <SelectItem value="week" className="text-white hover:bg-[#B7985A]/20">Last 7 Days</SelectItem>
              <SelectItem value="month" className="text-white hover:bg-[#B7985A]/20">Last 30 Days</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Clear Filters Button */}
          {(searchTerm || statusFilter !== 'all' || orderTypeFilter !== 'all' || dateFilter !== 'all') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('all')
                setOrderTypeFilter('all')
                setDateFilter('all')
              }}
              className="flex items-center gap-2 bg-gray-700/50 border-gray-600 text-gray-300 hover:bg-gray-600/50 hover:text-white"
            >
              <RefreshCw className="h-4 w-4" />
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Orders List */}
      <div className="grid gap-4">
        {isLoading ? (
          <Card className="bg-gradient-to-br from-gray-900 to-black border-[#B7985A]/30">
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <RefreshCw className="h-12 w-12 text-[#FFD700] mx-auto mb-4 animate-spin" />
                <h3 className="text-lg font-medium text-white mb-2">
                  Loading orders...
                </h3>
                <p className="text-gray-400">
                  Please wait while we fetch the latest orders
                </p>
              </div>
            </CardContent>
          </Card>
        ) : filteredOrders.length === 0 ? (
          <Card className="bg-gradient-to-br from-gray-900 to-black border-[#B7985A]/30">
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <Search className="h-12 w-12 text-[#FFD700] mx-auto mb-4" />
                <h3 className="text-lg font-medium text-white mb-2">
                  No orders found
                </h3>
                <p className="text-gray-400">
                  {searchTerm || statusFilter !== 'all' 
                    ? 'Try adjusting your search or filter criteria'
                    : 'No orders have been placed yet'
                  }
                </p>
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredOrders.map((order) => {
            const StatusIcon = getStatusIcon(order.status)
            
            return (
              <Card key={order.id} className="bg-gradient-to-br from-gray-900 to-black border-[#B7985A]/30 hover:border-[#FFD700]/50 transition-all duration-300 hover:shadow-lg hover:shadow-[#FFD700]/10">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg text-white">{order.id}</h3>
                        <Badge className={getStatusColorClass(order.status)}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {getStatusDisplayName(order.status)}
                        </Badge>
                        {order.orderType === 'delivery' && (
                          <Badge variant="outline" className="text-xs bg-[#B7985A]/20 text-[#FFD700] border-[#B7985A]/30">
                            <Truck className="h-3 w-3 mr-1" />
                            Delivery
                          </Badge>
                        )}
                        {order.orderType === 'pickup' && (
                          <Badge variant="outline" className="text-xs bg-[#B7985A]/20 text-[#FFD700] border-[#B7985A]/30">
                            <Package className="h-3 w-3 mr-1" />
                            Pickup
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-gray-400">Customer</p>
                          <p className="font-medium text-white">{order.contactInfo?.email || 'N/A'}</p>
                          {order.contactInfo?.phone && (
                            <p className="text-xs text-gray-400">{order.contactInfo.phone}</p>
                          )}
                        </div>
                        
                        <div>
                          <p className="text-gray-400">Items ({order.items.length})</p>
                          <p className="font-medium text-white">
                            {order.items.slice(0, 2).map(item => item.name).join(', ')}
                            {order.items.length > 2 && ` +${order.items.length - 2} more`}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-gray-400">Order Time</p>
                          <p className="font-medium text-white">{formatDate(order.createdAt)}</p>
                        </div>
                      </div>
                      
                      {order.estimatedTime && ['preparing', 'ready'].includes(order.status) && (
                        <div className="mt-2 text-sm">
                          <p className="text-gray-400">Estimated Ready</p>
                          <p className="font-medium text-[#FFD700]">
                            {order.estimatedTime}
                          </p>
                        </div>
                      )}
                      
                      {order.status === 'delivered' && (
                        <div className="mt-2 text-sm">
                          <p className="text-gray-400">Delivered At</p>
                          <p className="font-medium text-green-400">
                            {formatDate(order.updatedAt)}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col items-end gap-3">
                      <div className="text-right">
                        <p className="text-2xl font-bold text-[#FFD700]">{formatCurrency(order.total)}</p>
                        {order.paymentStatus && (
                          <p className="text-xs text-gray-400 capitalize">
                            Payment: {order.paymentStatus}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedOrder(order)}
                          className="bg-gray-700/50 border-[#B7985A]/30 text-gray-300 hover:bg-[#B7985A]/20 hover:text-white hover:border-[#FFD700]/50"
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        
                        <OrderStatusUpdate
                          order={order}
                          userRole="admin"
                          onStatusUpdate={handleStatusUpdate}
                          disabled={isUpdating}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-gradient-to-br from-gray-900 to-black border-[#B7985A]/30">
            <CardHeader className="border-b border-[#B7985A]/30">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2 text-white">
                    Order Details - {selectedOrder.id}
                    <Badge className={getStatusColorClass(selectedOrder.status)}>
                      {getStatusDisplayName(selectedOrder.status)}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="text-gray-400">
                    Placed on {formatDate(selectedOrder.createdAt)} • {selectedOrder.orderType === 'delivery' ? 'Delivery' : 'Pickup'}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedOrder(null)}
                  className="text-gray-400 hover:text-white hover:bg-gray-700/50"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3 text-white">Customer Information</h4>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-gray-400">Email</p>
                      <p className="font-medium text-white">{selectedOrder.contactInfo?.email || 'N/A'}</p>
                    </div>
                    {selectedOrder.contactInfo?.phone && (
                      <div>
                        <p className="text-sm text-gray-400">Phone</p>
                        <p className="font-medium text-white">{selectedOrder.contactInfo.phone}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3 text-white">Order Information</h4>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-gray-400">Order Type</p>
                      <p className="font-medium capitalize text-white">{selectedOrder.orderType}</p>
                    </div>
                    {selectedOrder.estimatedTime && (
                      <div>
                        <p className="text-sm text-gray-400">Estimated Ready</p>
                        <p className="font-medium text-[#FFD700]">{selectedOrder.estimatedTime}</p>
                      </div>
                    )}
                    {selectedOrder.paymentStatus && (
                      <div>
                        <p className="text-sm text-gray-400">Payment Status</p>
                        <p className="font-medium capitalize text-white">{selectedOrder.paymentStatus}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {selectedOrder.orderType === 'delivery' && selectedOrder.deliveryAddress && (
                <div>
                  <h4 className="font-medium mb-3 text-white">Delivery Address</h4>
                  <div className="bg-gray-800/50 border border-[#B7985A]/30 p-3 rounded-lg">
                    <p className="font-medium text-white">
                      {selectedOrder.deliveryAddress.firstName} {selectedOrder.deliveryAddress.lastName}
                    </p>
                    <p className="text-gray-300">{selectedOrder.deliveryAddress.street}</p>
                    {selectedOrder.deliveryAddress.apartment && (
                      <p className="text-gray-300">Apt {selectedOrder.deliveryAddress.apartment}</p>
                    )}
                    <p className="text-gray-300">
                      {selectedOrder.deliveryAddress.city}, {selectedOrder.deliveryAddress.state} {selectedOrder.deliveryAddress.zipCode}
                    </p>
                    {selectedOrder.deliveryAddress.deliveryInstructions && (
                      <p className="text-sm text-gray-400 mt-2">
                        Instructions: {selectedOrder.deliveryAddress.deliveryInstructions}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {selectedOrder.orderType === 'pickup' && selectedOrder.pickupLocation && (
                <div>
                  <h4 className="font-medium mb-3 text-white">Pickup Location</h4>
                  <div className="bg-gray-800/50 border border-[#B7985A]/30 p-3 rounded-lg">
                    <p className="font-medium text-white">{selectedOrder.pickupLocation}</p>
                  </div>
                </div>
              )}

              {selectedOrder.specialInstructions && (
                <div>
                  <h4 className="font-medium mb-3 text-white">Special Instructions</h4>
                  <div className="bg-gray-800/50 border border-[#B7985A]/30 p-3 rounded-lg">
                    <p className="text-gray-300">{selectedOrder.specialInstructions}</p>
                  </div>
                </div>
              )}
              
              <div>
                <h4 className="font-medium mb-3 text-white">Order Items</h4>
                <div className="space-y-3">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-start py-3 border-b border-[#B7985A]/20 last:border-b-0">
                      <div className="flex-1">
                        <p className="font-medium text-white">{item.name}</p>
                        {item.customizations && Object.keys(item.customizations).length > 0 && (
                          <div className="text-sm text-gray-400 mt-1">
                            {Object.values(item.customizations).flat().map((customization, idx) => (
                              <span key={idx} className="mr-2">
                                {customization.name} (+{formatCurrency(customization.price)})
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-white">{item.quantity}x</p>
                        <p className="text-sm text-gray-400">{formatCurrency(item.price)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2 pt-4 border-t border-[#B7985A]/30">
                <div className="flex justify-between text-gray-300">
                  <span>Subtotal</span>
                  <span>{formatCurrency(selectedOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-300">
                  <span>Tax</span>
                  <span>{formatCurrency(selectedOrder.tax)}</span>
                </div>
                {selectedOrder.deliveryFee > 0 && (
                  <div className="flex justify-between text-gray-300">
                    <span>Delivery Fee</span>
                    <span>{formatCurrency(selectedOrder.deliveryFee)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t border-[#B7985A]/30 font-bold text-lg">
                  <span className="text-white">Total</span>
                  <span className="text-[#FFD700]">{formatCurrency(selectedOrder.total)}</span>
                </div>
              </div>
              
              <div className="flex gap-2 pt-4">
                <OrderStatusUpdate
                  order={selectedOrder}
                  userRole="admin"
                  onStatusUpdate={(orderId, newStatus) => {
                    handleStatusUpdate(orderId, newStatus)
                    setSelectedOrder(null)
                  }}
                  disabled={isUpdating}
                  className="flex-1"
                />
                <Button
                  variant="outline"
                  onClick={() => setSelectedOrder(null)}
                  className="bg-gray-700/50 border-[#B7985A]/30 text-gray-300 hover:bg-gray-600/50 hover:text-white hover:border-[#FFD700]/50"
                >
                  Close
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}