import { NextRequest, NextResponse } from 'next/server';
import { verifyAdminAuth } from '@/lib/auth/adminOnly';
import { getOrderMetrics, getUserMetrics, checkRateLimit } from '@/lib/services/quota-friendly-metrics';

export async function GET(request: NextRequest) {
  // Check admin authentication
  const adminCheck = await verifyAdminAuth(request);
  if (adminCheck instanceof Response) {
    return adminCheck;
  }
  
  // Rate limiting check
  const clientId = request.headers.get('x-forwarded-for') || 'unknown';
  if (!checkRateLimit(clientId)) {
    return NextResponse.json(
      { error: 'Rate limit exceeded. Please try again later.' },
      { status: 429 }
    );
  }

  try {
    // Get query parameters for customization
    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || 'month';
    const useCache = searchParams.get('cache') !== 'false';
    
    // Fetch metrics using quota-friendly service
    const [orderMetrics, userMetrics] = await Promise.all([
      getOrderMetrics({ 
        useCache, 
        timeRange: timeRange as any,
        maxDocuments: 1000 
      }),
      getUserMetrics({ 
        useCache, 
        timeRange: timeRange as any,
        maxDocuments: 500 
      })
    ]);
    
    // Get today's metrics separately for dashboard
    const todayMetrics = timeRange !== 'today' ? await getOrderMetrics({
      useCache,
      timeRange: 'today',
      maxDocuments: 200
    }) : orderMetrics;
    
    const combinedMetrics = {
      // Today's metrics
      ordersToday: todayMetrics.totalOrders,
      revenueToday: todayMetrics.totalRevenue,
      
      // Period metrics
      totalOrders: orderMetrics.totalOrders,
      totalRevenue: orderMetrics.totalRevenue,
      pendingOrders: orderMetrics.pendingOrders,
      avgOrderValue: orderMetrics.avgOrderValue,
      
      // User metrics
      registeredUsers: userMetrics.totalUsers,
      newUsersThisMonth: userMetrics.newUsers,
      
      // Customer insights
      uniqueCustomers: orderMetrics.uniqueCustomers,
      avgOrdersPerCustomer: orderMetrics.avgOrdersPerCustomer,
      
      // Performance metadata
      timeRange,
      documentsRead: orderMetrics.documentsRead + userMetrics.documentsRead,
      fromCache: orderMetrics.fromCache && userMetrics.fromCache,
      timestamp: new Date().toISOString()
    };
    
    return NextResponse.json(combinedMetrics);
    
  } catch (error) {
    console.error('Error fetching admin metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}