export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { fdb } from "@/lib/firebase/admin";
import { assertAdmin } from "@/lib/auth/adminGuard";

export async function PATCH(req: Request) {
  try {
    await assertAdmin();
    
    const { id, status } = await req.json() as {
      id: string;
      status: "pending" | "quoted" | "confirmed" | "canceled";
    };
    
    if (!id || !status) {
      return NextResponse.json(
        { ok: false, error: "INVALID" },
        { status: 400 }
      );
    }
    
    const ref = fdb.collection("cateringRequests").doc(id);
    await ref.update({
      status,
      updatedAt: new Date().toISOString()
    });
    
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const code = e?.message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json(
      { ok: false, error: e?.message || "SERVER_ERROR" },
      { status: code }
    );
  }
}