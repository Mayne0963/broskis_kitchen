'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
  ChefHat,
  Bell,
  BellOff,
  Wifi,
  WifiOff,
  Timer,
  Save,
  Trash2,
  MessageCircle,
  XCircle,
  Edit,
  Calculator
} from 'lucide-react'
import { Order, OrderStatus } from '@/types/order'
import { db, isFirebaseConfigured } from '@/lib/firebase'
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore'
import { toast } from 'sonner'
import { pushNotificationService } from '@/lib/services/push-notification-service'
import { getOTWOrderStatus } from '@/lib/services/otw-integration'
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
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'status' | 'total'>('newest')
  const [savedFilters, setSavedFilters] = useState<any>(null)
  const [filterPresets, setFilterPresets] = useState<any[]>([])
  const [showPresetModal, setShowPresetModal] = useState(false)
  const [presetName, setPresetName] = useState('')
  const [showChat, setShowChat] = useState(false)
  const [chatMessages, setChatMessages] = useState<any[]>([])
  const [chatInput, setChatInput] = useState('')
  const [isChatLoading, setIsChatLoading] = useState(false)
  const [chatOrderContext, setChatOrderContext] = useState<Order | null>(null)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active')
  const [notificationsEnabled, setNotificationsEnabled] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date())
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [estimatedTimes, setEstimatedTimes] = useState<Record<string, number>>({});
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('connected');
  const [driverLocations, setDriverLocations] = useState<Record<string, { lat: number; lng: number; lastUpdated: Date }>>({});
  const [trackingOrders, setTrackingOrders] = useState<Set<string>>(new Set());
  const [showDriverMap, setShowDriverMap] = useState<string | null>(null);
  const [pricingUpdates, setPricingUpdates] = useState<Record<string, { originalTotal: number; updatedTotal: number; changes: any[] }>>({});
  const [showPricingModal, setShowPricingModal] = useState<string | null>(null);
  const [isCalculatingPrice, setIsCalculatingPrice] = useState(false);
  const [showModifyModal, setShowModifyModal] = useState<string | null>(null);
  const [modificationItems, setModificationItems] = useState<any[]>([]);
  const [isModifying, setIsModifying] = useState(false);
  const [availableItems] = useState([
    { id: '1', name: 'Extra Sauce', price: 2.50, category: 'Add-ons' },
    { id: '2', name: 'Extra Cheese', price: 3.00, category: 'Add-ons' },
    { id: '3', name: 'Side Salad', price: 5.99, category: 'Sides' },
    { id: '4', name: 'Garlic Bread', price: 4.50, category: 'Sides' },
    { id: '5', name: 'Soft Drink', price: 2.99, category: 'Beverages' }
  ]);

  // Load saved filter preferences and presets
   useEffect(() => {
     const savedPrefs = localStorage.getItem(`orderFilters_${userId}`)
     if (savedPrefs) {
       try {
         const prefs = JSON.parse(savedPrefs)
         setSavedFilters(prefs)
         setStatusFilter(prefs.statusFilter || 'all')
         setOrderTypeFilter(prefs.orderTypeFilter || 'all')
         setDateFilter(prefs.dateFilter || 'all')
         setSortBy(prefs.sortBy || 'newest')
         setActiveTab(prefs.activeTab || 'active')
       } catch (error) {
         console.error('Error loading saved filters:', error)
       }
     }

     // Load filter presets
     const savedPresets = localStorage.getItem(`orderFilterPresets_${userId}`)
     if (savedPresets) {
       try {
         setFilterPresets(JSON.parse(savedPresets))
       } catch (error) {
         console.error('Error loading filter presets:', error)
       }
     }
   }, [userId])

  // Save filter preferences when they change
  useEffect(() => {
    if (userId) {
      const prefs = {
        statusFilter,
        orderTypeFilter,
        dateFilter,
        sortBy,
        activeTab
      }
      localStorage.setItem(`orderFilters_${userId}`, JSON.stringify(prefs))
    }
  }, [userId, statusFilter, orderTypeFilter, dateFilter, sortBy, activeTab])

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

  // Initialize push notifications
  useEffect(() => {
    const initPushNotifications = async () => {
      if (pushNotificationService.isSupported()) {
        try {
          const permission = await pushNotificationService.requestPermission()
          if (permission === 'granted' && userId) {
            await pushNotificationService.subscribeUser(userId)
            setNotificationsEnabled(true)
            toast.success('Push notifications enabled for order updates!')
          }
        } catch (error) {
          console.error('Failed to initialize push notifications:', error)
        }
      }
    }

    if (userId) {
      initPushNotifications()
    }
  }, [userId])

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setConnectionStatus('connected')
      toast.success('Connection restored')
    }
    const handleOffline = () => {
      setIsOnline(false)
      setConnectionStatus('disconnected')
      toast.error('Connection lost')
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // Auto-refresh functionality
  useEffect(() => {
    if (!autoRefreshEnabled) return

    const interval = setInterval(() => {
      setLastRefresh(new Date())
      // The Firebase listener will automatically update the orders
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [autoRefreshEnabled])

  // Update estimated delivery times
  useEffect(() => {
    const updateEstimatedTimes = () => {
      const newEstimatedTimes: Record<string, number> = {}
      
      orders.forEach(order => {
        if (order.status === 'out_for_delivery' && order.estimatedDeliveryTime) {
          const estimatedTime = new Date(order.estimatedDeliveryTime).getTime()
          const now = Date.now()
          const timeRemaining = Math.max(0, estimatedTime - now)
          newEstimatedTimes[order.id] = timeRemaining
        }
      })
      
      setEstimatedTimes(newEstimatedTimes)
    }

    updateEstimatedTimes()
    const interval = setInterval(updateEstimatedTimes, 60000) // Update every minute

    return () => clearInterval(interval)
  }, [orders])

  // Manual refresh function
  const handleManualRefresh = useCallback(async () => {
    setIsRefreshing(true)
    setConnectionStatus('connecting')
    setLastRefresh(new Date())
    
    // Add a small delay to show the refresh animation
    setTimeout(() => {
      setIsRefreshing(false)
      setConnectionStatus('connected')
      toast.success('Orders refreshed')
    }, 1000)
  }, [])

  // Toggle push notifications
  const toggleNotifications = useCallback(async () => {
    if (!pushNotificationService.isSupported()) {
      toast.error('Push notifications are not supported on this device')
      return
    }

    try {
      if (notificationsEnabled) {
        // Disable notifications
        setNotificationsEnabled(false)
        toast.success('Push notifications disabled')
      } else {
        // Enable notifications
        const permission = await pushNotificationService.requestPermission()
        if (permission === 'granted' && userId) {
          await pushNotificationService.subscribeUser(userId)
          setNotificationsEnabled(true)
          toast.success('Push notifications enabled!')
        } else {
          toast.error('Permission denied for push notifications')
        }
      }
    } catch (error) {
      console.error('Error toggling notifications:', error)
      toast.error('Failed to update notification settings')
    }
  }, [notificationsEnabled, userId])

  // Format time remaining for delivery countdown
   const formatTimeRemaining = (milliseconds: number): string => {
     const minutes = Math.floor(milliseconds / (1000 * 60))
     const hours = Math.floor(minutes / 60)
     const remainingMinutes = minutes % 60
     
     if (hours > 0) {
       return `${hours}h ${remainingMinutes}m`
     }
     return `${remainingMinutes}m`
   }

   // Filter preset management functions
   const saveFilterPreset = useCallback(() => {
     if (!presetName.trim()) {
       toast.error('Please enter a preset name');
       return;
     }

     const newPreset = {
       id: Date.now().toString(),
       name: presetName,
       filters: {
         statusFilter,
         orderTypeFilter,
         dateFilter,
         sortBy
       },
       createdAt: new Date().toISOString()
     };

     const updatedPresets = [...filterPresets, newPreset];
     setFilterPresets(updatedPresets);
     localStorage.setItem(`orderFilterPresets_${userId}`, JSON.stringify(updatedPresets));
     
     setPresetName('');
     setShowPresetModal(false);
     toast.success(`Filter preset "${presetName}" saved!`);
   }, [presetName, statusFilter, orderTypeFilter, dateFilter, sortBy, filterPresets, userId]);

   const applyFilterPreset = useCallback((preset: any) => {
     setStatusFilter(preset.filters.statusFilter);
     setOrderTypeFilter(preset.filters.orderTypeFilter);
     setDateFilter(preset.filters.dateFilter);
     setSortBy(preset.filters.sortBy);
     toast.success(`Applied preset "${preset.name}"`);
   }, []);

   const deleteFilterPreset = useCallback((presetId: string) => {
     const updatedPresets = filterPresets.filter(p => p.id !== presetId);
     setFilterPresets(updatedPresets);
     localStorage.setItem(`orderFilterPresets_${userId}`, JSON.stringify(updatedPresets));
     toast.success('Filter preset deleted');
   }, [filterPresets, userId]);

   // Helper function for status display names
   const getStatusDisplayName = (status: OrderStatus): string => {
     return status.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
   };

   // Chat functionality
   const openChatWithOrder = useCallback((order: Order) => {
     setChatOrderContext(order);
     setShowChat(true);
     
     // Add initial context message if not already present
     const contextMessage = {
       id: Date.now().toString(),
       type: 'system',
       content: `Chat started for Order #${order.orderNumber}`,
       timestamp: new Date(),
       isSupport: false
     };
     
     setChatMessages(prev => {
       const hasContext = prev.some(msg => msg.content.includes(order.orderNumber));
       return hasContext ? prev : [contextMessage, ...prev];
     });
   }, []);

   const sendChatMessage = useCallback(async () => {
     if (!chatInput.trim()) return;

     const userMessage = {
       id: Date.now().toString(),
       type: 'user',
       content: chatInput,
       timestamp: new Date(),
       isSupport: false
     };

     setChatMessages(prev => [userMessage, ...prev]);
     setChatInput('');
     setIsChatLoading(true);

     // Simulate support response
     setTimeout(() => {
       const supportMessage = {
         id: (Date.now() + 1).toString(),
         type: 'support',
         content: generateSupportResponse(chatInput, chatOrderContext),
         timestamp: new Date(),
         isSupport: true
       };
       
       setChatMessages(prev => [supportMessage, ...prev]);
       setIsChatLoading(false);
     }, 1500);
   }, [chatInput, chatOrderContext]);

   const generateSupportResponse = (userMessage: string, order: Order | null): string => {
     const lowerMessage = userMessage.toLowerCase();
     
     if (lowerMessage.includes('status') || lowerMessage.includes('where')) {
       return order ? 
         `Your order #${order.orderNumber} is currently ${getStatusDisplayName(order.status)}. ${getStatusMessage(order.status)}` :
         'I can help you check your order status. Please provide your order number.';
     }
     
     if (lowerMessage.includes('cancel')) {
       return order && ['pending', 'confirmed'].includes(order.status) ?
         `I can help you cancel order #${order.orderNumber}. Please confirm if you'd like to proceed with the cancellation.` :
         'This order cannot be cancelled as it\'s already being prepared or has been completed.';
     }
     
     if (lowerMessage.includes('change') || lowerMessage.includes('modify')) {
       return order && order.status === 'pending' ?
         `I can help you modify order #${order.orderNumber}. What changes would you like to make?` :
         'Unfortunately, this order cannot be modified as it\'s already being prepared.';
     }
     
     if (lowerMessage.includes('delivery') || lowerMessage.includes('time')) {
       return order && order.type === 'delivery' ?
         `Your delivery order #${order.orderNumber} is estimated to arrive in ${order.estimatedDeliveryTime ? formatTimeRemaining(new Date(order.estimatedDeliveryTime)) : '30-45 minutes'}.` :
         'For pickup orders, you can collect your order once it\'s ready. We\'ll notify you when it\'s prepared.';
     }
     
     return 'Thank you for contacting us! How can I assist you with your order today? I can help with order status, modifications, cancellations, and delivery information.';
   };

   const getStatusMessage = (status: OrderStatus): string => {
     switch (status) {
       case 'pending': return 'We\'ve received your order and will confirm it shortly.';
       case 'confirmed': return 'Your order has been confirmed and will be prepared soon.';
       case 'preparing': return 'Our kitchen is currently preparing your order.';
       case 'ready': return 'Your order is ready for pickup!';
       case 'out_for_delivery': return 'Your order is on its way to you!';
       case 'delivered': return 'Your order has been delivered. Enjoy your meal!';
       case 'completed': return 'Your order has been completed.';
       case 'cancelled': return 'This order has been cancelled.';
       default: return 'We\'re processing your order.';
     }
   };

   // Driver tracking functionality
   const startDriverTracking = useCallback(async (order: Order) => {
     if (!order.otwOrderId || order.status !== 'out_for_delivery') return;

     setTrackingOrders(prev => new Set([...prev, order.id]));
     
     try {
       const trackingData = await getOTWOrderStatus(order.otwOrderId);
       
       if (trackingData.driver_location) {
         setDriverLocations(prev => ({
           ...prev,
           [order.id]: {
             lat: trackingData.driver_location.lat,
             lng: trackingData.driver_location.lng,
             lastUpdated: new Date()
           }
         }));
       }
     } catch (error) {
       console.error('Failed to get driver location:', error);
       toast.error('Unable to track driver location');
     }
   }, []);

   const stopDriverTracking = useCallback((orderId: string) => {
     setTrackingOrders(prev => {
       const newSet = new Set(prev);
       newSet.delete(orderId);
       return newSet;
     });
     
     setDriverLocations(prev => {
       const newLocations = { ...prev };
       delete newLocations[orderId];
       return newLocations;
     });
   }, []);

   // Real-time driver location updates
   useEffect(() => {
     if (trackingOrders.size === 0) return;

     const updateDriverLocations = async () => {
       for (const orderId of trackingOrders) {
         const order = orders.find(o => o.id === orderId);
         if (!order?.otwOrderId) continue;

         try {
           const trackingData = await getOTWOrderStatus(order.otwOrderId);
           
           if (trackingData.driver_location) {
             setDriverLocations(prev => ({
               ...prev,
               [orderId]: {
                 lat: trackingData.driver_location.lat,
                 lng: trackingData.driver_location.lng,
                 lastUpdated: new Date()
               }
             }));
           }
         } catch (error) {
           console.error(`Failed to update driver location for order ${orderId}:`, error);
         }
       }
     };

     // Update driver locations every 30 seconds
     const interval = setInterval(updateDriverLocations, 30000);
     
     // Initial update
     updateDriverLocations();

     return () => clearInterval(interval);
   }, [trackingOrders, orders]);

   // Auto-start tracking for out_for_delivery orders
   useEffect(() => {
     orders.forEach(order => {
       if (order.status === 'out_for_delivery' && order.otwOrderId && !trackingOrders.has(order.id)) {
         startDriverTracking(order);
       } else if (order.status !== 'out_for_delivery' && trackingOrders.has(order.id)) {
         stopDriverTracking(order.id);
       }
     });
   }, [orders, trackingOrders, startDriverTracking, stopDriverTracking]);

   // Dynamic pricing calculation functions
   const calculatePricingUpdate = useCallback(async (order: Order, modifications: any[]) => {
     setIsCalculatingPrice(true);
     
     try {
       // Simulate pricing calculation based on modifications
       let updatedTotal = order.subtotal;
       const changes: any[] = [];
       
       modifications.forEach(mod => {
         switch (mod.type) {
           case 'add_item':
             updatedTotal += mod.item.price * mod.item.quantity;
             changes.push({
               type: 'addition',
               description: `Added ${mod.item.quantity}x ${mod.item.name}`,
               amount: mod.item.price * mod.item.quantity
             });
             break;
           case 'remove_item':
             updatedTotal -= mod.item.price * mod.item.quantity;
             changes.push({
               type: 'removal',
               description: `Removed ${mod.item.quantity}x ${mod.item.name}`,
               amount: -(mod.item.price * mod.item.quantity)
             });
             break;
           case 'modify_quantity':
             const priceDiff = (mod.newQuantity - mod.oldQuantity) * mod.item.price;
             updatedTotal += priceDiff;
             changes.push({
               type: priceDiff > 0 ? 'addition' : 'removal',
               description: `Changed ${mod.item.name} quantity from ${mod.oldQuantity} to ${mod.newQuantity}`,
               amount: priceDiff
             });
             break;
           case 'delivery_change':
             const deliveryDiff = mod.newDeliveryFee - (order.deliveryFee || 0);
             updatedTotal += deliveryDiff;
             changes.push({
               type: deliveryDiff > 0 ? 'addition' : 'removal',
               description: `Delivery fee ${deliveryDiff > 0 ? 'increased' : 'decreased'}`,
               amount: deliveryDiff
             });
             break;
         }
       });
       
       // Add tax calculation
       const taxRate = 0.08; // 8% tax rate
       const newTax = updatedTotal * taxRate;
       const finalTotal = updatedTotal + newTax + (order.deliveryFee || 0);
       
       setPricingUpdates(prev => ({
         ...prev,
         [order.id]: {
           originalTotal: order.total,
           updatedTotal: finalTotal,
           changes
         }
       }));
       
       toast.success('Pricing updated successfully');
     } catch (error) {
       console.error('Failed to calculate pricing update:', error);
       toast.error('Failed to calculate updated pricing');
     } finally {
       setIsCalculatingPrice(false);
     }
   }, []);

   const simulateOrderModification = useCallback((order: Order) => {
     // Simulate some common order modifications
     const modifications = [
       {
         type: 'add_item',
         item: { name: 'Extra Sauce', price: 2.50, quantity: 1 }
       },
       {
         type: 'modify_quantity',
         item: order.items[0],
         oldQuantity: order.items[0].quantity,
         newQuantity: order.items[0].quantity + 1
       }
     ];
     
     calculatePricingUpdate(order, modifications);
     setShowPricingModal(order.id);
   }, [calculatePricingUpdate]);

   const applyPricingUpdate = useCallback(async (orderId: string) => {
     const update = pricingUpdates[orderId];
     if (!update) return;
     
     try {
       // In a real app, this would make an API call to update the order
       toast.success(`Order pricing updated! New total: ${formatCurrency(update.updatedTotal)}`);
       
       // Update the local order state
       setOrders(prev => prev.map(order => 
         order.id === orderId 
           ? { ...order, total: update.updatedTotal }
           : order
       ));
       
       setShowPricingModal(null);
     } catch (error) {
       console.error('Failed to apply pricing update:', error);
       toast.error('Failed to update order pricing');
     }
   }, [pricingUpdates]);

   const formatCurrency = (amount: number): string => {
      return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(amount);
    };

    // Order modification functions
    const openModifyOrder = useCallback((order: Order) => {
      if (order.status !== 'pending') {
        toast.error('Only pending orders can be modified');
        return;
      }
      
      // Initialize modification items with current order items
      const currentItems = order.items.map(item => ({
        ...item,
        isOriginal: true,
        canModify: true
      }));
      
      setModificationItems(currentItems);
      setShowModifyModal(order.id);
    }, []);

    const addItemToModification = useCallback((item: any) => {
      const newItem = {
        ...item,
        id: `mod_${Date.now()}`,
        quantity: 1,
        isOriginal: false,
        canModify: true
      };
      
      setModificationItems(prev => [...prev, newItem]);
      toast.success(`Added ${item.name} to order`);
    }, []);

    const removeItemFromModification = useCallback((itemId: string) => {
      setModificationItems(prev => {
        const item = prev.find(i => i.id === itemId);
        if (item?.isOriginal) {
          toast.error('Cannot remove original items. You can only reduce quantity to 0.');
          return prev;
        }
        return prev.filter(i => i.id !== itemId);
      });
    }, []);

    const updateItemQuantity = useCallback((itemId: string, newQuantity: number) => {
      if (newQuantity < 0) return;
      
      setModificationItems(prev => 
        prev.map(item => 
          item.id === itemId 
            ? { ...item, quantity: newQuantity }
            : item
        )
      );
    }, []);

    const calculateModificationTotal = useCallback(() => {
      return modificationItems.reduce((total, item) => {
        return total + (item.price * item.quantity);
      }, 0);
    }, [modificationItems]);

    const applyOrderModification = useCallback(async (orderId: string) => {
      setIsModifying(true);
      
      try {
        const order = orders.find(o => o.id === orderId);
        if (!order) throw new Error('Order not found');
        
        // Calculate new totals
        const newSubtotal = calculateModificationTotal();
        const newTax = newSubtotal * 0.08; // 8% tax
        const newTotal = newSubtotal + newTax + (order.deliveryFee || 0);
        
        // Filter out items with 0 quantity
        const finalItems = modificationItems.filter(item => item.quantity > 0);
        
        // Update the order
        const updatedOrder = {
          ...order,
          items: finalItems,
          subtotal: newSubtotal,
          tax: newTax,
          total: newTotal,
          updatedAt: new Date()
        };
        
        // Update local state
        setOrders(prev => prev.map(o => 
          o.id === orderId ? updatedOrder : o
        ));
        
        // Calculate pricing update for display
        const modifications = [];
        const originalTotal = order.total;
        const difference = newTotal - originalTotal;
        
        if (difference !== 0) {
          modifications.push({
            type: difference > 0 ? 'addition' : 'removal',
            description: `Order modification (${finalItems.length} items)`,
            amount: difference
          });
        }
        
        // Show pricing update if there's a change
        if (difference !== 0) {
          setPricingUpdates(prev => ({
            ...prev,
            [orderId]: {
              originalTotal,
              updatedTotal: newTotal,
              changes: modifications
            }
          }));
        }
        
        setShowModifyModal(null);
        toast.success('Order modified successfully!');
        
      } catch (error) {
        console.error('Failed to modify order:', error);
        toast.error('Failed to modify order');
      } finally {
        setIsModifying(false);
      }
    }, [orders, modificationItems, calculateModificationTotal]);

   // Interactive Order Status Timeline Component
   const OrderStatusTimeline = ({ order }: { order: Order }) => {
     const statusSteps = [
       { key: 'pending', label: 'Order Placed', icon: Package, description: 'Your order has been received' },
       { key: 'confirmed', label: 'Confirmed', icon: CheckCircle, description: 'Order confirmed by restaurant' },
       { key: 'preparing', label: 'Preparing', icon: ChefHat, description: 'Your food is being prepared' },
       { key: 'ready', label: 'Ready', icon: Clock, description: 'Order is ready for pickup/delivery' },
       ...(order.type === 'delivery' ? [{ key: 'out_for_delivery', label: 'Out for Delivery', icon: Truck, description: 'Driver is on the way' }] : []),
       { key: 'delivered', label: order.type === 'delivery' ? 'Delivered' : 'Picked Up', icon: CheckCircle, description: 'Order completed successfully' }
     ]

     const getCurrentStepIndex = () => {
       return statusSteps.findIndex(step => step.key === order.status)
     }

     const currentStepIndex = getCurrentStepIndex()

     return (
       <div className="py-4">
         <h4 className="font-semibold mb-4 flex items-center gap-2">
           <Clock className="w-4 h-4" />
           Order Progress
         </h4>
         <div className="space-y-4">
           {statusSteps.map((step, index) => {
             const isCompleted = index <= currentStepIndex
             const isCurrent = index === currentStepIndex
             const IconComponent = step.icon
             
             return (
               <div key={step.key} className="flex items-start gap-3">
                 <div className="flex flex-col items-center">
                   <div className={`
                     w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500
                     ${isCompleted 
                       ? 'bg-green-500 text-white scale-110' 
                       : isCurrent 
                         ? 'bg-blue-500 text-white animate-pulse scale-110' 
                         : 'bg-gray-200 text-gray-400'
                     }
                   `}>
                     <IconComponent className="w-4 h-4" />
                   </div>
                   {index < statusSteps.length - 1 && (
                     <div className={`
                       w-0.5 h-8 mt-2 transition-all duration-500
                       ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}
                     `} />
                   )}

       {/* Order Modification Modal */}
       {showModifyModal && (
         <Dialog open={!!showModifyModal} onOpenChange={() => setShowModifyModal(null)}>
           <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
             <DialogHeader>
               <DialogTitle className="flex items-center gap-2">
                 <Edit className="h-5 w-5 text-orange-600" />
                 Modify Order #{showModifyModal.slice(-6)}
               </DialogTitle>
             </DialogHeader>
             
             <div className="space-y-6">
               {/* Current Order Items */}
               <div>
                 <h4 className="font-medium mb-3 flex items-center gap-2">
                   <Package className="h-4 w-4" />
                   Current Items
                 </h4>
                 <div className="space-y-2 max-h-48 overflow-y-auto">
                   {modificationItems.map((item, index) => (
                     <div key={item.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                       <div className="flex-1">
                         <div className="flex items-center gap-2">
                           <span className="font-medium">{item.name}</span>
                           {item.isOriginal && (
                             <Badge variant="outline" className="text-xs">
                               Original
                             </Badge>
                           )}
                         </div>
                         <p className="text-sm text-gray-600">{formatCurrency(item.price)} each</p>
                       </div>
                       
                       <div className="flex items-center gap-2">
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={() => updateItemQuantity(item.id, item.quantity - 1)}
                           disabled={item.quantity <= (item.isOriginal ? 0 : 1)}
                         >
                           -
                         </Button>
                         <span className="w-8 text-center">{item.quantity}</span>
                         <Button
                           variant="outline"
                           size="sm"
                           onClick={() => updateItemQuantity(item.id, item.quantity + 1)}
                         >
                           +
                         </Button>
                         
                         {!item.isOriginal && (
                           <Button
                             variant="outline"
                             size="sm"
                             onClick={() => removeItemFromModification(item.id)}
                             className="text-red-600 hover:bg-red-50"
                           >
                             <Trash2 className="h-4 w-4" />
                           </Button>
                         )}
                       </div>
                       
                       <div className="text-right ml-4">
                         <span className="font-medium">
                           {formatCurrency(item.price * item.quantity)}
                         </span>
                       </div>
                     </div>
                   ))}
                 </div>
               </div>

               {/* Add Items Section */}
               <div>
                 <h4 className="font-medium mb-3 flex items-center gap-2">
                   <DollarSign className="h-4 w-4" />
                   Add Items
                 </h4>
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                   {availableItems.map((item) => (
                     <div key={item.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                       <div>
                         <span className="font-medium">{item.name}</span>
                         <p className="text-sm text-gray-600">{item.category} • {formatCurrency(item.price)}</p>
                       </div>
                       <Button
                         variant="outline"
                         size="sm"
                         onClick={() => addItemToModification(item)}
                         className="text-green-600 border-green-200 hover:bg-green-50"
                       >
                         Add
                       </Button>
                     </div>
                   ))}
                 </div>
               </div>

               {/* Order Summary */}
               <div className="bg-blue-50 p-4 rounded-lg">
                 <h4 className="font-medium mb-3 flex items-center gap-2">
                   <Calculator className="h-4 w-4" />
                   Updated Order Summary
                 </h4>
                 <div className="space-y-2">
                   <div className="flex justify-between">
                     <span>Subtotal ({modificationItems.filter(i => i.quantity > 0).length} items):</span>
                     <span>{formatCurrency(calculateModificationTotal())}</span>
                   </div>
                   <div className="flex justify-between">
                     <span>Tax (8%):</span>
                     <span>{formatCurrency(calculateModificationTotal() * 0.08)}</span>
                   </div>
                   <div className="flex justify-between">
                     <span>Delivery Fee:</span>
                     <span>{formatCurrency(orders.find(o => o.id === showModifyModal)?.deliveryFee || 0)}</span>
                   </div>
                   <div className="border-t pt-2 flex justify-between font-bold text-lg">
                     <span>New Total:</span>
                     <span className="text-green-600">
                       {formatCurrency(
                         calculateModificationTotal() + 
                         (calculateModificationTotal() * 0.08) + 
                         (orders.find(o => o.id === showModifyModal)?.deliveryFee || 0)
                       )}
                     </span>
                   </div>
                 </div>
               </div>

               {/* Action Buttons */}
               <div className="flex gap-2 pt-4">
                 <Button
                   variant="outline"
                   onClick={() => setShowModifyModal(null)}
                   className="flex-1"
                   disabled={isModifying}
                 >
                   Cancel
                 </Button>
                 <Button
                   onClick={() => applyOrderModification(showModifyModal)}
                   className="flex-1 bg-orange-600 hover:bg-orange-700"
                   disabled={isModifying || modificationItems.filter(i => i.quantity > 0).length === 0}
                 >
                   {isModifying ? (
                     <div className="flex items-center gap-2">
                       <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                       Updating...
                     </div>
                   ) : (
                     'Apply Changes'
                   )}
                 </Button>
               </div>
               
               {/* Disclaimer */}
               <div className="text-xs text-gray-500 bg-yellow-50 border border-yellow-200 rounded p-2">
                 <AlertCircle className="h-3 w-3 inline mr-1" />
                 Order modifications are subject to kitchen availability. Changes may affect preparation time.
               </div>
             </div>
           </DialogContent>
         </Dialog>
       )}
                 </div>
                 <div className="flex-1 pb-4">
                   <div className={`
                     font-medium transition-all duration-300
                     ${isCompleted ? 'text-green-700' : isCurrent ? 'text-blue-700' : 'text-gray-500'}
                   `}>
                     {step.label}
                   </div>
                   <div className={`
                     text-sm transition-all duration-300
                     ${isCompleted ? 'text-green-600' : isCurrent ? 'text-blue-600' : 'text-gray-400'}
                   `}>
                     {step.description}
                   </div>
                   {isCurrent && (
                     <div className="mt-2">
                       <div className="w-full bg-gray-200 rounded-full h-1.5">
                         <div className="bg-blue-500 h-1.5 rounded-full animate-pulse" style={{ width: '70%' }} />
                       </div>
                     </div>
                   )}
                 </div>
               </div>
             )
           })}
         </div>
       </div>
     )
   }
 
    const getStatusColor = (status: OrderStatus): string => {
    switch (status) {
      case 'pending': return 'bg-gray-500 text-white animate-pulse'
      case 'confirmed': return 'bg-blue-500 text-white'
      case 'preparing': return 'bg-orange-500 text-white animate-pulse'
      case 'ready': return 'bg-green-500 text-white animate-bounce'
      case 'out-for-delivery': return 'bg-purple-500 text-white animate-pulse'
      case 'delivered': return 'bg-emerald-500 text-white'
      case 'completed': return 'bg-emerald-600 text-white'
      case 'cancelled': return 'bg-red-500 text-white'
      default: return 'bg-gray-500 text-white'
    }
  }

  // Connection status indicator
  const getConnectionStatusIcon = () => {
    switch (connectionStatus) {
      case 'connected':
        return <Wifi className="h-4 w-4 text-green-500" />
      case 'connecting':
        return <RefreshCw className="h-4 w-4 text-yellow-500 animate-spin" />
      case 'disconnected':
        return <WifiOff className="h-4 w-4 text-red-500" />
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
  }).sort((a, b) => {
    switch (sortBy) {
      case 'newest':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      case 'oldest':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      case 'status':
        const statusOrder = ['pending', 'confirmed', 'preparing', 'ready', 'out-for-delivery', 'delivered', 'completed', 'cancelled']
        return statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status)
      case 'total':
        return b.total - a.total
      default:
        return 0
    }
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
      <Card className="hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-l-4 border-l-transparent hover:border-l-blue-500">
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
              {order.status === 'out_for_delivery' && estimatedTimes[order.id] ? (
                <div className="flex items-center gap-1">
                  <Timer className="w-4 h-4 text-orange-500" />
                  <span className="text-orange-600 font-medium">
                    Arriving in {formatTimeRemaining(estimatedTimes[order.id])}
                  </span>
                </div>
              ) : (
                <span className="text-blue-700">Estimated: {order.estimatedTime}</span>
              )}
            </div>
          )}

          {/* OTW Tracking for delivery orders */}
          {order.orderType === 'delivery' && order.otwOrderId && isActiveOrder(order.status) && (
            <div className="border-t pt-3">
              <OTWTracker order={order} />
            </div>
          )}

          {/* Driver Location Tracking */}
          {order.status === 'out_for_delivery' && order.otwOrderId && (
            <div className="bg-blue-50 p-3 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Truck className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-700">Driver Tracking</span>
                  {trackingOrders.has(order.id) && (
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                  )}
                </div>
                {driverLocations[order.id] && (
                  <span className="text-xs text-blue-600">
                    Updated {Math.floor((Date.now() - driverLocations[order.id].lastUpdated.getTime()) / 60000)}m ago
                  </span>
                )}
              </div>
              
              {driverLocations[order.id] ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-4 h-4 text-green-500" />
                    <span>Driver location: {driverLocations[order.id].lat.toFixed(4)}, {driverLocations[order.id].lng.toFixed(4)}</span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowDriverMap(order.id)}
                    className="w-full flex items-center gap-1"
                  >
                    <MapPin className="w-4 h-4" />
                    View on Map
                  </Button>
                </div>
              ) : (
                <div className="text-sm text-blue-600">
                  {trackingOrders.has(order.id) ? 'Getting driver location...' : 'Driver location unavailable'}
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedOrder(order)}
              className="flex items-center gap-1 transition-all duration-200 hover:scale-105 hover:shadow-md"
            >
              <Eye className="w-4 h-4" />
              Details
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => openChatWithOrder(order)}
              className="flex items-center gap-1 transition-all duration-200 hover:scale-105 hover:shadow-md hover:bg-green-50 hover:border-green-300"
            >
              <MessageCircle className="w-4 h-4" />
              Chat
            </Button>
            
            {order.status === 'pending' ? (
               <Button
                 variant="outline"
                 size="sm"
                 onClick={() => openModifyOrder(order)}
                 className="flex items-center gap-1 text-orange-600 border-orange-200 hover:bg-orange-50 transition-all duration-200 hover:scale-105 hover:shadow-md hover:border-orange-400"
               >
                 <Edit className="w-4 h-4" />
                 Modify
               </Button>
             ) : (
               <Button
                 variant="outline"
                 size="sm"
                 onClick={() => handleReorder(order)}
                 className="flex items-center gap-1 transition-all duration-200 hover:scale-105 hover:shadow-md hover:bg-blue-50 hover:border-blue-300"
               >
                 <RotateCcw className="w-4 h-4" />
                 Reorder
               </Button>
             )}
            
            {/* Dynamic Pricing Button for pending orders */}
            {order.status === 'pending' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => simulateOrderModification(order)}
                className="flex items-center gap-1 text-green-600 border-green-200 hover:bg-green-50"
                disabled={isCalculatingPrice}
              >
                <DollarSign className="w-4 h-4" />
                {isCalculatingPrice ? 'Calculating...' : 'Update Pricing'}
              </Button>
            )}
            
            {/* Show pricing update indicator */}
            {pricingUpdates[order.id] && (
              <Badge variant="outline" className="text-green-600 border-green-200">
                Price Updated
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Skeleton Loader Component
  const OrderSkeleton = () => (
    <Card className="animate-pulse">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-6 w-20 bg-gray-200 rounded"></div>
            <div className="h-6 w-16 bg-gray-200 rounded"></div>
          </div>
          <div className="text-right">
            <div className="h-4 w-16 bg-gray-200 rounded mb-1"></div>
            <div className="h-3 w-20 bg-gray-200 rounded"></div>
          </div>
        </div>
        <div className="mt-3">
          <div className="w-full h-2 bg-gray-200 rounded-full"></div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-2">
            <div className="h-4 w-24 bg-gray-200 rounded"></div>
            <div className="h-6 w-16 bg-gray-200 rounded"></div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <div className="h-4 w-32 bg-gray-200 rounded"></div>
              <div className="h-4 w-12 bg-gray-200 rounded"></div>
            </div>
            <div className="flex justify-between">
              <div className="h-4 w-28 bg-gray-200 rounded"></div>
              <div className="h-4 w-12 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <div className="h-8 w-20 bg-gray-200 rounded"></div>
          <div className="h-8 w-16 bg-gray-200 rounded"></div>
          <div className="h-8 w-20 bg-gray-200 rounded"></div>
        </div>
      </CardContent>
    </Card>
  );

  if (isLoading && orders.length === 0) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-blue-700 font-medium">Loading your orders...</span>
        </div>
        <div className="grid gap-4">
          {[...Array(3)].map((_, i) => (
            <OrderSkeleton key={i} />
          ))}
        </div>
      </div>
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
          <div className="flex items-center gap-4">
            <p className="text-muted-foreground">Track your orders in real-time</p>
            
            <div className="flex items-center gap-2">
              {getConnectionStatusIcon()}
              <span className="text-xs text-muted-foreground capitalize">
                {connectionStatus}
              </span>
            </div>
            
            {/* Auto-refresh indicator */}
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${autoRefreshEnabled ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`}></div>
              <span className="text-xs text-muted-foreground">
                Auto-refresh {autoRefreshEnabled ? 'ON' : 'OFF'}
              </span>
            </div>
            
            {/* Last refresh time */}
            {lastRefresh && (
              <span className="text-xs text-muted-foreground">
                Last updated: {lastRefresh.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleNotifications}
            className="flex items-center gap-2"
          >
            {notificationsEnabled ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
            <span className="hidden sm:inline">
              {notificationsEnabled ? 'Notifications On' : 'Notifications Off'}
            </span>
          </Button>
          <Button
            variant="outline"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="flex items-center gap-2 transition-all duration-200 hover:scale-105"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-500' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
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
          
          <select
             value={sortBy}
             onChange={(e) => setSortBy(e.target.value as any)}
             className="px-3 py-2 border border-input bg-background rounded-md"
             disabled={isLoading}
           >
             <option value="newest">Newest First</option>
             <option value="oldest">Oldest First</option>
             <option value="status">By Status</option>
             <option value="total">By Total Amount</option>
           </select>

           {/* Filter Presets Dropdown */}
           {filterPresets.length > 0 && (
             <select
               onChange={(e) => {
                 if (e.target.value) {
                   const preset = filterPresets.find(p => p.id === e.target.value);
                   if (preset) applyFilterPreset(preset);
                 }
               }}
               className="px-3 py-2 border border-input bg-background rounded-md"
               disabled={isLoading}
               value=""
             >
               <option value="">Apply Preset...</option>
               {filterPresets.map((preset) => (
                 <option key={preset.id} value={preset.id}>
                   {preset.name}
                 </option>
               ))}
             </select>
           )}

           {/* Save Preset Button */}
           <Button
             variant="outline"
             size="sm"
             onClick={() => setShowPresetModal(true)}
             className="flex items-center gap-2"
             disabled={isLoading}
           >
             <Save className="h-4 w-4" />
             Save Preset
           </Button>
          
          {/* Clear Filters Button */}
          {(searchTerm || statusFilter !== 'all' || orderTypeFilter !== 'all' || dateFilter !== 'all' || sortBy !== 'newest') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm('')
                setStatusFilter('all')
                setOrderTypeFilter('all')
                setDateFilter('all')
                setSortBy('newest')
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
            <div className="space-y-6">
              {/* Header Skeleton */}
              <div className="flex justify-between items-center">
                <div className="h-8 bg-gray-200 rounded w-48 animate-pulse"></div>
                <div className="flex gap-2">
                  <div className="h-10 bg-gray-200 rounded w-24 animate-pulse"></div>
                  <div className="h-10 bg-gray-200 rounded w-20 animate-pulse"></div>
                </div>
              </div>
              
              {/* Search and Filters Skeleton */}
              <div className="flex gap-4">
                <div className="h-10 bg-gray-200 rounded flex-1 animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
                <div className="h-10 bg-gray-200 rounded w-32 animate-pulse"></div>
              </div>
              
              {/* Order Cards Skeleton */}
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="border rounded-lg p-6 space-y-4 animate-pulse">
                    <div className="flex justify-between items-start">
                      <div className="space-y-2">
                        <div className="h-6 bg-gray-200 rounded w-32"></div>
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                      </div>
                      <div className="h-6 bg-gray-200 rounded w-20"></div>
                    </div>
                    <div className="space-y-2">
                      <div className="h-4 bg-gray-200 rounded w-full"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </div>
                  </div>
                ))}
              </div>
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

      {/* Save Filter Preset Modal */}
      {showPresetModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Save Filter Preset</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Preset Name</label>
                <Input
                  value={presetName}
                  onChange={(e) => setPresetName(e.target.value)}
                  placeholder="Enter preset name..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      saveFilterPreset();
                    }
                  }}
                />
              </div>
              
              <div className="text-sm text-muted-foreground">
                <p className="font-medium mb-1">Current filters:</p>
                <ul className="space-y-1">
                  <li>Status: {statusFilter === 'all' ? 'All' : getStatusDisplayName(statusFilter as OrderStatus)}</li>
                  <li>Type: {orderTypeFilter === 'all' ? 'All' : orderTypeFilter}</li>
                  <li>Date: {dateFilter === 'all' ? 'All time' : dateFilter}</li>
                  <li>Sort: {sortBy}</li>
                </ul>
              </div>
              
              <div className="flex gap-2 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowPresetModal(false);
                    setPresetName('');
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={saveFilterPreset} disabled={!presetName.trim()}>
                  Save Preset
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Manage Filter Presets Modal */}
      {filterPresets.length > 0 && (
        <div className="mb-4">
          <details className="group">
            <summary className="cursor-pointer text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Manage Saved Presets ({filterPresets.length})
            </summary>
            <div className="mt-2 space-y-2 border rounded-lg p-3 bg-muted/30">
              {filterPresets.map((preset) => (
                <div key={preset.id} className="flex items-center justify-between p-2 bg-background rounded border">
                  <div>
                    <p className="font-medium text-sm">{preset.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Saved {new Date(preset.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => applyFilterPreset(preset)}
                      className="text-xs"
                    >
                      Apply
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => deleteFilterPreset(preset.id)}
                      className="text-xs text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </details>
        </div>
      )}

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

              {/* Interactive Order Status Timeline */}
              <div className="border-t pt-4">
                <OrderStatusTimeline order={selectedOrder} />
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

      {/* Live Chat Widget */}
      {showChat && (
        <div className="fixed bottom-4 right-4 w-96 h-96 bg-white border border-gray-200 rounded-lg shadow-xl z-50 flex flex-col">
          {/* Chat Header */}
          <div className="flex items-center justify-between p-4 border-b bg-blue-600 text-white rounded-t-lg">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <div>
                <h3 className="font-semibold">Order Support</h3>
                {chatOrderContext && (
                  <p className="text-xs opacity-90">Order #{chatOrderContext.orderNumber}</p>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowChat(false)}
              className="text-white hover:bg-blue-700 h-8 w-8 p-0"
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </div>

          {/* Chat Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatMessages.length === 0 ? (
              <div className="text-center text-gray-500 text-sm">
                <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>Start a conversation with our support team</p>
              </div>
            ) : (
              chatMessages.slice().reverse().map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                      message.type === 'user'
                        ? 'bg-blue-600 text-white'
                        : message.type === 'system'
                        ? 'bg-gray-100 text-gray-600 text-xs'
                        : 'bg-gray-200 text-gray-800'
                    }`}
                  >
                    <p>{message.content}</p>
                    <p className={`text-xs mt-1 opacity-70`}>
                      {message.timestamp.toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}
            
            {/* Loading indicator */}
            {isChatLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-200 text-gray-800 max-w-xs px-3 py-2 rounded-lg text-sm">
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-gray-600"></div>
                    <span>Support is typing...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <div className="p-4 border-t">
            <div className="flex gap-2">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type your message..."
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    sendChatMessage();
                  }
                }}
                disabled={isChatLoading}
                className="flex-1"
              />
              <Button
                onClick={sendChatMessage}
                disabled={!chatInput.trim() || isChatLoading}
                size="sm"
                className="px-3"
              >
                <MessageCircle className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Driver Location Map Modal */}
      {showDriverMap && (
        <Dialog open={!!showDriverMap} onOpenChange={() => setShowDriverMap(null)}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Driver Location - Order #{showDriverMap.slice(-6)}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              {driverLocations[showDriverMap] ? (
                <>
                  {/* Driver Info */}
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Truck className="h-5 w-5 text-blue-600" />
                        <span className="font-medium text-blue-700">Driver Location</span>
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      </div>
                      <span className="text-sm text-blue-600">
                        Last updated: {driverLocations[showDriverMap].lastUpdated.toLocaleTimeString()}
                      </span>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Latitude:</span>
                        <p className="font-mono">{driverLocations[showDriverMap].lat.toFixed(6)}</p>
                      </div>
                      <div>
                        <span className="text-gray-600">Longitude:</span>
                        <p className="font-mono">{driverLocations[showDriverMap].lng.toFixed(6)}</p>
                      </div>
                    </div>
                  </div>

                  {/* Map Placeholder */}
                  <div className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-600 mb-2">Interactive Map</h3>
                    <p className="text-gray-500 mb-4">
                      Driver location: {driverLocations[showDriverMap].lat.toFixed(4)}, {driverLocations[showDriverMap].lng.toFixed(4)}
                    </p>
                    <div className="bg-white border rounded-lg p-4 text-left">
                      <h4 className="font-medium mb-2">Map Integration Available</h4>
                      <p className="text-sm text-gray-600">
                        This area would display an interactive map with:
                      </p>
                      <ul className="text-sm text-gray-600 mt-2 space-y-1">
                        <li>• Real-time driver location marker</li>
                        <li>• Delivery route visualization</li>
                        <li>• Estimated arrival time</li>
                        <li>• Traffic conditions</li>
                      </ul>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => startDriverTracking(orders.find(o => o.id === showDriverMap)!)}
                      variant="outline"
                      className="flex items-center gap-2"
                    >
                      <RefreshCw className="h-4 w-4" />
                      Refresh Location
                    </Button>
                    <Button
                      onClick={() => {
                        const location = driverLocations[showDriverMap];
                        const url = `https://maps.google.com/?q=${location.lat},${location.lng}`;
                        window.open(url, '_blank');
                      }}
                      className="flex items-center gap-2"
                    >
                      <MapPin className="h-4 w-4" />
                      Open in Google Maps
                    </Button>
                  </div>
                </>
              ) : (
                <div className="text-center py-8">
                  <Truck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">Driver Location Unavailable</h3>
                  <p className="text-gray-500">Unable to retrieve driver location at this time.</p>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
       )}

       {/* Dynamic Pricing Update Modal */}
       {showPricingModal && pricingUpdates[showPricingModal] && (
         <Dialog open={!!showPricingModal} onOpenChange={() => setShowPricingModal(null)}>
           <DialogContent className="max-w-lg">
             <DialogHeader>
               <DialogTitle className="flex items-center gap-2">
                 <DollarSign className="h-5 w-5 text-green-600" />
                 Pricing Update - Order #{showPricingModal.slice(-6)}
               </DialogTitle>
             </DialogHeader>
             
             <div className="space-y-4">
               {/* Original vs Updated Pricing */}
               <div className="bg-gray-50 p-4 rounded-lg">
                 <div className="flex justify-between items-center mb-3">
                   <span className="text-sm font-medium text-gray-600">Original Total:</span>
                   <span className="text-lg font-semibold text-gray-800">
                     {formatCurrency(pricingUpdates[showPricingModal].originalTotal)}
                   </span>
                 </div>
                 <div className="flex justify-between items-center">
                   <span className="text-sm font-medium text-green-600">Updated Total:</span>
                   <span className="text-xl font-bold text-green-600">
                     {formatCurrency(pricingUpdates[showPricingModal].updatedTotal)}
                   </span>
                 </div>
                 
                 {/* Price Difference */}
                 <div className="mt-3 pt-3 border-t border-gray-200">
                   <div className="flex justify-between items-center">
                     <span className="text-sm font-medium">Difference:</span>
                     <span className={`text-lg font-semibold ${
                       pricingUpdates[showPricingModal].updatedTotal > pricingUpdates[showPricingModal].originalTotal
                         ? 'text-red-600'
                         : 'text-green-600'
                     }`}>
                       {pricingUpdates[showPricingModal].updatedTotal > pricingUpdates[showPricingModal].originalTotal ? '+' : ''}
                       {formatCurrency(pricingUpdates[showPricingModal].updatedTotal - pricingUpdates[showPricingModal].originalTotal)}
                     </span>
                   </div>
                 </div>
               </div>

               {/* Changes Breakdown */}
               <div>
                 <h4 className="font-medium mb-3 flex items-center gap-2">
                   <AlertCircle className="h-4 w-4" />
                   Changes Made
                 </h4>
                 <div className="space-y-2">
                   {pricingUpdates[showPricingModal].changes.map((change, index) => (
                     <div key={index} className="flex justify-between items-center p-2 bg-white border rounded">
                       <span className="text-sm">{change.description}</span>
                       <span className={`text-sm font-medium ${
                         change.type === 'addition' ? 'text-green-600' : 'text-red-600'
                       }`}>
                         {change.type === 'addition' ? '+' : ''}{formatCurrency(change.amount)}
                       </span>
                     </div>
                   ))}
                 </div>
               </div>

               {/* Action Buttons */}
               <div className="flex gap-2 pt-4">
                 <Button
                   variant="outline"
                   onClick={() => setShowPricingModal(null)}
                   className="flex-1"
                 >
                   Cancel
                 </Button>
                 <Button
                   onClick={() => applyPricingUpdate(showPricingModal)}
                   className="flex-1 bg-green-600 hover:bg-green-700"
                 >
                   Apply Update
                 </Button>
               </div>
               
               {/* Disclaimer */}
               <div className="text-xs text-gray-500 bg-yellow-50 border border-yellow-200 rounded p-2">
                 <AlertCircle className="h-3 w-3 inline mr-1" />
                 Pricing updates are calculated in real-time based on current menu prices and availability.
               </div>
             </div>
           </DialogContent>
         </Dialog>
       )}
    </div>
  )
}