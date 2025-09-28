export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { calcPrice } from "@/lib/catering/price";

export async function POST(req: Request) {
  const b = await req.json();
  
  if (!b.packageId || !b.guests) {
    return NextResponse.json({ error: "INVALID" }, { status: 400 });
  }
  
  return NextResponse.json(calcPrice(b.packageId, b.guests, b.addons || []));
}