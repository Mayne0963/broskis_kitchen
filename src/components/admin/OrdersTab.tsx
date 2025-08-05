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
import OrderStatusUpdate from '@/components/orders/OrderStatusUpdate'
import { STATUS_INFO, getStatusColorClass } from '@/lib/utils/orderStatusValidation'

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

    const ordersRef = collection(db, 'orders')
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
      const response = await fetch('/api/orders')
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
    <div className="space-y-6">
      {/* Header and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Orders Management</h2>
          <p className="text-muted-foreground">
            Monitor and manage customer orders
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm"
            onClick={refreshOrders}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm">
            Export Orders
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="flex items-center gap-2 py-4">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="text-red-800">{error}</span>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshOrders}
              className="ml-auto"
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
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search orders by ID, customer, or items..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              disabled={isLoading}
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter} disabled={isLoading}>
            <SelectTrigger className="w-[180px]">
              <Filter className="h-4 w-4 mr-2" />
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="preparing">Preparing</SelectItem>
              <SelectItem value="ready">Ready</SelectItem>
              <SelectItem value="out-for-delivery">Out for Delivery</SelectItem>
              <SelectItem value="delivered">Delivered</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Additional Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Select value={orderTypeFilter} onValueChange={setOrderTypeFilter} disabled={isLoading}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Order Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="delivery">Delivery</SelectItem>
              <SelectItem value="pickup">Pickup</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={dateFilter} onValueChange={setDateFilter} disabled={isLoading}>
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Date Range" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Time</SelectItem>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="week">Last 7 Days</SelectItem>
              <SelectItem value="month">Last 30 Days</SelectItem>
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
              className="flex items-center gap-2"
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
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <RefreshCw className="h-12 w-12 text-gray-400 mx-auto mb-4 animate-spin" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Loading orders...
                </h3>
                <p className="text-gray-500">
                  Please wait while we fetch the latest orders
                </p>
              </div>
            </CardContent>
          </Card>
        ) : filteredOrders.length === 0 ? (
          <Card>
            <CardContent className="flex items-center justify-center py-12">
              <div className="text-center">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No orders found
                </h3>
                <p className="text-gray-500">
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
              <Card key={order.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{order.id}</h3>
                        <Badge className={getStatusColorClass(order.status)}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {getStatusDisplayName(order.status)}
                        </Badge>
                        {order.orderType === 'delivery' && (
                          <Badge variant="outline" className="text-xs">
                            <Truck className="h-3 w-3 mr-1" />
                            Delivery
                          </Badge>
                        )}
                        {order.orderType === 'pickup' && (
                          <Badge variant="outline" className="text-xs">
                            <Package className="h-3 w-3 mr-1" />
                            Pickup
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Customer</p>
                          <p className="font-medium">{order.contactInfo?.email || 'N/A'}</p>
                          {order.contactInfo?.phone && (
                            <p className="text-xs text-muted-foreground">{order.contactInfo.phone}</p>
                          )}
                        </div>
                        
                        <div>
                          <p className="text-muted-foreground">Items ({order.items.length})</p>
                          <p className="font-medium">
                            {order.items.slice(0, 2).map(item => item.name).join(', ')}
                            {order.items.length > 2 && ` +${order.items.length - 2} more`}
                          </p>
                        </div>
                        
                        <div>
                          <p className="text-muted-foreground">Order Time</p>
                          <p className="font-medium">{formatDate(order.createdAt)}</p>
                        </div>
                      </div>
                      
                      {order.estimatedTime && ['preparing', 'ready'].includes(order.status) && (
                        <div className="mt-2 text-sm">
                          <p className="text-muted-foreground">Estimated Ready</p>
                          <p className="font-medium text-orange-600">
                            {order.estimatedTime}
                          </p>
                        </div>
                      )}
                      
                      {order.status === 'delivered' && (
                        <div className="mt-2 text-sm">
                          <p className="text-muted-foreground">Delivered At</p>
                          <p className="font-medium text-green-600">
                            {formatDate(order.updatedAt)}
                          </p>
                        </div>
                      )}
                    </div>
                    
                    <div className="flex flex-col items-end gap-3">
                      <div className="text-right">
                        <p className="text-2xl font-bold">{formatCurrency(order.total)}</p>
                        {order.paymentStatus && (
                          <p className="text-xs text-muted-foreground capitalize">
                            Payment: {order.paymentStatus}
                          </p>
                        )}
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedOrder(order)}
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
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    Order Details - {selectedOrder.id}
                    <Badge className={getStatusColorClass(selectedOrder.status)}>
                      {getStatusDisplayName(selectedOrder.status)}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    Placed on {formatDate(selectedOrder.createdAt)} • {selectedOrder.orderType === 'delivery' ? 'Delivery' : 'Pickup'}
                  </CardDescription>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedOrder(null)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-medium mb-3">Customer Information</h4>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <p className="font-medium">{selectedOrder.contactInfo?.email || 'N/A'}</p>
                    </div>
                    {selectedOrder.contactInfo?.phone && (
                      <div>
                        <p className="text-sm text-muted-foreground">Phone</p>
                        <p className="font-medium">{selectedOrder.contactInfo.phone}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="font-medium mb-3">Order Information</h4>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-muted-foreground">Order Type</p>
                      <p className="font-medium capitalize">{selectedOrder.orderType}</p>
                    </div>
                    {selectedOrder.estimatedTime && (
                      <div>
                        <p className="text-sm text-muted-foreground">Estimated Ready</p>
                        <p className="font-medium">{selectedOrder.estimatedTime}</p>
                      </div>
                    )}
                    {selectedOrder.paymentStatus && (
                      <div>
                        <p className="text-sm text-muted-foreground">Payment Status</p>
                        <p className="font-medium capitalize">{selectedOrder.paymentStatus}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {selectedOrder.orderType === 'delivery' && selectedOrder.deliveryAddress && (
                <div>
                  <h4 className="font-medium mb-3">Delivery Address</h4>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="font-medium">
                      {selectedOrder.deliveryAddress.firstName} {selectedOrder.deliveryAddress.lastName}
                    </p>
                    <p>{selectedOrder.deliveryAddress.street}</p>
                    {selectedOrder.deliveryAddress.apartment && (
                      <p>Apt {selectedOrder.deliveryAddress.apartment}</p>
                    )}
                    <p>
                      {selectedOrder.deliveryAddress.city}, {selectedOrder.deliveryAddress.state} {selectedOrder.deliveryAddress.zipCode}
                    </p>
                    {selectedOrder.deliveryAddress.deliveryInstructions && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Instructions: {selectedOrder.deliveryAddress.deliveryInstructions}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {selectedOrder.orderType === 'pickup' && selectedOrder.pickupLocation && (
                <div>
                  <h4 className="font-medium mb-3">Pickup Location</h4>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="font-medium">{selectedOrder.pickupLocation}</p>
                  </div>
                </div>
              )}

              {selectedOrder.specialInstructions && (
                <div>
                  <h4 className="font-medium mb-3">Special Instructions</h4>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p>{selectedOrder.specialInstructions}</p>
                  </div>
                </div>
              )}
              
              <div>
                <h4 className="font-medium mb-3">Order Items</h4>
                <div className="space-y-3">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-start py-3 border-b last:border-b-0">
                      <div className="flex-1">
                        <p className="font-medium">{item.name}</p>
                        {item.customizations && Object.keys(item.customizations).length > 0 && (
                          <div className="text-sm text-muted-foreground mt-1">
                            {Object.values(item.customizations).flat().map((customization, idx) => (
                              <span key={idx} className="mr-2">
                                {customization.name} (+{formatCurrency(customization.price)})
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="font-medium">{item.quantity}x</p>
                        <p className="text-sm text-muted-foreground">{formatCurrency(item.price)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2 pt-4 border-t">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>{formatCurrency(selectedOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax</span>
                  <span>{formatCurrency(selectedOrder.tax)}</span>
                </div>
                {selectedOrder.deliveryFee > 0 && (
                  <div className="flex justify-between">
                    <span>Delivery Fee</span>
                    <span>{formatCurrency(selectedOrder.deliveryFee)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pt-2 border-t font-bold text-lg">
                  <span>Total</span>
                  <span>{formatCurrency(selectedOrder.total)}</span>
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