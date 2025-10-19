export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { headers } from "next/headers";
import { getServerUser } from "@/lib/session";
import { ENV } from "@/lib/env";

function j(d:any, s=200){return new Response(JSON.stringify(d,null,2),{status:s,headers:{"content-type":"application/json"}})}

export async function GET() {
  const h = await headers();
  const cookie = h.get("cookie") || "none";
  const user = await getServerUser();
  const role = user?.roles?.[0] || null;

  return j({
    ok: !!user,
    user,
    role,
    cookiesPresent: cookie !== "none",
    cookiePreview: cookie === "none" ? null : cookie.slice(0, 60) + "...",
    env: {
      NODE_ENV: ENV.NODE_ENV,
      ADMIN_COUNT: ENV.ALLOWED_ADMIN_EMAILS.length,
      COOKIE_DOMAIN: ENV.COOKIE_DOMAIN || null
    },
    hints: [
      "Using unified Firebase Auth + custom session system.",
      "Always lowercase admin emails.",
      "Use Incognito after changing envs to drop old cookies."
    ]
  });
}