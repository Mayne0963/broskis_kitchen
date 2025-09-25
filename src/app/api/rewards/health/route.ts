import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const headers = { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' };
    return NextResponse.json({
      success: true,
      message: 'Rewards API is healthy',
      timestamp: new Date().toISOString(),
      routes: {
        balance: '/api/rewards/balance',
        catalog: '/api/rewards/catalog',
        spin: '/api/rewards/spin',
        redeem: '/api/rewards/redeem'
      }
    }, { headers });
  } catch (error) {
    console.error('Health check error:', error);
    const headers = { 'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate' };
    return NextResponse.json({
      success: false,
      error: 'INTERNAL'
    }, { status: 500, headers });
  }
}