export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/authServer";
import { adminDb } from "@/lib/firebase/admin";

export async function GET() {
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
    const totalCents = Number(o.totalCents || 0);
    return {
      id: d.id,
      date: (o.createdAt?.toDate?.() || new Date()).toISOString().slice(0,10),
      items: (o.items || []).map((i:any)=>({ name: i.name, qty: i.qty })),
      totalCents,
      totalFormatted: new Intl.NumberFormat("en-US",{style:"currency",currency:"USD"}).format(totalCents/100),
      status: o.status || "processing",
    };
  });

  return NextResponse.json({ orders });
}