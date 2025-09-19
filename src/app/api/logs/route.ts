export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { adb } from '@/lib/firebaseAdmin';

type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'fatal';

interface LogEntry {
  id?: string;
  level: LogLevel;
  message: string;
  timestamp: string;
  source: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  metadata?: Record<string, any>;
  stack?: string;
  tags?: string[];
  environment: string;
  version?: string;
}

// POST: Write logs to Firebase
export async function POST(request: NextRequest) {
  try {
    const { logs } = await request.json();
    
    if (!logs || !Array.isArray(logs)) {
      return NextResponse.json(
        { error: 'Invalid logs data. Expected array of log entries.' },
        { status: 400 }
      );
    }

    // Write logs to Firebase in batch
    const batch = adb.batch();
    logs.forEach((log: LogEntry) => {
      const docRef = adb.collection('application_logs').doc();
      batch.set(docRef, log);
    });
    
    await batch.commit();
    
    return NextResponse.json({ 
      success: true, 
      message: `Successfully wrote ${logs.length} log entries` 
    });
  } catch (error) {
    console.error('Error writing logs:', error);
    return NextResponse.json(
      { error: 'Failed to write logs' },
      { status: 500 }
    );
  }
}

// GET: Query logs from Firebase
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const level = searchParams.get('level') as LogLevel;
    const source = searchParams.get('source');
    const userId = searchParams.get('userId');
    const startTime = searchParams.get('startTime');
    const endTime = searchParams.get('endTime');
    const limit = parseInt(searchParams.get('limit') || '100');
    const tags = searchParams.get('tags')?.split(',');
    const statsOnly = searchParams.get('statsOnly') === 'true';

    let query = adb.collection('application_logs') as any;

    // Apply filters
    if (level) {
      query = query.where('level', '==', level);
    }
    if (source) {
      query = query.where('source', '==', source);
    }
    if (userId) {
      query = query.where('userId', '==', userId);
    }
    if (startTime) {
      query = query.where('timestamp', '>=', startTime);
    }
    if (endTime) {
      query = query.where('timestamp', '<=', endTime);
    }
    if (tags && tags.length > 0) {
      query = query.where('tags', 'array-contains-any', tags);
    }

    query = query.orderBy('timestamp', 'desc').limit(limit);

    const snapshot = await query.get();
    const logs = snapshot.docs.map((doc: any) => ({
      id: doc.id,
      ...doc.data()
    }));

    if (statsOnly) {
      // Calculate statistics
      const stats = {
        totalLogs: logs.length,
        levelDistribution: {} as Record<LogLevel, number>,
        sourceDistribution: {} as Record<string, number>,
        errorRate: 0,
        topErrors: [] as Array<{ message: string; count: number }>
      };

      const errorMessages = new Map<string, number>();
      let errorCount = 0;

      logs.forEach((log: LogEntry) => {
        // Level distribution
        stats.levelDistribution[log.level] = (stats.levelDistribution[log.level] || 0) + 1;
        
        // Source distribution
        stats.sourceDistribution[log.source] = (stats.sourceDistribution[log.source] || 0) + 1;
        
        // Error tracking
        if (log.level === 'error' || log.level === 'fatal') {
          errorCount++;
          const count = errorMessages.get(log.message) || 0;
          errorMessages.set(log.message, count + 1);
        }
      });

      stats.errorRate = logs.length > 0 ? (errorCount / logs.length) * 100 : 0;
      
      stats.topErrors = Array.from(errorMessages.entries())
        .map(([message, count]) => ({ message, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      return NextResponse.json({ stats });
    }

    return NextResponse.json({ logs });
  } catch (error) {
    console.error('Error querying logs:', error);
    return NextResponse.json(
      { error: 'Failed to query logs' },
      { status: 500 }
    );
  }
}