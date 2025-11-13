export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/authServer";
import { adminDb } from "@/lib/firebase/admin";
import { handleServerError } from "@/lib/utils/errorLogger";

export async function GET() {
  try {
    const user = await getServerUser();
    if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

    const snap = await adminDb
      .collection("orders")
      .where("userId", "==", user.uid)
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    const orders = snap.docs.map(d => {
      const o = d.data() as any;
      const createdAt = o.createdAt?.toDate?.() || new Date();
      const totalCents = Number(o.totalCents ?? o.total ?? 0);
      return {
        id: d.id,
        createdAt: createdAt.toISOString(),
        items: Array.isArray(o.items) ? o.items.map((i: any) => ({ name: i.name, qty: i.qty })) : [],
        status: o.status || "processing",
        totalCents,
        total: Number((totalCents / 100).toFixed(2)),
      };
    });

    return NextResponse.json({ orders });
  } catch (error: any) {
    const details = handleServerError(error, "api/my-orders");
    return NextResponse.json(details, { status: 500 });
  }
}
