'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Search, 
  Clock, 
  CheckCircle, 
  Truck, 
  Package, 
  MapPin, 
  Phone, 
  Mail, 
  RefreshCw,
  Eye,
  RotateCcw,
  Calendar,
  DollarSign,
  AlertCircle,
  ChefHat
} from 'lucide-react'
import { Order, OrderStatus } from '@/types/order'
import { db, isFirebaseConfigured } from '@/lib/firebase'
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore'
import OTWTracker from './OTWTracker'

interface OrderTrackingProps {
  userId: string
  initialOrders?: Order[]
}

export default function OrderTracking({ userId, initialOrders = [] }: OrderTrackingProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | OrderStatus>('all')
  const [orderTypeFilter, setOrderTypeFilter] = useState<'all' | 'delivery' | 'pickup'>('all')
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all')
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active')

  // Real-time Firebase listener for user's orders
  useEffect(() => {
    if (!userId) return
    
    if (!isFirebaseConfigured()) {
      console.log('Firebase not configured, using initial orders')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const ordersRef = collection(db, 'orders')
      const q = query(
        ordersRef,
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      )

      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const ordersData = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate?.() || new Date(),
            updatedAt: doc.data().updatedAt?.toDate?.() || new Date()
          })) as Order[]

          setOrders(ordersData)
          setIsLoading(false)
        },
        (error) => {
          console.error('Error fetching user orders:', error)
          setError('Failed to load orders. Please try again.')
          setIsLoading(false)
          setOrders(initialOrders)
        }
      )

      return () => unsubscribe()
    } catch (error) {
      console.error('Error setting up real-time listener:', error)
      setError('Failed to connect to real-time updates')
      setIsLoading(false)
      setOrders(initialOrders)
    }
  }, [userId, initialOrders])

  const getStatusColor = (status: OrderStatus): string => {
    switch (status) {
      case 'pending': return 'bg-gray-500 text-white'
      case 'confirmed': return 'bg-blue-500 text-white'
      case 'preparing': return 'bg-orange-500 text-white'
      case 'ready': return 'bg-green-500 text-white'
      case 'out-for-delivery': return 'bg-purple-500 text-white'
      case 'delivered': return 'bg-emerald-500 text-white'
      case 'completed': return 'bg-emerald-600 text-white'
      case 'cancelled': return 'bg-red-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return <Clock className="w-4 h-4" />
      case 'confirmed': return <CheckCircle className="w-4 h-4" />
      case 'preparing': return <ChefHat className="w-4 h-4" />
      case 'ready': return <Package className="w-4 h-4" />
      case 'out-for-delivery': return <Truck className="w-4 h-4" />
      case 'delivered': return <CheckCircle className="w-4 h-4" />
      case 'completed': return <CheckCircle className="w-4 h-4" />
      case 'cancelled': return <AlertCircle className="w-4 h-4" />
      default: return <Clock className="w-4 h-4" />
    }
  }

  const getStatusDisplayName = (status: OrderStatus): string => {
    switch (status) {
      case 'pending': return 'Pending'
      case 'confirmed': return 'Confirmed'
      case 'preparing': return 'Preparing'
      case 'ready': return 'Ready'
      case 'out-for-delivery': return 'Out for Delivery'
      case 'delivered': return 'Delivered'
      case 'completed': return 'Completed'
      case 'cancelled': return 'Cancelled'
      default: return status
    }
  }

  const getOrderTypeIcon = (orderType: string) => {
    return orderType === 'delivery' ? <Truck className="w-4 h-4" /> : <Package className="w-4 h-4" />
  }

  const formatTime = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).format(date)
  }

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const isActiveOrder = (status: OrderStatus): boolean => {
    return !['delivered', 'completed', 'cancelled'].includes(status)
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = searchTerm === '' || 
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.contactInfo?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesStatus = statusFilter === 'all' || order.status === statusFilter
    const matchesOrderType = orderTypeFilter === 'all' || order.orderType === orderTypeFilter
    const matchesTab = activeTab === 'active' ? isActiveOrder(order.status) : !isActiveOrder(order.status)
    
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
    
    return matchesSearch && matchesStatus && matchesOrderType && matchesTab && matchesDate
  })

  const refreshOrders = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/orders?userId=${userId}`)
      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders || [])
      }
    } catch (error) {
      console.error('Error refreshing orders:', error)
      setError('Failed to refresh orders')
    } finally {
      setIsLoading(false)
    }
  }

  const handleReorder = async (order: Order) => {
    try {
      // Create a new order with the same items
      const reorderData = {
        items: order.items,
        orderType: order.orderType,
        deliveryAddress: order.deliveryAddress,
        contactInfo: order.contactInfo,
        specialInstructions: order.specialInstructions
      }
      
      // Redirect to checkout with pre-filled data
      const params = new URLSearchParams({
        reorder: 'true',
        data: JSON.stringify(reorderData)
      })
      
      window.location.href = `/checkout?${params.toString()}`
    } catch (error) {
      console.error('Error reordering:', error)
      setError('Failed to reorder. Please try again.')
    }
  }

  const getOrderProgress = (status: OrderStatus): number => {
    const statusOrder = ['pending', 'confirmed', 'preparing', 'ready', 'out-for-delivery', 'delivered', 'completed']
    const currentIndex = statusOrder.indexOf(status)
    return currentIndex >= 0 ? ((currentIndex + 1) / statusOrder.length) * 100 : 0
  }

  const OrderCard = ({ order }: { order: Order }) => {
    const progress = getOrderProgress(order.status)
    
    return (
      <Card className="hover:shadow-lg transition-shadow">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge className={getStatusColor(order.status)}>
                {getStatusIcon(order.status)}
                <span className="ml-1">{getStatusDisplayName(order.status)}</span>
              </Badge>
              <Badge variant="outline" className="flex items-center gap-1">
                {getOrderTypeIcon(order.orderType)}
                <span className="capitalize">{order.orderType}</span>
              </Badge>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">#{order.id.slice(-6)}</p>
              <p className="text-xs text-muted-foreground">
                {formatTime(order.createdAt)}
              </p>
            </div>
          </div>
          
          {/* Progress Bar for Active Orders */}
          {isActiveOrder(order.status) && (
            <div className="mt-3">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Order Items Summary */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium">Items ({order.items.length})</span>
              <span className="text-lg font-bold text-green-600">
                {formatCurrency(order.total)}
              </span>
            </div>
            <div className="space-y-1">
              {order.items.slice(0, 2).map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span>{item.quantity}x {item.name}</span>
                  <span className="text-muted-foreground">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              ))}
              {order.items.length > 2 && (
                <p className="text-xs text-muted-foreground">
                  +{order.items.length - 2} more items
                </p>
              )}
            </div>
          </div>

          {/* Delivery/Pickup Info */}
          {order.orderType === 'delivery' && order.deliveryAddress && (
            <div className="flex items-start gap-2 text-sm">
              <MapPin className="w-4 h-4 mt-0.5 text-muted-foreground" />
              <div>
                <p className="font-medium">Delivery to:</p>
                <p className="text-muted-foreground">
                  {order.deliveryAddress.street}, {order.deliveryAddress.city}
                </p>
              </div>
            </div>
          )}

          {/* Estimated Time */}
          {order.estimatedTime && isActiveOrder(order.status) && (
            <div className="flex items-center gap-2 text-sm bg-blue-50 p-2 rounded">
              <Clock className="w-4 h-4 text-blue-600" />
              <span className="text-blue-700">Estimated: {order.estimatedTime}</span>
            </div>
          )}

          {/* OTW Tracking for delivery orders */}
          {order.orderType === 'delivery' && order.otwOrderId && isActiveOrder(order.status) && (
            <div className="border-t pt-3">
              <OTWTracker order={order} />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedOrder(order)}
              className="flex items-center gap-1"
            >
              <Eye className="w-4 h-4" />
              Details
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleReorder(order)}
              className="flex items-center gap-1"
            >
              <RotateCcw className="w-4 h-4" />
              Reorder
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
        <h3 className="text-lg font-semibold mb-2">Error Loading Orders</h3>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button onClick={refreshOrders} className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Retry
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Order Tracking</h1>
          <p className="text-muted-foreground">Track your orders in real-time</p>
        </div>
        <Button
          variant="outline"
          onClick={refreshOrders}
          disabled={isLoading}
          className="flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search orders by ID, items, or customer name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
              disabled={isLoading}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as any)}
            className="px-3 py-2 border border-input bg-background rounded-md"
            disabled={isLoading}
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="preparing">Preparing</option>
            <option value="ready">Ready</option>
            <option value="out-for-delivery">Out for Delivery</option>
            <option value="delivered">Delivered</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        
        {/* Additional Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <select
            value={orderTypeFilter}
            onChange={(e) => setOrderTypeFilter(e.target.value as any)}
            className="px-3 py-2 border border-input bg-background rounded-md"
            disabled={isLoading}
          >
            <option value="all">All Types</option>
            <option value="delivery">Delivery</option>
            <option value="pickup">Pickup</option>
          </select>
          
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as any)}
            className="px-3 py-2 border border-input bg-background rounded-md"
            disabled={isLoading}
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">Last 7 Days</option>
            <option value="month">Last 30 Days</option>
          </select>
          
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
              <RefreshCw className="w-4 h-4" />
              Clear Filters
            </Button>
          )}
        </div>
      </div>

      {/* Order Tabs */}
      <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="active" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Active Orders ({orders.filter(o => isActiveOrder(o.status)).length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Order History ({orders.filter(o => !isActiveOrder(o.status)).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <RefreshCw className="w-6 h-6 animate-spin" />
              <span className="ml-2">Loading orders...</span>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No active orders found</p>
              {searchTerm && (
                <p className="text-sm mt-2">Try adjusting your search criteria</p>
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="completed" className="space-y-4">
          {filteredOrders.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No completed orders found</p>
              {searchTerm && (
                <p className="text-sm mt-2">Try adjusting your search criteria</p>
              )}
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredOrders.map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Order #{selectedOrder.id.slice(-6)}</CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedOrder(null)}
                >
                  ×
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Order Status */}
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(selectedOrder.status)}>
                  {getStatusIcon(selectedOrder.status)}
                  <span className="ml-1">{getStatusDisplayName(selectedOrder.status)}</span>
                </Badge>
                <Badge variant="outline" className="flex items-center gap-1">
                  {getOrderTypeIcon(selectedOrder.orderType)}
                  <span className="capitalize">{selectedOrder.orderType}</span>
                </Badge>
              </div>

              {/* Order Timeline */}
              <div>
                <h4 className="font-medium mb-2">Order Timeline</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Order Placed:</span>
                    <span>{formatTime(selectedOrder.createdAt)}</span>
                  </div>
                  {selectedOrder.updatedAt && selectedOrder.updatedAt !== selectedOrder.createdAt && (
                    <div className="flex justify-between">
                      <span>Last Updated:</span>
                      <span>{formatTime(selectedOrder.updatedAt)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Customer Details */}
              <div>
                <h4 className="font-medium mb-2">Contact Information</h4>
                <div className="grid gap-2 text-sm">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedOrder.contactInfo?.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span>{selectedOrder.contactInfo?.phone}</span>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h4 className="font-medium mb-2">Order Items</h4>
                <div className="space-y-2">
                  {selectedOrder.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-start p-2 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium">{item.quantity}x {item.name}</p>
                        {item.customizations && item.customizations.length > 0 && (
                          <div className="text-xs text-muted-foreground mt-1">
                            {item.customizations.map((custom, idx) => (
                              <span key={idx} className="block">
                                {custom.name}: {custom.selectedOptions.join(', ')}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <span className="font-medium">
                        {formatCurrency(item.price * item.quantity)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Special Instructions */}
              {selectedOrder.specialInstructions && (
                <div>
                  <h4 className="font-medium mb-2">Special Instructions</h4>
                  <p className="text-sm bg-yellow-50 border border-yellow-200 rounded p-2">
                    {selectedOrder.specialInstructions}
                  </p>
                </div>
              )}

              {/* Delivery/Pickup Info */}
              {selectedOrder.orderType === 'delivery' && selectedOrder.deliveryAddress && (
                <div>
                  <h4 className="font-medium mb-2">Delivery Address</h4>
                  <div className="text-sm bg-blue-50 border border-blue-200 rounded p-2">
                    <p>{selectedOrder.deliveryAddress.street}</p>
                    <p>{selectedOrder.deliveryAddress.city}, {selectedOrder.deliveryAddress.state} {selectedOrder.deliveryAddress.zipCode}</p>
                    {selectedOrder.deliveryAddress.instructions && (
                      <p className="mt-1 text-muted-foreground">
                        Instructions: {selectedOrder.deliveryAddress.instructions}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Order Summary */}
              <div>
                <h4 className="font-medium mb-2">Order Summary</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>{formatCurrency(selectedOrder.subtotal)}</span>
                  </div>
                  {selectedOrder.tax && (
                    <div className="flex justify-between">
                      <span>Tax:</span>
                      <span>{formatCurrency(selectedOrder.tax)}</span>
                    </div>
                  )}
                  {selectedOrder.deliveryFee && (
                    <div className="flex justify-between">
                      <span>Delivery Fee:</span>
                      <span>{formatCurrency(selectedOrder.deliveryFee)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-medium border-t pt-1">
                    <span>Total:</span>
                    <span>{formatCurrency(selectedOrder.total)}</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4">
                <Button
                  onClick={() => handleReorder(selectedOrder)}
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  Reorder
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}