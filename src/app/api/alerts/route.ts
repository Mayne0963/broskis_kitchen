export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebaseAdmin';

interface Alert {
  id?: string;
  type: 'error_rate' | 'response_time' | 'memory_usage' | 'disk_space' | 'service_down' | 'security_breach';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  timestamp: string;
  resolved: boolean;
  resolvedAt?: string;
  metadata?: Record<string, any>;
  notificationsSent: string[];
}

// POST - Create new alert
export async function POST(request: NextRequest) {
  try {
    const alert: Omit<Alert, 'id'> = await request.json();
    
    const docRef = await adminDb.collection('alerts').add(alert);
    
    return NextResponse.json({ 
      success: true, 
      alertId: docRef.id 
    });
  } catch (error) {
    console.error('Error creating alert:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create alert' },
      { status: 500 }
    );
  }
}

// PUT - Update alert (resolve)
export async function PUT(request: NextRequest) {
  try {
    const { alertId, updates } = await request.json();
    
    await adminDb.collection('alerts').doc(alertId).update(updates);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating alert:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update alert' },
      { status: 500 }
    );
  }
}

// GET - Get error rate calculation or alerts
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    
    if (action === 'error_rate') {
      const startTime = searchParams.get('startTime');
      const endTime = searchParams.get('endTime');
      
      if (!startTime || !endTime) {
        return NextResponse.json(
          { success: false, error: 'startTime and endTime are required' },
          { status: 400 }
        );
      }
      
      // Query error logs and total requests from the database
      const errorQuery = adminDb.collection('error_logs')
        .where('timestamp', '>=', startTime)
        .where('timestamp', '<=', endTime);
      
      const performanceQuery = adminDb.collection('performance_metrics')
        .where('timestamp', '>=', startTime)
        .where('timestamp', '<=', endTime);

      const [errorSnapshot, performanceSnapshot] = await Promise.all([
        errorQuery.get(),
        performanceQuery.get()
      ]);

      const errorCount = errorSnapshot.size;
      const totalRequests = performanceSnapshot.size;

      const errorRate = totalRequests === 0 ? 0 : (errorCount / totalRequests) * 100;
      
      return NextResponse.json({ 
        success: true, 
        errorRate,
        errorCount,
        totalRequests
      });
    }
    
    // Default: return active alerts
    const alertsSnapshot = await adminDb.collection('alerts')
      .where('resolved', '==', false)
      .orderBy('timestamp', 'desc')
      .get();
    
    const alerts = alertsSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    return NextResponse.json({ success: true, alerts });
  } catch (error) {
    console.error('Error fetching data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}