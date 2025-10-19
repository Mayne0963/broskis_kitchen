export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { headers } from "next/headers";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: { "content-type": "application/json" },
  });
}

export async function GET() {
  const h = await headers();
  const cookie = h.get("cookie") || "none";
  const session = await getServerSession(authOptions as any);
  const adminsEnv = (process.env.ALLOWED_ADMIN_EMAILS || "").toLowerCase();
  return json({
    ok: !!session,
    user: session?.user || null,
    role: (session?.user as any)?.role || null,
    cookiesPresent: cookie !== "none",
    cookiePreview: cookie === "none" ? null : cookie.slice(0, 60) + "...",
    adminsEnv,
    nodeEnv: process.env.NODE_ENV,
    notes: [
      "If ok=false: cookie not set or NEXTAUTH_* misconfigured.",
      "Ensure ALLOWED_ADMIN_EMAILS is lowercased and includes your email.",
      "Ensure NEXTAUTH_URL= `https://broskiskitchen.com`  and NEXTAUTH_SECRET set.",
      "Safari? Try private window; Lax cookie + domain set above."
    ]
  });
}