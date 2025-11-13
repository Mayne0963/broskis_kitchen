export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest } from "next/server";
import { db } from "@/lib/firebase/admin";
import { ensureAdmin } from "@/lib/firebase/admin";
import { mapDoc } from "@/lib/catering/transform";

function j(d:any, s=200){return new Response(JSON.stringify(d),{status:s,headers:{"content-type":"application/json"}})}

export async function GET(req: NextRequest) {
  try {
    await ensureAdmin(req);

    const snap = await db.collection("cateringRequests")
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    const items = snap.docs.map(d => mapDoc(d.id, d.data()));
    return j({ items }, 200);
  } catch (e) {
    return j({ error: "forbidden" }, 403);
  }
}
