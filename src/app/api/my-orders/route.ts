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
      .limit(50)
      .get();

    const orderedDocs = snap.docs
      .map(d => ({ id: d.id, data: d.data() as any }))
      .sort((a, b) => {
        const am = a.data?.createdAt?.toMillis?.() || 0;
        const bm = b.data?.createdAt?.toMillis?.() || 0;
        return bm - am;
      });

    const orders = orderedDocs.map(({ id, data: o }) => {
      const totalCents = Number(o.totalCents || 0);
      return {
        id,
        date: (o.createdAt?.toDate?.() || new Date()).toISOString().slice(0, 10),
        items: (o.items || []).map((i: any) => ({ name: i.name, qty: i.qty })),
        totalCents,
        totalFormatted: new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(totalCents / 100),
        status: o.status || "processing",
      };
    });

    return NextResponse.json({ orders });
  } catch (error: any) {
    const details = handleServerError(error, "api/my-orders");
    return NextResponse.json(details, { status: 500 });
  }
}
