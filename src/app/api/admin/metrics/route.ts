import { NextRequest, NextResponse } from 'next/server';
import { adb } from '@/lib/firebaseAdmin';
import { requireAdmin } from '../../_lib/requireAdmin';

export async function GET(request: NextRequest) {
  // Check admin authentication
  const adminCheck = await requireAdmin();
  if (adminCheck instanceof Response) {
    return adminCheck;
  }

  try {
    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Get orders collection reference
    const ordersRef = adb.collection('orders');
    const usersRef = adb.collection('users');
    
    // Parallel queries for better performance
    const [
      ordersToday,
      allOrders,
      pendingOrders,
      allUsers,
      monthlyActiveUsers,
      newUsersThisMonth
    ] = await Promise.all([
      // Orders today
      ordersRef.where('createdAt', '>=', todayStart).get(),
      
      // All orders
      ordersRef.get(),
      
      // Pending orders
      ordersRef.where('status', '==', 'pending').get(),
      
      // All users
      usersRef.get(),
      
      // Monthly active users (users who placed orders this month)
      ordersRef.where('createdAt', '>=', monthStart).get(),
      
      // New users this month
      usersRef.where('createdAt', '>=', monthStart).get()
    ]);

    // Calculate metrics
    let revenueToday = 0;
    let totalRevenue = 0;
    let totalOrdersCount = 0;
    let avgOrderValue = 0;
    
    // Process today's orders
    ordersToday.docs.forEach(doc => {
      const order = doc.data();
      if (order.total && typeof order.total === 'number') {
        revenueToday += order.total;
      }
    });
    
    // Process all orders
    const userOrderCounts = new Map<string, number>();
    allOrders.docs.forEach(doc => {
      const order = doc.data();
      totalOrdersCount++;
      
      if (order.total && typeof order.total === 'number') {
        totalRevenue += order.total;
      }
      
      // Count orders per user
      if (order.userId) {
        userOrderCounts.set(order.userId, (userOrderCounts.get(order.userId) || 0) + 1);
      }
    });
    
    // Calculate average order value
    avgOrderValue = totalOrdersCount > 0 ? totalRevenue / totalOrdersCount : 0;
    
    // Calculate average orders per user
    const totalUsersWithOrders = userOrderCounts.size;
    const avgOrdersPerUser = totalUsersWithOrders > 0 ? totalOrdersCount / totalUsersWithOrders : 0;
    
    // Get unique active users this month
    const monthlyActiveUserIds = new Set();
    monthlyActiveUsers.docs.forEach(doc => {
      const order = doc.data();
      if (order.userId) {
        monthlyActiveUserIds.add(order.userId);
      }
    });
    
    const metrics = {
      ordersToday: ordersToday.size,
      revenueToday: Math.round(revenueToday * 100) / 100, // Round to 2 decimal places
      pendingOrders: pendingOrders.size,
      totalOrders: totalOrdersCount,
      totalRevenue: Math.round(totalRevenue * 100) / 100,
      registeredUsers: allUsers.size,
      monthlyActive: monthlyActiveUserIds.size,
      newUsersThisMonth: newUsersThisMonth.size,
      avgOrdersPerUser: Math.round(avgOrdersPerUser * 100) / 100,
      avgOrderValue: Math.round(avgOrderValue * 100) / 100
    };
    
    return NextResponse.json(metrics);
    
  } catch (error) {
    console.error('Error fetching admin metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}