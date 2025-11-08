import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "../../../../../firebase/admin";

// Alias route to satisfy legacy path referenced in deployment config
// Mirrors functionality of util/setAdmin
export async function POST(req: NextRequest) {
  const { email, admin } = await req.json();
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

  try {
    const user = await adminAuth.getUserByEmail(email);
    await adminAuth.setCustomUserClaims(user.uid, { admin: !!admin });
    return NextResponse.json({ ok: true, email, admin: !!admin });
  } catch (error) {
    console.error("Error setting admin claim:", error);
    return NextResponse.json({ error: "Failed to set admin claim" }, { status: 500 });
  }
}

// Optional GET to verify route presence
export async function GET() {
  return NextResponse.json({ ok: true, route: "/api/admin/set-claim" });
}