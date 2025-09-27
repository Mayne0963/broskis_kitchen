export const runtime = "nodejs";

import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // Test database connection
    await db.$queryRaw`SELECT 1`;
    
    // Check if reward tables exist and get count
    const spinCount = await db.rewardSpin.count();
    
    return NextResponse.json({
      ok: true,
      spins: spinCount,
      timestamp: new Date().toISOString()
    });
  } catch (e) {
    return NextResponse.json(
      {
        ok: false,
        error: String(e),
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}