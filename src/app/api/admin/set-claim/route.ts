import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "../../../../../firebase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Set or remove admin custom claim for a user by email
export async function POST(req: NextRequest) {
  // Authorization: Bearer <ADMIN_SETUP_SECRET>
  const authHeader = req.headers.get("authorization");
  const expectedAuth = `Bearer ${process.env.ADMIN_SETUP_SECRET ?? ""}`;
  if (!authHeader || authHeader !== expectedAuth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Validate body
  let payload: { email?: string; admin?: boolean } = {};
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { email, admin } = payload;
  if (!email || typeof admin !== "boolean") {
    return NextResponse.json(
      { error: "Invalid request body. Expected: { email: string, admin: boolean }" },
      { status: 400 }
    );
  }

  // Allowlist check
  const allowlistEnv = process.env.ADMIN_EMAIL_ALLOWLIST;
  if (!allowlistEnv) {
    return NextResponse.json({ error: "Admin email allowlist not configured" }, { status: 500 });
  }
  const allowedEmails = allowlistEnv.split(",").map((e) => e.trim());
  if (!allowedEmails.includes(email)) {
    return NextResponse.json({ error: "Email not in allowlist" }, { status: 403 });
  }

  try {
    const userRecord = await adminAuth.getUserByEmail(email);
    await adminAuth.setCustomUserClaims(userRecord.uid, { admin });
    return NextResponse.json({ success: true, message: `Admin claim ${admin ? "set" : "removed"} for ${email}` });
  } catch (error: any) {
    console.error("Error setting admin claim:", error);
    if (error instanceof Error && error.message.includes("user-not-found")) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// Optional GET to verify route presence
export async function GET() {
  return NextResponse.json({ ok: true, route: "/api/admin/set-claim" });
}