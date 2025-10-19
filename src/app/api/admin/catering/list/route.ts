export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { getServerSession } from "next-auth";
import authOptions from "@/lib/auth/options";
import { db } from "@/lib/firebase/admin";

function j(d:any, s=200){return new Response(JSON.stringify(d),{status:s,headers:{"content-type":"application/json"}})}

export async function GET() {
  const s = await getServerSession(authOptions as any);
  if (!(s?.user && (s.user as any).role === "admin")) return j({ error: "forbidden" }, 403);

  const snap = await db.collection("cateringRequests")
    .orderBy("createdAt", "desc")
    .limit(50)
    .get();

  const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return j({ items }, 200);
}