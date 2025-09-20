import "server-only";
import { adminDb } from "../firebaseAdmin";
import { Timestamp } from "firebase-admin/firestore";

// TypeScript interfaces for KPI data types
export interface DateRange {
  start: Date;
  end: Date;
}

export interface OrderMetrics {
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  pendingOrders: number;
  averageOrderValue: number;
}

export interface RevenueMetrics {
  totalRevenueCents: number;
  totalRevenueUSD: number;
  averageOrderValue: number;
  revenueByDay: Array<{ date: string; revenue: number }>;
  revenueByStatus: Record<string, number>;
}

export interface UserMetrics {
  totalUsers: number;
  activeUsers: number;
  newUsers: number;
  returningUsers: number;
  averageOrdersPerUser: number;
  topSpenders: Array<{ userId: string; totalSpent: number; orderCount: number }>;
}

export interface KPIData {
  orders: OrderMetrics;
  revenue: RevenueMetrics;
  users: UserMetrics;
  dateRange: DateRange;
}

export interface RecentOrder {
  id: string;
  date: string;
  total: string;
  status: string;
  userId?: string;
}

// Utility functions
function formatUSD(cents: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", { 
    style: "currency", 
    currency 
  }).format(cents / 100);
}

function toCentsAny(value: unknown): number {
  if (value == null) return 0;
  if (typeof value === "number") {
    // Assume dollars if < 10k and not an obvious cents integer
    return value > 10000 ? Math.round(value) : Math.round(value * 100);
  }
  if (typeof value === "string") {
    const cleaned = value.replace(/[^0-9.\-]/g, "");
    if (!cleaned) return 0;
    const num = Number(cleaned);
    return isNaN(num) ? 0 : Math.round(num * 100);
  }
  return 0;
}

function extractOrderValue(orderData: any): number {
  return (
    (typeof orderData.totalCents === "number" ? Math.round(orderData.totalCents) : 0) ||
    toCentsAny(orderData.total) ||
    toCentsAny(orderData.amount) ||
    toCentsAny(orderData.grandTotal) ||
    toCentsAny(orderData.subtotal) ||
    0
  );
}

function parseFirestoreDate(dateField: any): Date {
  if (typeof dateField?.toDate === "function") {
    return dateField.toDate();
  }
  if (dateField instanceof Date) {
    return dateField;
  }
  if (dateField instanceof Timestamp) {
    return dateField.toDate();
  }
  return new Date();
}

// KPI Helper Functions

/**
 * Get total orders with optional date filtering
 */
export async function getTotalOrders(
  dateRange?: DateRange,
  status?: string
): Promise<OrderMetrics> {
  try {
    let query: any = adminDb.collection("orders");
    
    if (dateRange) {
      query = query
        .where("createdAt", ">=", dateRange.start)
        .where("createdAt", "<=", dateRange.end);
    }
    
    if (status) {
      query = query.where("status", "==", status);
    }

    const snapshot = await query.get();
    
    let totalOrders = 0;
    let completedOrders = 0;
    let cancelledOrders = 0;
    let pendingOrders = 0;
    let totalValue = 0;

    snapshot.forEach(doc => {
      const orderData = doc.data();
      const orderStatus = orderData.status || "unknown";
      const orderValue = extractOrderValue(orderData);
      
      totalOrders++;
      totalValue += orderValue;
      
      switch (orderStatus.toLowerCase()) {
        case "completed":
        case "delivered":
        case "paid":
          completedOrders++;
          break;
        case "cancelled":
        case "refunded":
          cancelledOrders++;
          break;
        case "pending":
        case "processing":
        case "preparing":
          pendingOrders++;
          break;
      }
    });

    const averageOrderValue = totalOrders > 0 ? totalValue / totalOrders / 100 : 0;

    return {
      totalOrders,
      completedOrders,
      cancelledOrders,
      pendingOrders,
      averageOrderValue
    };
  } catch (error) {
    console.error("Error fetching order metrics:", error);
    throw new Error("Failed to fetch order metrics");
  }
}

/**
 * Get revenue metrics for financial KPIs
 */
export async function getRevenueMetrics(
  dateRange?: DateRange
): Promise<RevenueMetrics> {
  try {
    let query: any = adminDb.collection("orders");
    
    if (dateRange) {
      query = query
        .where("createdAt", ">=", dateRange.start)
        .where("createdAt", "<=", dateRange.end);
    }

    const snapshot = await query.get();
    
    let totalRevenueCents = 0;
    const revenueByDay: Record<string, number> = {};
    const revenueByStatus: Record<string, number> = {};
    let orderCount = 0;

    snapshot.forEach(doc => {
      const orderData = doc.data();
      const orderValue = extractOrderValue(orderData);
      const orderStatus = orderData.status || "unknown";
      const orderDate = parseFirestoreDate(orderData.createdAt);
      const dateKey = orderDate.toISOString().slice(0, 10);
      
      totalRevenueCents += orderValue;
      orderCount++;
      
      // Revenue by day
      revenueByDay[dateKey] = (revenueByDay[dateKey] || 0) + orderValue;
      
      // Revenue by status
      revenueByStatus[orderStatus] = (revenueByStatus[orderStatus] || 0) + orderValue;
    });

    const revenueByDayArray = Object.entries(revenueByDay)
      .map(([date, revenue]) => ({ date, revenue: revenue / 100 }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const averageOrderValue = orderCount > 0 ? totalRevenueCents / orderCount / 100 : 0;

    return {
      totalRevenueCents,
      totalRevenueUSD: totalRevenueCents / 100,
      averageOrderValue,
      revenueByDay: revenueByDayArray,
      revenueByStatus
    };
  } catch (error) {
    console.error("Error fetching revenue metrics:", error);
    throw new Error("Failed to fetch revenue metrics");
  }
}

/**
 * Get user metrics for analytics
 */
export async function getUserMetrics(
  dateRange?: DateRange
): Promise<UserMetrics> {
  try {
    let ordersQuery: any = adminDb.collection("orders");
    
    if (dateRange) {
      ordersQuery = ordersQuery
        .where("createdAt", ">=", dateRange.start)
        .where("createdAt", "<=", dateRange.end);
    }

    const [ordersSnapshot, usersSnapshot] = await Promise.all([
      ordersQuery.get(),
      adminDb.collection("users").get()
    ]);
    
    const userOrderCounts: Record<string, number> = {};
    const userSpending: Record<string, number> = {};
    const activeUserIds = new Set<string>();
    const newUserIds = new Set<string>();
    
    // Process orders
    ordersSnapshot.forEach(doc => {
      const orderData = doc.data();
      const userId = orderData.userId;
      const orderValue = extractOrderValue(orderData);
      
      if (userId) {
        activeUserIds.add(userId);
        userOrderCounts[userId] = (userOrderCounts[userId] || 0) + 1;
        userSpending[userId] = (userSpending[userId] || 0) + orderValue;
      }
    });
    
    // Process users for new user detection
    if (dateRange) {
      usersSnapshot.forEach(doc => {
        const userData = doc.data();
        const createdAt = parseFirestoreDate(userData.createdAt);
        
        if (createdAt >= dateRange.start && createdAt <= dateRange.end) {
          newUserIds.add(doc.id);
        }
      });
    }
    
    // Calculate top spenders
    const topSpenders = Object.entries(userSpending)
      .map(([userId, totalSpent]) => ({
        userId,
        totalSpent: totalSpent / 100,
        orderCount: userOrderCounts[userId] || 0
      }))
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 10);
    
    const totalUsers = usersSnapshot.size;
    const activeUsers = activeUserIds.size;
    const newUsers = newUserIds.size;
    const returningUsers = activeUsers - newUsers;
    const totalOrders = ordersSnapshot.size;
    const averageOrdersPerUser = activeUsers > 0 ? totalOrders / activeUsers : 0;

    return {
      totalUsers,
      activeUsers,
      newUsers,
      returningUsers,
      averageOrdersPerUser,
      topSpenders
    };
  } catch (error) {
    console.error("Error fetching user metrics:", error);
    throw new Error("Failed to fetch user metrics");
  }
}

/**
 * Get comprehensive KPI data
 */
export async function getComprehensiveKPIs(
  dateRange?: DateRange
): Promise<KPIData> {
  try {
    const [orders, revenue, users] = await Promise.all([
      getTotalOrders(dateRange),
      getRevenueMetrics(dateRange),
      getUserMetrics(dateRange)
    ]);

    const defaultDateRange = dateRange || {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      end: new Date()
    };

    return {
      orders,
      revenue,
      users,
      dateRange: defaultDateRange
    };
  } catch (error) {
    console.error("Error fetching comprehensive KPIs:", error);
    throw new Error("Failed to fetch comprehensive KPIs");
  }
}

/**
 * Get recent orders for dashboard display
 */
export async function getRecentOrders(
  limit: number = 10,
  dateRange?: DateRange
): Promise<RecentOrder[]> {
  try {
    let query = adminDb.collection("orders").orderBy("createdAt", "desc");
    
    if (dateRange) {
      query = query
        .where("createdAt", ">=", dateRange.start)
        .where("createdAt", "<=", dateRange.end);
    }
    
    query = query.limit(limit);
    
    const snapshot = await query.get();
    const recentOrders: RecentOrder[] = [];
    
    snapshot.forEach(doc => {
      const orderData = doc.data();
      const orderValue = extractOrderValue(orderData);
      const orderDate = parseFirestoreDate(orderData.createdAt);
      
      recentOrders.push({
        id: doc.id,
        date: orderDate.toISOString().slice(0, 10),
        total: formatUSD(orderValue),
        status: orderData.status || "unknown",
        userId: orderData.userId
      });
    });
    
    return recentOrders;
  } catch (error) {
    console.error("Error fetching recent orders:", error);
    throw new Error("Failed to fetch recent orders");
  }
}

/**
 * Get user spending data (existing function enhanced)
 */
export async function getUserSpend(userId: string): Promise<{
  ordersCount: number;
  totalCents: number;
  totalUSD: number;
  points: number;
}> {
  try {
    const snapshot = await adminDb.collection("orders")
      .where("userId", "==", userId)
      .get();

    let ordersCount = 0;
    let totalCents = 0;

    snapshot.forEach(doc => {
      const orderData = doc.data();
      const orderValue = extractOrderValue(orderData);
      
      totalCents += orderValue;
      ordersCount += 1;
    });

    const totalUSD = totalCents / 100;
    const points = Math.floor(totalUSD); // 1 point per $1 spent

    return { ordersCount, totalCents, totalUSD, points };
  } catch (error) {
    console.error("Error fetching user spend data:", error);
    throw new Error("Failed to fetch user spend data");
  }
}

// Export utility functions for reuse
export { formatUSD, toCentsAny, extractOrderValue, parseFirestoreDate };