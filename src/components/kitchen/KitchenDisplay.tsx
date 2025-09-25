'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  Clock, 
  ChefHat, 
  CheckCircle, 
  AlertCircle, 
  Timer,
  Utensils,
  Package,
  Car,
  RefreshCw,
  Eye
} from 'lucide-react'
import { Order, OrderStatus } from '@/types/order'
import { db, isFirebaseConfigured } from '@/lib/firebase'
import { collection, query, where, orderBy, onSnapshot, doc, updateDoc, Timestamp } from 'firebase/firestore'
import { COLLECTIONS } from '@/lib/firebase/collections'
import OrderStatusUpdate from '@/components/orders/OrderStatusUpdate'
import { STATUS_INFO, getStatusColorClass } from '@/lib/utils/orderStatusValidation'
import { safeFetch } from '@/lib/utils/safeFetch'

interface KitchenDisplayProps {
  initialOrders?: Order[]
}

interface OrderTimer {
  orderId: string
  startTime: Date
  estimatedTime?: number // in minutes
}

export default function KitchenDisplay({ initialOrders = [] }: KitchenDisplayProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [activeView, setActiveView] = useState<'queue' | 'preparing' | 'ready'>('queue')
  const [orderTimers, setOrderTimers] = useState<OrderTimer[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)

  // Real-time Firebase listener
  useEffect(() => {
    if (!isFirebaseConfigured()) {
      console.log('Firebase not configured, using initial orders')
      return
    }

    setIsLoading(true)
    setError(null)

    try {
      const ordersRef = collection(db, COLLECTIONS.ORDERS)
      const q = query(
        ordersRef,
        where('status', 'in', ['confirmed', 'preparing', 'ready']),
        orderBy('createdAt', 'asc')
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
          console.error('Error fetching orders:', error)
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
  }, [initialOrders])

  // Timer management
  useEffect(() => {
    const interval = setInterval(() => {
      setOrderTimers(prev => prev.map(timer => ({ ...timer })))
    }, 1000)

    return () => clearInterval(interval)
  }, [])

  const startTimer = (orderId: string, estimatedTime?: number) => {
    setOrderTimers(prev => {
      const existing = prev.find(t => t.orderId === orderId)
      if (existing) return prev
      
      return [...prev, {
        orderId,
        startTime: new Date(),
        estimatedTime
      }]
    })
  }

  const getElapsedTime = (orderId: string): string => {
    const timer = orderTimers.find(t => t.orderId === orderId)
    if (!timer) return '0:00'

    const elapsed = Math.floor((Date.now() - timer.startTime.getTime()) / 1000)
    const minutes = Math.floor(elapsed / 60)
    const seconds = elapsed % 60
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  const isOverdue = (orderId: string): boolean => {
    const timer = orderTimers.find(t => t.orderId === orderId)
    if (!timer || !timer.estimatedTime) return false

    const elapsed = (Date.now() - timer.startTime.getTime()) / (1000 * 60) // minutes
    return elapsed > timer.estimatedTime
  }

  const handleStatusUpdate = async (orderId: string, newStatus: OrderStatus) => {
    // Start timer when order moves to preparing
    if (newStatus === 'preparing') {
      startTimer(orderId, 15) // Default 15 minutes for preparation
    }

    // Remove timer when order is completed
    if (newStatus === 'ready' || newStatus === 'completed') {
      setOrderTimers(prev => prev.filter(t => t.orderId !== orderId))
    }
    
    toast.success(`Order ${orderId} status updated successfully`)
  }

  // Remove getStatusColor function - using utility

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'confirmed': return <Clock className="w-4 h-4" />
      case 'preparing': return <ChefHat className="w-4 h-4" />
      case 'ready': return <CheckCircle className="w-4 h-4" />
      default: return <AlertCircle className="w-4 h-4" />
    }
  }

  const getOrderTypeIcon = (orderType: string) => {
    return orderType === 'delivery' ? <Car className="w-4 h-4" /> : <Package className="w-4 h-4" />
  }

  const formatTime = (date: Date): string => {
    return new Intl.DateTimeFormat('en-US', {
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

  const getFilteredOrders = (status: OrderStatus[]) => {
    return orders.filter(order => status.includes(order.status))
  }

  const refreshOrders = async () => {
    setIsLoading(true)
    try {
      const response = await safeFetch('/api/orders')
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

  const OrderCard = ({ order }: { order: Order }) => {
    const isOrderOverdue = isOverdue(order.id)
    const elapsedTime = getElapsedTime(order.id)
    
    return (
      <Card className={`relative ${isOrderOverdue ? 'border-red-500 bg-red-50' : ''}`}>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge className={getStatusColorClass(order.status)}>
                {getStatusIcon(order.status)}
                <span className="ml-1 capitalize">{STATUS_INFO[order.status]?.label || order.status}</span>
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
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Customer Info */}
          <div>
            <p className="font-medium">{order.contactInfo?.name || 'Customer'}</p>
            <p className="text-sm text-muted-foreground">{order.contactInfo?.phone}</p>
          </div>

          {/* Order Items */}
          <div className="space-y-2">
            <h4 className="font-medium text-sm">Items ({order.items.length})</h4>
            <div className="space-y-1">
              {order.items.slice(0, 3).map((item, index) => (
                <div key={index} className="flex justify-between text-sm">
                  <span>{item.quantity}x {item.name}</span>
                  <span className="text-muted-foreground">
                    {formatCurrency(item.price * item.quantity)}
                  </span>
                </div>
              ))}
              {order.items.length > 3 && (
                <p className="text-xs text-muted-foreground">
                  +{order.items.length - 3} more items
                </p>
              )}
            </div>
          </div>

          {/* Special Instructions */}
          {order.specialInstructions && (
            <div className="bg-yellow-50 border border-yellow-200 rounded p-2">
              <p className="text-xs font-medium text-yellow-800">Special Instructions:</p>
              <p className="text-xs text-yellow-700">{order.specialInstructions}</p>
            </div>
          )}

          {/* Timer for preparing orders */}
          {order.status === 'preparing' && (
            <div className={`flex items-center gap-2 p-2 rounded ${isOrderOverdue ? 'bg-red-100 text-red-700' : 'bg-blue-50 text-blue-700'}`}>
              <Timer className="w-4 h-4" />
              <span className="text-sm font-medium">Prep Time: {elapsedTime}</span>
              {isOrderOverdue && <span className="text-xs">(OVERDUE)</span>}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedOrder(order)}
              className="flex items-center gap-1"
            >
              <Eye className="w-4 h-4" />
              View Details
            </Button>
            
            <div className="flex-1">
              <OrderStatusUpdate
                order={order}
                userRole="kitchen"
                onStatusUpdate={handleStatusUpdate}
              />
            </div>
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
          <h1 className="text-3xl font-bold">Kitchen Display</h1>
          <p className="text-muted-foreground">Manage order preparation and workflow</p>
        </div>
        <div className="flex items-center gap-2">
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
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold">
                  {getFilteredOrders(['confirmed']).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <ChefHat className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Preparing</p>
                <p className="text-2xl font-bold">
                  {getFilteredOrders(['preparing']).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Ready</p>
                <p className="text-2xl font-bold">
                  {getFilteredOrders(['ready']).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Utensils className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">Total Active</p>
                <p className="text-2xl font-bold">{orders.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order Queue Tabs */}
      <Tabs value={activeView} onValueChange={(value) => setActiveView(value as any)} className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="queue" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Queue ({getFilteredOrders(['confirmed']).length})
          </TabsTrigger>
          <TabsTrigger value="preparing" className="flex items-center gap-2">
            <ChefHat className="w-4 h-4" />
            Preparing ({getFilteredOrders(['preparing']).length})
          </TabsTrigger>
          <TabsTrigger value="ready" className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4" />
            Ready ({getFilteredOrders(['ready']).length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="queue" className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center p-8">
              <RefreshCw className="w-6 h-6 animate-spin" />
              <span className="ml-2">Loading orders...</span>
            </div>
          ) : getFilteredOrders(['confirmed']).length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              <Clock className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No orders in queue</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {getFilteredOrders(['confirmed']).map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="preparing" className="space-y-4">
          {getFilteredOrders(['preparing']).length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              <ChefHat className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No orders being prepared</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {getFilteredOrders(['preparing']).map((order) => (
                <OrderCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="ready" className="space-y-4">
          {getFilteredOrders(['ready']).length === 0 ? (
            <div className="text-center p-8 text-muted-foreground">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No orders ready for pickup/delivery</p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {getFilteredOrders(['ready']).map((order) => (
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
              {/* Customer Details */}
              <div>
                <h4 className="font-medium mb-2">Customer Information</h4>
                <div className="grid gap-2 text-sm">
                  <p><strong>Name:</strong> {selectedOrder.contactInfo?.name}</p>
                  <p><strong>Phone:</strong> {selectedOrder.contactInfo?.phone}</p>
                  <p><strong>Email:</strong> {selectedOrder.contactInfo?.email}</p>
                </div>
              </div>

              {/* Order Details */}
              <div>
                <h4 className="font-medium mb-2">Order Details</h4>
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
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}