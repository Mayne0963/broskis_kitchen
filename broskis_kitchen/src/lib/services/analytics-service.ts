import { db, isFirebaseConfigured } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  getDocs,
  Timestamp,
  startAfter,
  endBefore
} from 'firebase/firestore'
import { COLLECTIONS } from '@/lib/firebase/collections'

interface DateRange {
  startDate: Date;
  endDate: Date;
}

interface OrderMetrics {
  totalOrders: number;
  totalRevenue: number;
  averageOrderValue: number;
  completedOrders: number;
  cancelledOrders: number;
  refundedOrders: number;
  completionRate: number;
  cancellationRate: number;
}

interface RevenueMetrics {
  grossRevenue: number;
  netRevenue: number;
  refundAmount: number;
  deliveryFees: number;
  taxes: number;
  tips: number;
}

interface PopularItem {
  id: string;
  name: string;
  orderCount: number;
  revenue: number;
  averageRating?: number;
}

interface CustomerMetrics {
  totalCustomers: number;
  newCustomers: number;
  returningCustomers: number;
  averageOrdersPerCustomer: number;
}

interface DeliveryMetrics {
  totalDeliveries: number;
  averageDeliveryTime: number;
  onTimeDeliveryRate: number;
  deliverySuccessRate: number;
}

interface HourlyData {
  hour: number;
  orderCount: number;
  revenue: number;
}

interface DailyData {
  date: string;
  orderCount: number;
  revenue: number;
  newCustomers: number;
}

class AnalyticsService {
  async getOrderMetrics(dateRange: DateRange): Promise<OrderMetrics> {
    try {
      const ordersQuery = query(
        collection(db, COLLECTIONS.ORDERS),
        where('createdAt', '>=', Timestamp.fromDate(dateRange.startDate)),
        where('createdAt', '<=', Timestamp.fromDate(dateRange.endDate))
      );

      const ordersSnap = await getDocs(ordersQuery);
      const orders = ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      const totalOrders = orders.length;
      const completedOrders = orders.filter(order => order.status === 'delivered').length;
      const cancelledOrders = orders.filter(order => order.status === 'cancelled').length;
      const refundedOrders = orders.filter(order => order.status === 'refunded').length;

      const totalRevenue = orders
        .filter(order => ['delivered', 'completed'].includes(order.status))
        .reduce((sum, order) => sum + (order.pricing?.total || 0), 0);

      const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
      const completionRate = totalOrders > 0 ? (completedOrders / totalOrders) * 100 : 0;
      const cancellationRate = totalOrders > 0 ? (cancelledOrders / totalOrders) * 100 : 0;

      return {
        totalOrders,
        totalRevenue,
        averageOrderValue,
        completedOrders,
        cancelledOrders,
        refundedOrders,
        completionRate,
        cancellationRate
      };
    } catch (error) {
      console.error('Error getting order metrics:', error);
      throw error;
    }
  }

  async getRevenueMetrics(dateRange: DateRange): Promise<RevenueMetrics> {
    try {
      const ordersQuery = query(
        collection(db, COLLECTIONS.ORDERS),
        where('createdAt', '>=', Timestamp.fromDate(dateRange.startDate)),
        where('createdAt', '<=', Timestamp.fromDate(dateRange.endDate)),
        where('status', 'in', ['delivered', 'completed'])
      );

      const ordersSnap = await getDocs(ordersQuery);
      const orders = ordersSnap.docs.map(doc => doc.data());

      const grossRevenue = orders.reduce((sum, order) => sum + (order.pricing?.total || 0), 0);
      const deliveryFees = orders.reduce((sum, order) => sum + (order.pricing?.deliveryFee || 0), 0);
      const taxes = orders.reduce((sum, order) => sum + (order.pricing?.tax || 0), 0);
      const tips = orders.reduce((sum, order) => sum + (order.pricing?.tip || 0), 0);

      // Get refund data
      const refundsQuery = query(
        collection(db, 'refunds'),
        where('createdAt', '>=', Timestamp.fromDate(dateRange.startDate)),
        where('createdAt', '<=', Timestamp.fromDate(dateRange.endDate))
      );

      const refundsSnap = await getDocs(refundsQuery);
      const refunds = refundsSnap.docs.map(doc => doc.data());
      const refundAmount = refunds.reduce((sum, refund) => sum + (refund.amount || 0), 0);

      const netRevenue = grossRevenue - refundAmount;

      return {
        grossRevenue,
        netRevenue,
        refundAmount,
        deliveryFees,
        taxes,
        tips
      };
    } catch (error) {
      console.error('Error getting revenue metrics:', error);
      throw error;
    }
  }

  async getPopularItems(dateRange: DateRange, limitCount: number = 10): Promise<PopularItem[]> {
    try {
      const ordersQuery = query(
        collection(db, COLLECTIONS.ORDERS),
        where('createdAt', '>=', Timestamp.fromDate(dateRange.startDate)),
        where('createdAt', '<=', Timestamp.fromDate(dateRange.endDate)),
        where('status', 'in', ['delivered', 'completed'])
      );

      const ordersSnap = await getDocs(ordersQuery);
      const orders = ordersSnap.docs.map(doc => doc.data());

      // Aggregate item data
      const itemStats: { [key: string]: { name: string; orderCount: number; revenue: number } } = {};

      orders.forEach(order => {
        order.items?.forEach((item: any) => {
          const itemId = item.id || item.menuItemId;
          if (!itemStats[itemId]) {
            itemStats[itemId] = {
              name: item.name,
              orderCount: 0,
              revenue: 0
            };
          }
          itemStats[itemId].orderCount += item.quantity || 1;
          itemStats[itemId].revenue += item.subtotal || (item.price * item.quantity) || 0;
        });
      });

      // Convert to array and sort by order count
      const popularItems = Object.entries(itemStats)
        .map(([id, stats]) => ({
          id,
          name: stats.name,
          orderCount: stats.orderCount,
          revenue: stats.revenue
        }))
        .sort((a, b) => b.orderCount - a.orderCount)
        .slice(0, limitCount);

      return popularItems;
    } catch (error) {
      console.error('Error getting popular items:', error);
      throw error;
    }
  }

  async getCustomerMetrics(dateRange: DateRange): Promise<CustomerMetrics> {
    try {
      const ordersQuery = query(
        collection(db, COLLECTIONS.ORDERS),
        where('createdAt', '>=', Timestamp.fromDate(dateRange.startDate)),
        where('createdAt', '<=', Timestamp.fromDate(dateRange.endDate))
      );

      const ordersSnap = await getDocs(ordersQuery);
      const orders = ordersSnap.docs.map(doc => doc.data());

      // Get unique customers
      const customerIds = new Set(orders.map(order => order.customerId).filter(Boolean));
      const totalCustomers = customerIds.size;

      // Get customer order counts
      const customerOrderCounts: { [key: string]: number } = {};
      orders.forEach(order => {
        if (order.customerId) {
          customerOrderCounts[order.customerId] = (customerOrderCounts[order.customerId] || 0) + 1;
        }
      });

      const newCustomers = Object.values(customerOrderCounts).filter(count => count === 1).length;
      const returningCustomers = totalCustomers - newCustomers;
      const averageOrdersPerCustomer = totalCustomers > 0 ? orders.length / totalCustomers : 0;

      return {
        totalCustomers,
        newCustomers,
        returningCustomers,
        averageOrdersPerCustomer
      };
    } catch (error) {
      console.error('Error getting customer metrics:', error);
      throw error;
    }
  }

  async getDeliveryMetrics(dateRange: DateRange): Promise<DeliveryMetrics> {
    try {
      const ordersQuery = query(
        collection(db, COLLECTIONS.ORDERS),
        where('createdAt', '>=', Timestamp.fromDate(dateRange.startDate)),
        where('createdAt', '<=', Timestamp.fromDate(dateRange.endDate)),
        where('deliveryType', '==', 'delivery')
      );

      const ordersSnap = await getDocs(ordersQuery);
      const orders = ordersSnap.docs.map(doc => doc.data());

      const totalDeliveries = orders.length;
      const successfulDeliveries = orders.filter(order => order.status === 'delivered').length;
      const deliverySuccessRate = totalDeliveries > 0 ? (successfulDeliveries / totalDeliveries) * 100 : 0;

      // Calculate average delivery time (from order creation to delivery)
      const deliveredOrders = orders.filter(order => order.status === 'delivered');
      let totalDeliveryTime = 0;
      let onTimeDeliveries = 0;

      deliveredOrders.forEach(order => {
        const createdAt = new Date(order.createdAt);
        const deliveredAt = order.timeline?.find((event: any) => event.status === 'delivered')?.timestamp;
        
        if (deliveredAt) {
          const deliveryTime = (new Date(deliveredAt).getTime() - createdAt.getTime()) / (1000 * 60); // minutes
          totalDeliveryTime += deliveryTime;
          
          // Check if delivered within estimated time + 15 minutes buffer
          const estimatedTime = order.estimatedTime || 45;
          if (deliveryTime <= estimatedTime + 15) {
            onTimeDeliveries++;
          }
        }
      });

      const averageDeliveryTime = deliveredOrders.length > 0 ? totalDeliveryTime / deliveredOrders.length : 0;
      const onTimeDeliveryRate = deliveredOrders.length > 0 ? (onTimeDeliveries / deliveredOrders.length) * 100 : 0;

      return {
        totalDeliveries,
        averageDeliveryTime,
        onTimeDeliveryRate,
        deliverySuccessRate
      };
    } catch (error) {
      console.error('Error getting delivery metrics:', error);
      throw error;
    }
  }

  async getHourlyData(date: Date): Promise<HourlyData[]> {
    try {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const ordersQuery = query(
        collection(db, COLLECTIONS.ORDERS),
        where('createdAt', '>=', Timestamp.fromDate(startOfDay)),
        where('createdAt', '<=', Timestamp.fromDate(endOfDay))
      );

      const ordersSnap = await getDocs(ordersQuery);
      const orders = ordersSnap.docs.map(doc => doc.data());

      // Initialize hourly data
      const hourlyData: HourlyData[] = Array.from({ length: 24 }, (_, hour) => ({
        hour,
        orderCount: 0,
        revenue: 0
      }));

      // Aggregate data by hour
      orders.forEach(order => {
        const orderDate = new Date(order.createdAt);
        const hour = orderDate.getHours();
        
        hourlyData[hour].orderCount++;
        if (['delivered', 'completed'].includes(order.status)) {
          hourlyData[hour].revenue += order.pricing?.total || 0;
        }
      });

      return hourlyData;
    } catch (error) {
      console.error('Error getting hourly data:', error);
      throw error;
    }
  }

  async getDailyData(dateRange: DateRange): Promise<DailyData[]> {
    try {
      const ordersQuery = query(
        collection(db, COLLECTIONS.ORDERS),
        where('createdAt', '>=', Timestamp.fromDate(dateRange.startDate)),
        where('createdAt', '<=', Timestamp.fromDate(dateRange.endDate)),
        orderBy('createdAt', 'asc')
      );

      const ordersSnap = await getDocs(ordersQuery);
      const orders = ordersSnap.docs.map(doc => doc.data());

      // Group orders by date
      const dailyStats: { [key: string]: { orderCount: number; revenue: number; customers: Set<string> } } = {};

      orders.forEach(order => {
        const orderDate = new Date(order.createdAt).toISOString().split('T')[0];
        
        if (!dailyStats[orderDate]) {
          dailyStats[orderDate] = {
            orderCount: 0,
            revenue: 0,
            customers: new Set()
          };
        }
        
        dailyStats[orderDate].orderCount++;
        if (['delivered', 'completed'].includes(order.status)) {
          dailyStats[orderDate].revenue += order.pricing?.total || 0;
        }
        
        if (order.customerId) {
          dailyStats[orderDate].customers.add(order.customerId);
        }
      });

      // Convert to array format
      const dailyData = Object.entries(dailyStats).map(([date, stats]) => ({
        date,
        orderCount: stats.orderCount,
        revenue: stats.revenue,
        newCustomers: stats.customers.size
      }));

      return dailyData.sort((a, b) => a.date.localeCompare(b.date));
    } catch (error) {
      console.error('Error getting daily data:', error);
      throw error;
    }
  }

  // Helper method to get date ranges
  getDateRange(period: 'today' | 'week' | 'month' | 'quarter' | 'year'): DateRange {
    const now = new Date();
    const startDate = new Date();
    const endDate = new Date();

    switch (period) {
      case 'today':
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        break;
      case 'week':
        startDate.setDate(now.getDate() - 7);
        break;
      case 'month':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case 'year':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
    }

    return { startDate, endDate };
  }
}

export const analyticsService = new AnalyticsService();
export { 
  AnalyticsService, 
  type OrderMetrics, 
  type RevenueMetrics, 
  type PopularItem, 
  type CustomerMetrics, 
  type DeliveryMetrics,
  type HourlyData,
  type DailyData,
  type DateRange
};