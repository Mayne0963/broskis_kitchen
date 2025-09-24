import { NextResponse } from 'next/server';

export async function GET() {
  try {
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
    });
  } catch (error) {
    console.error('Health check error:', error);
    return NextResponse.json({
      success: false,
      error: 'Health check failed'
    }, { status: 500 });
  }
}