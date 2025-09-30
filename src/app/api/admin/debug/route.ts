export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { headers } from "next/headers";
import { getServerSession } from "next-auth";
import authOptions from "@/lib/auth/options";
import { ENV } from "@/lib/env";

function j(d:any, s=200){return new Response(JSON.stringify(d,null,2),{status:s,headers:{"content-type":"application/json"}})}

export async function GET() {
  const h = await headers();
  const cookie = h.get("cookie") || "none";
  const session = await getServerSession(authOptions as any);
  const user = session?.user || null;
  const role = (session?.user as any)?.role || null;

  return j({
    ok: !!session,
    user,
    role,
    cookiesPresent: cookie !== "none",
    cookiePreview: cookie === "none" ? null : cookie.slice(0, 60) + "...",
    env: {
      NODE_ENV: ENV.NODE_ENV,
      NEXTAUTH_URL: ENV.NEXTAUTH_URL,
      NEXTAUTH_SECRET_LEN: ENV.NEXTAUTH_SECRET.length,
      ADMIN_COUNT: ENV.ALLOWED_ADMIN_EMAILS.length,
      COOKIE_DOMAIN: ENV.COOKIE_DOMAIN || null
    },
    hints: [
      "If ok=false & cookiesPresent=true → secret/url mismatch. Ensure SAME NEXTAUTH_SECRET locally & in Vercel.",
      "Always lowercase admin emails.",
      "Use Incognito after changing envs to drop old cookies."
    ]
  });
}