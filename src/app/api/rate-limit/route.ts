export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebaseAdmin';

interface RateLimitRecord {
  count: number;
  resetTime: number;
  firstRequest: number;
}

// POST - Increment rate limit counter
// GET - Get current rate limit status
export async function POST(request: NextRequest) {
  try {
    const { key, windowMs } = await request.json();
    
    if (!key || !windowMs) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: key, windowMs' },
        { status: 400 }
      );
    }

    const now = Date.now();
    const docRef = db.collection('rate_limits').doc(key);
    
    const result = await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(docRef);
      
      if (!doc.exists) {
        const newRecord: RateLimitRecord = {
          count: 1,
          resetTime: now + windowMs,
          firstRequest: now
        };
        transaction.set(docRef, newRecord);
        return newRecord;
      }
      
      const existing = doc.data() as RateLimitRecord;
      
      // Check if window has expired
      if (now > existing.resetTime) {
        const newRecord: RateLimitRecord = {
          count: 1,
          resetTime: now + windowMs,
          firstRequest: now
        };
        transaction.set(docRef, newRecord);
        return newRecord;
      }
      
      const updatedRecord: RateLimitRecord = {
        ...existing,
        count: existing.count + 1
      };
      transaction.update(docRef, { count: updatedRecord.count });
      return updatedRecord;
    });
    
    return NextResponse.json({
      success: true,
      record: result
    });
  } catch (error) {
    console.error('Error incrementing rate limit:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to increment rate limit' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const key = searchParams.get('key');
    
    if (!key) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameter: key' },
        { status: 400 }
      );
    }

    const doc = await db.collection('rate_limits').doc(key).get();
    
    if (!doc.exists) {
      return NextResponse.json({
        success: true,
        record: null
      });
    }
    
    const data = doc.data() as RateLimitRecord;
    
    // Check if record has expired
    if (Date.now() > data.resetTime) {
      await doc.ref.delete();
      return NextResponse.json({
        success: true,
        record: null
      });
    }
    
    return NextResponse.json({
      success: true,
      record: data
    });
  } catch (error) {
    console.error('Error getting rate limit record:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get rate limit record' },
      { status: 500 }
    );
  }
}

// PUT - Set rate limit record
export async function PUT(request: NextRequest) {
  try {
    const { key, record } = await request.json();
    
    if (!key || !record) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: key, record' },
        { status: 400 }
      );
    }

    await db.collection('rate_limits').doc(key).set(record);
    
    return NextResponse.json({
      success: true
    });
  } catch (error) {
    console.error('Error setting rate limit record:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to set rate limit record' },
      { status: 500 }
    );
  }
}