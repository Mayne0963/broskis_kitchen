export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const preferredRegion = ["iad1"];

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { db } from "@/lib/firebase/admin";

function j(d:any, s=200){return new Response(JSON.stringify(d),{status:s,headers:{"content-type":"application/json"}})}

export async function GET() {
  const s = await getServerSession(authOptions as any);
  console.log("[ADMIN] list session", !!s, s?.user?.email, (s?.user as any)?.role);
  if (!(s?.user && (s.user as any).role === "admin")) return j({ error:"forbidden" }, 403);

  try {
    const snap = await db.collection("cateringRequests").orderBy("createdAt","desc").limit(50).get();
    const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    console.log("[ADMIN] list count", items.length);
    return j({ items }, 200);
  } catch (e:any) {
    console.error("[ADMIN] list error", e?.message);
    return j({ error: e?.message || "unknown" }, 500);
  }
}