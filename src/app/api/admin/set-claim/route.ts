import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "../../../../../firebase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Set or remove admin custom claim for a user by email
export async function POST(req: NextRequest) {
  // Basic sanity check: secret must be strong
  const configuredSecret = process.env.ADMIN_SETUP_SECRET ?? "";
  if (!configuredSecret || configuredSecret.length < 64) {
    return NextResponse.json({ error: "Server misconfiguration: ADMIN_SETUP_SECRET too short" }, { status: 500 });
  }
  // Authorization: Bearer <ADMIN_SETUP_SECRET>
  const authHeader = req.headers.get("authorization");
  const expectedAuth = `Bearer ${configuredSecret}`;
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

  // Strict email validation
  const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
  if (!emailRegex.test(String(email))) {
    return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
  }
  if (!email || typeof admin !== "boolean") {
    return NextResponse.json(
      { error: "Invalid request body. Expected: { email: string, admin: boolean }" },
      { status: 400 }
    );
  }

  // Allowlist check via Firestore verified doc + optional env fallback
  let isAllowed = false;
  try {
    // Preferred: per-email document with `verified: true`
    const verifiedDoc = await adminDb.collection("security_admin_allowlist").doc(email.toLowerCase()).get();
    const verified = verifiedDoc.exists ? (verifiedDoc.data() as { verified?: boolean }).verified === true : false;
    if (verified) isAllowed = true;

    // Fallback: legacy single-doc array `security/admin-allowlist` { emails: string[] }
    if (!isAllowed) {
      const doc = await adminDb.collection("security").doc("admin-allowlist").get();
      const data = doc.exists ? (doc.data() as { emails?: string[] }) : undefined;
      const emails = (data?.emails ?? []).map((e) => e.trim().toLowerCase());
      if (emails.includes(email.toLowerCase())) {
        isAllowed = true;
      }
    }
  } catch (e) {
    console.error("Allowlist read error, falling back to env:", e);
  }

  if (!isAllowed) {
    const allowlistEnv = process.env.ADMIN_EMAIL_ALLOWLIST;
    const envEmails = (allowlistEnv ?? "").split(",").map((e) => e.trim().toLowerCase());
    if (envEmails.includes(email.toLowerCase())) {
      isAllowed = true;
    }
  }

  if (!isAllowed) {
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