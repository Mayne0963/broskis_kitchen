export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { db } from "@/lib/firebase/admin";
import { assertAdmin } from "@/lib/auth/adminGuard";

export async function GET(req: Request) {
  try {
    await assertAdmin();
    
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "";
    const from = searchParams.get("from");
    const to = searchParams.get("to");
    const q = (searchParams.get("q") || "").toLowerCase();
    const limit = Number(searchParams.get("limit") || "50");
    
    let ref = db.collection("cateringRequests") as FirebaseFirestore.Query;
    
    if (status) {
      ref = ref.where("status", "==", status);
    }
    
    if (from) {
      ref = ref.where("createdAt", ">=", from);
    }
    
    if (to) {
      ref = ref.where("createdAt", "<=", to);
    }
    
    const snap = await ref.orderBy("createdAt", "desc").limit(limit).get();
    let items = snap.docs.map(d => d.data());
    
    if (q) {
      items = items.filter((it: any) => {
        return [
          it.customer?.name,
          it.customer?.email,
          it.event?.address,
          it.packageId,
          it.id
        ].some(v => String(v || "").toLowerCase().includes(q));
      });
    }
    
    return NextResponse.json({ ok: true, items });
  } catch (e: any) {
    const code = e?.message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json(
      { ok: false, error: e?.message || "SERVER_ERROR" },
      { status: code }
    );
  }
}