export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { getFirestore } from "firebase-admin/firestore";
import { mapDoc } from "@/lib/catering/transform";
import { ensureAdmin } from "@/lib/firebase/admin";
import { handleServerError } from "@/lib/utils/errorLogger";

const db = getFirestore();

export async function GET(request: NextRequest) {
  try {
    try {
      await ensureAdmin(request);
    } catch {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const snap = await db
      .collection("cateringRequests")
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    const items = snap.docs.map((doc) => mapDoc(doc.id, doc.data()));
    return NextResponse.json({ items, nextCursor: null });
  } catch (error: any) {
    const details = handleServerError(error, "api/admin/catering");
    return NextResponse.json(details, { status: 500 });
  }
}
