export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { adminDb, adminAuth } from "@/lib/firebase/admin";
import { getServerUser } from "@/lib/authServer";

export async function POST(req: NextRequest) {
  const me = await getServerUser();
  if (!me || (me.role !== "admin" && (me as any).token?.admin !== true)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const apply: boolean = body?.apply !== false;
  const limit = Math.min(500, Number(body?.limit ?? 200));
  const iterate: boolean = body?.iterate !== false;

  let processed = 0;
  let updated = 0;
  let skipped = 0;
  let errors: Array<{ id: string; reason: string }> = [];

  let lastDoc: FirebaseFirestore.QueryDocumentSnapshot | null = null;
  let batchCount = 0;
  do {
    let q = adminDb
      .collection("orders")
      .where("userEmail", "!=", "")
      .orderBy("userEmail")
      .limit(limit);
    if (lastDoc) q = q.startAfter(lastDoc);

    const snap = await q.get();
    batchCount = snap.docs.length;
    for (const doc of snap.docs) {
      processed++;
      const o = doc.data() as any;
      const id = doc.id;
      const email = o.userEmail;
      const hasUid = !!o.userId;
      if (!email || hasUid) {
        skipped++;
        continue;
      }
      try {
        const user = await adminAuth.getUserByEmail(email);
        if (!user?.uid) {
          skipped++;
          continue;
        }
        if (apply) {
          await adminDb.collection("orders").doc(id).update({ userId: user.uid });
          try {
            await adminDb
              .collection("users")
              .doc(user.uid)
              .collection("orders")
              .doc(id)
              .set({ ...o, userId: user.uid }, { merge: true });
          } catch {}
        }
        updated++;
      } catch (e: any) {
        errors.push({ id, reason: String(e?.message || e) });
      }
    }
    lastDoc = snap.docs[snap.docs.length - 1] || null;
  } while (iterate && batchCount === limit);

  return NextResponse.json({ apply, processed, updated, skipped, errors });
}