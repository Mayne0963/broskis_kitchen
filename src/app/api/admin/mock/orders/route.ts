export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { ensureAdmin, adminDb, Timestamp } from "@/lib/firebase/admin";
import { COLLECTIONS } from "@/lib/firebase/collections";

export async function POST(request: NextRequest) {
  try {
    await ensureAdmin(request);
    const body = await request.json();
    const email = String(body.email || "").trim().toLowerCase();
    const count = Math.min(Math.max(Number(body.count ?? 5), 1), 25);
    if (!email) {
      return NextResponse.json({ ok: false, error: "email required" }, { status: 400 });
    }

    const userSnap = await adminDb
      .collection("users")
      .where("email", "==", email)
      .limit(1)
      .get();
    if (userSnap.empty) {
      return NextResponse.json({ ok: false, error: "user not found" }, { status: 404 });
    }
    const userDoc = userSnap.docs[0];
    const uid = userDoc.id;

    const statuses = ["pending", "confirmed", "preparing", "ready", "delivered"] as const;
    const now = Date.now();

    const batch = adminDb.batch();
    const createdIds: string[] = [];
    for (let i = 0; i < count; i++) {
      const items = [
        { name: "Broski Special", qty: 1 },
        { name: "Street Fries", qty: 1 },
      ];
      const totalCents = 1899 + i * 100;
      const createdAt = Timestamp.fromDate(new Date(now - i * 86400000));
      const status = statuses[i % statuses.length];
      const docRef = adminDb.collection(COLLECTIONS.ORDERS).doc();
      batch.set(docRef, {
        userId: uid,
        items,
        status,
        totalCents,
        total: Number((totalCents / 100).toFixed(2)),
        createdAt,
        updatedAt: createdAt,
        isTest: true,
        tags: ["mock"],
      });
      createdIds.push(docRef.id);
    }
    await batch.commit();

    return NextResponse.json({ ok: true, created: createdIds });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error?.message || "failed to seed orders" },
      { status: 500 }
    );
  }
}
