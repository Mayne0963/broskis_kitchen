export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { headers } from "next/headers";
import { getServerUser } from "@/lib/session";

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export async function GET() {
  const h = await headers();
  const cookie = h.get("cookie") || "none";
  const user = await getServerUser();
  const adminsEnv = (process.env.ALLOWED_ADMIN_EMAILS || "").toLowerCase();
  return json({
    ok: !!user,
    user: user ? {
      id: user.uid,
      uid: user.uid,
      email: user.email,
      name: user.name,
      role: user.roles?.[0] || 'customer'
    } : null,
    role: user?.roles?.[0] || null,
    cookiesPresent: cookie !== "none",
    cookiePreview: cookie === "none" ? null : cookie.slice(0, 60) + "...",
    adminsEnv,
    nodeEnv: process.env.NODE_ENV,
    notes: [
      "If ok=false: session cookie not set or Firebase Auth misconfigured.",
      "Ensure ALLOWED_ADMIN_EMAILS is lowercased and includes your email.",
      "Ensure Firebase Admin SDK is properly configured.",
      "Safari? Try private window; Lax cookie + domain set above."
    ]
  });
}