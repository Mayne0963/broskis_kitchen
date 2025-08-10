import { NextRequest, NextResponse } from 'next/server';
import { analyticsService } from '@/lib/services/analytics-service';
import { auth } from '@/lib/firebaseAdmin';

export async function GET(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Verify Firebase token
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(token);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Check if user has admin access
    const isAdmin = decodedToken.admin === true || decodedToken.role === 'admin';
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Admin access required.' },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') as 'today' | 'week' | 'month' | 'quarter' | 'year' || 'week';
    const metric = searchParams.get('metric');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');

    // Determine date range
    let dateRange;
    if (startDate && endDate) {
      dateRange = {
        startDate: new Date(startDate),
        endDate: new Date(endDate)
      };
    } else {
      dateRange = analyticsService.getDateRange(period);
    }

    // Get specific metric or all metrics
    switch (metric) {
      case 'orders':
        const orderMetrics = await analyticsService.getOrderMetrics(dateRange);
        return NextResponse.json({ success: true, data: orderMetrics });

      case 'revenue':
        const revenueMetrics = await analyticsService.getRevenueMetrics(dateRange);
        return NextResponse.json({ success: true, data: revenueMetrics });

      case 'popular-items':
        const limit = parseInt(searchParams.get('limit') || '10');
        const popularItemsData = await analyticsService.getPopularItems(dateRange, limit);
        return NextResponse.json({ success: true, data: popularItemsData });

      case 'customers':
        const customerMetrics = await analyticsService.getCustomerMetrics(dateRange);
        return NextResponse.json({ success: true, data: customerMetrics });

      case 'delivery':
        const deliveryMetrics = await analyticsService.getDeliveryMetrics(dateRange);
        return NextResponse.json({ success: true, data: deliveryMetrics });

      case 'hourly':
        const date = searchParams.get('date') ? new Date(searchParams.get('date')!) : new Date();
        const hourlyData = await analyticsService.getHourlyData(date);
        return NextResponse.json({ success: true, data: hourlyData });

      case 'daily':
        const dailyData = await analyticsService.getDailyData(dateRange);
        return NextResponse.json({ success: true, data: dailyData });

      default:
        // Return comprehensive dashboard data
        const [orders, revenue, customers, delivery, popularItems, dailyTrend] = await Promise.all([
          analyticsService.getOrderMetrics(dateRange),
          analyticsService.getRevenueMetrics(dateRange),
          analyticsService.getCustomerMetrics(dateRange),
          analyticsService.getDeliveryMetrics(dateRange),
          analyticsService.getPopularItems(dateRange, 5),
          analyticsService.getDailyData(dateRange)
        ]);

        return NextResponse.json({
          success: true,
          data: {
            period,
            dateRange,
            orders,
            revenue,
            customers,
            delivery,
            popularItems,
            dailyTrend
          }
        });
    }

  } catch (error) {
    console.error('Error getting analytics data:', error);
    return NextResponse.json(
      { 
        error: 'Failed to get analytics data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Export analytics data (CSV format)
export async function POST(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { error: 'Missing or invalid authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Verify Firebase token
    let decodedToken;
    try {
      decodedToken = await auth.verifyIdToken(token);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid authentication token' },
        { status: 401 }
      );
    }

    // Check if user has admin access
    const isAdmin = decodedToken.admin === true || decodedToken.role === 'admin';
    if (!isAdmin) {
      return NextResponse.json(
        { error: 'Insufficient permissions. Admin access required.' },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { exportType, dateRange: customDateRange, period = 'month' } = body;

    // Determine date range
    let dateRange;
    if (customDateRange) {
      dateRange = {
        startDate: new Date(customDateRange.startDate),
        endDate: new Date(customDateRange.endDate)
      };
    } else {
      dateRange = analyticsService.getDateRange(period);
    }

    let csvData = '';
    let filename = '';

    switch (exportType) {
      case 'daily-summary':
        const dailyData = await analyticsService.getDailyData(dateRange);
        csvData = 'Date,Orders,Revenue,New Customers\n';
        csvData += dailyData.map(day => 
          `${day.date},${day.orderCount},${day.revenue.toFixed(2)},${day.newCustomers}`
        ).join('\n');
        filename = `daily-summary-${period}.csv`;
        break;

      case 'popular-items':
        const popularItems = await analyticsService.getPopularItems(dateRange, 50);
        csvData = 'Item Name,Order Count,Revenue\n';
        csvData += popularItems.map(item => 
          `"${item.name}",${item.orderCount},${item.revenue.toFixed(2)}`
        ).join('\n');
        filename = `popular-items-${period}.csv`;
        break;

      case 'revenue-breakdown':
        const revenueMetrics = await analyticsService.getRevenueMetrics(dateRange);
        csvData = 'Metric,Amount\n';
        csvData += `Gross Revenue,${revenueMetrics.grossRevenue.toFixed(2)}\n`;
        csvData += `Net Revenue,${revenueMetrics.netRevenue.toFixed(2)}\n`;
        csvData += `Refunds,${revenueMetrics.refundAmount.toFixed(2)}\n`;
        csvData += `Delivery Fees,${revenueMetrics.deliveryFees.toFixed(2)}\n`;
        csvData += `Taxes,${revenueMetrics.taxes.toFixed(2)}\n`;
        csvData += `Tips,${revenueMetrics.tips.toFixed(2)}\n`;
        filename = `revenue-breakdown-${period}.csv`;
        break;

      default:
        return NextResponse.json(
          { error: 'Invalid export type' },
          { status: 400 }
        );
    }

    // Return CSV data
    return new NextResponse(csvData, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });

  } catch (error) {
    console.error('Error exporting analytics data:', error);
    return NextResponse.json(
      { 
        error: 'Failed to export analytics data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}