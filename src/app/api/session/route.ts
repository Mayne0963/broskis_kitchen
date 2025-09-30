export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

export async function GET() {
  const s = await getServerSession(authOptions as any);
  return new Response(JSON.stringify({ ok: !!s, user: s?.user ?? null, role: (s?.user as any)?.role ?? null }), {
    status: 200,
    headers: { "content-type": "application/json", "cache-control": "no-store, private, max-age=0" },
  });
}