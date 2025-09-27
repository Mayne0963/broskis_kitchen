import { NextResponse } from "next/server";
import { getSpinStatus } from "@/lib/rewards/eligibility";

export async function GET() {
  try {
    const status = await getSpinStatus();
    return NextResponse.json(status);
  } catch (error) {
    console.error('Error getting spin status:', error);
    return NextResponse.json(
      { error: 'Failed to get spin status' },
      { status: 500 }
    );
  }
}