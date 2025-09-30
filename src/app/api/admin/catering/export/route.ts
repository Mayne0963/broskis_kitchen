export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { db } from "@/lib/firebase/admin";
import { assertAdmin } from "@/lib/auth/adminGuard";

export async function GET(req: Request) {
  try {
    await assertAdmin();
    
    const snap = await db
      .collection("cateringRequests")
      .orderBy("createdAt", "desc")
      .limit(1000)
      .get();
    
    const rows = [[
      "id",
      "createdAt",
      "status",
      "packageId",
      "guests",
      "name",
      "email",
      "phone",
      "date",
      "address",
      "subtotal",
      "deposit"
    ].join(",")];
    
    snap.forEach(doc => {
      const it: any = doc.data();
      rows.push([
        it.id,
        it.createdAt,
        it.status,
        it.packageId,
        it.guests,
        it.customer?.name,
        it.customer?.email,
        it.customer?.phone,
        it.event?.date,
        JSON.stringify(it.event?.address || ""),
        it.price?.subtotal,
        it.price?.deposit
      ].map(v => `"${String(v ?? "").replace(/"/g, '""')}"`).join(","));
    });
    
    return new NextResponse(rows.join("\n"), {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": "attachment; filename=catering.csv"
      }
    });
  } catch (e: any) {
    const code = e?.message === "FORBIDDEN" ? 403 : 500;
    return NextResponse.json(
      { ok: false, error: e?.message || "SERVER_ERROR" },
      { status: code }
    );
  }
}