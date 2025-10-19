export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { NextRequest, NextResponse } from "next/server";

// NextAuth session endpoint is disabled - return empty session to stop client retries
export async function GET(request: NextRequest) {
  // Return an empty session response to stop NextAuth client from retrying
  return NextResponse.json({ user: null, expires: null }, { status: 200 });
}

export async function POST(request: NextRequest) {
  // Return an empty session response to stop NextAuth client from retrying
  return NextResponse.json({ user: null, expires: null }, { status: 200 });
}