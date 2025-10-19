export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { db } from "@/lib/firebase/admin";
import { getServerUser } from "@/lib/session";
import { isAdmin } from "@/lib/roles";

function j(d:any, s=200){return new Response(JSON.stringify(d),{status:s,headers:{"content-type":"application/json"}})}

export async function GET() {
  const user = await getServerUser();
  if (!isAdmin(user?.roles?.[0])) return j({ error: "forbidden" }, 403);

  const snap = await db.collection("cateringRequests")
    .orderBy("createdAt", "desc")
    .limit(50)
    .get();

  const items = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  return j({ items }, 200);
}