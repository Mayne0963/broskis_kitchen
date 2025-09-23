import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebaseAdmin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(parseInt(searchParams.get("limit") || "5", 10) || 5, 50);
    const snap = await adminDb.collection("orders").orderBy("createdAt", "desc").limit(limit).get();
    const data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ ok: true, count: data.length, data });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 500 });
  }
}