import { NextRequest, NextResponse } from 'next/server';
import { withErrorHandler, requireAuth, requireAdmin } from '@/lib/middleware/error-handler';
import { db } from '@/lib/firebaseAdmin';

export const GET = withErrorHandler(async (request: NextRequest, context) => {
  // Require admin authentication
  const user = await requireAuth(request);
  requireAdmin(user);

  try {
    const url = new URL(request.url);
    const type = url.searchParams.get('type') || 'all'; // 'errors', 'performance', 'all'
    const hours = parseInt(url.searchParams.get('hours') || '24');
    const format = url.searchParams.get('format') || 'json'; // 'json', 'csv'
    
    // Calculate time range
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - (hours * 60 * 60 * 1000));

    let exportData: any = {};

    // Fetch error logs
    if (type === 'errors' || type === 'all') {
      const errorQuery = db.collection('error_logs')
        .where('timestamp', '>=', startTime.toISOString())
        .where('timestamp', '<=', endTime.toISOString())
        .orderBy('timestamp', 'desc')
        .limit(1000);

      const errorSnapshot = await errorQuery.get();
      const errorLogs = errorSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      exportData.errors = errorLogs;
    }

    // Fetch performance metrics
    if (type === 'performance' || type === 'all') {
      const performanceQuery = db.collection('performance_metrics')
        .where('timestamp', '>=', startTime.toISOString())
        .where('timestamp', '<=', endTime.toISOString())
        .orderBy('timestamp', 'desc')
        .limit(1000);

      const performanceSnapshot = await performanceQuery.get();
      const performanceMetrics = performanceSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      exportData.performance = performanceMetrics;
    }

    // Fetch system health
    if (type === 'all') {
      const healthQuery = db.collection('system_health')
        .where('timestamp', '>=', startTime.toISOString())
        .where('timestamp', '<=', endTime.toISOString())
        .orderBy('timestamp', 'desc')
        .limit(1000);

      const healthSnapshot = await healthQuery.get();
      const systemHealth = healthSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      exportData.systemHealth = systemHealth;
    }

    // Add metadata
    exportData.metadata = {
      exportType: type,
      timeRange: {
        start: startTime.toISOString(),
        end: endTime.toISOString(),
        hours
      },
      exportedAt: new Date().toISOString(),
      exportedBy: user.uid
    };

    if (format === 'csv') {
      // Convert to CSV format
      const csvData = convertToCSV(exportData, type);
      
      return new NextResponse(csvData, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="${type}-logs-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }

    // Return JSON format
    return new NextResponse(JSON.stringify(exportData, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="${type}-logs-${new Date().toISOString().split('T')[0]}.json"`
      }
    });
  } catch (error) {
    console.error('Error exporting logs:', error);
    throw error;
  }
});

function convertToCSV(data: any, type: string): string {
  let csvContent = '';
  
  if (type === 'errors' && data.errors) {
    csvContent += 'Timestamp,Severity,Message,Code,Status Code,Endpoint,Method,User ID\n';
    data.errors.forEach((error: any) => {
      csvContent += `"${error.timestamp}","${error.severity}","${error.message.replace(/"/g, '""')}","${error.code}","${error.statusCode}","${error.context?.endpoint || ''}","${error.context?.method || ''}","${error.context?.userId || ''}"\n`;
    });
  }
  
  if (type === 'performance' && data.performance) {
    csvContent += 'Timestamp,Endpoint,Method,Duration,Status Code,User ID,Memory Used,CPU User\n';
    data.performance.forEach((metric: any) => {
      csvContent += `"${metric.timestamp}","${metric.endpoint}","${metric.method}","${metric.duration}","${metric.statusCode}","${metric.userId || ''}","${metric.memoryUsage?.heapUsed || ''}","${metric.cpuUsage?.user || ''}"\n`;
    });
  }
  
  if (type === 'all') {
    // Combine all data types with headers
    csvContent += '=== ERROR LOGS ===\n';
    csvContent += 'Timestamp,Severity,Message,Code,Status Code,Endpoint,Method,User ID\n';
    if (data.errors) {
      data.errors.forEach((error: any) => {
        csvContent += `"${error.timestamp}","${error.severity}","${error.message.replace(/"/g, '""')}","${error.code}","${error.statusCode}","${error.context?.endpoint || ''}","${error.context?.method || ''}","${error.context?.userId || ''}"\n`;
      });
    }
    
    csvContent += '\n=== PERFORMANCE METRICS ===\n';
    csvContent += 'Timestamp,Endpoint,Method,Duration,Status Code,User ID,Memory Used,CPU User\n';
    if (data.performance) {
      data.performance.forEach((metric: any) => {
        csvContent += `"${metric.timestamp}","${metric.endpoint}","${metric.method}","${metric.duration}","${metric.statusCode}","${metric.userId || ''}","${metric.memoryUsage?.heapUsed || ''}","${metric.cpuUsage?.user || ''}"\n`;
      });
    }
    
    csvContent += '\n=== SYSTEM HEALTH ===\n';
    csvContent += 'Timestamp,Memory RSS,Memory Heap Used,Memory Heap Total,CPU User,CPU System,Uptime\n';
    if (data.systemHealth) {
      data.systemHealth.forEach((health: any) => {
        csvContent += `"${health.timestamp}","${health.memoryUsage?.rss || ''}","${health.memoryUsage?.heapUsed || ''}","${health.memoryUsage?.heapTotal || ''}","${health.cpuUsage?.user || ''}","${health.cpuUsage?.system || ''}","${health.uptime || ''}"\n`;
      });
    }
  }
  
  return csvContent;
}