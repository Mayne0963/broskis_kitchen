import { NextRequest, NextResponse } from "next/server";
import { getAdminKpis30d } from "@/lib/server/orderTotals";

export async function GET(request: NextRequest) {
  try {
    const data = await getAdminKpis30d();
    return NextResponse.json({ success: true, data });
  } catch (error: any) {
    console.error("Error in test-totals:", error);
    return NextResponse.json(
      { success: false, message: error.message },
      { status: 500 }
    );
  }
}