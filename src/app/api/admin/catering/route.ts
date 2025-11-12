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

const db = getFirestore();

export async function GET(request: NextRequest) {
  try {
    let isAdmin = false;
    // Preferred: Firebase admin claims via ensureAdmin
    try {
      const user = await ensureAdmin(request);
      isAdmin = !!(user as any).admin || ((user as any).role === 'admin');
    } catch (e) {
      // Fallback: NextAuth session with role
      const session = await getServerSession(authOptions as any);
      const role = (session?.user as any)?.role;
      isAdmin = role === 'admin';
    }

    if (!isAdmin) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    const snap = await db
      .collection("cateringRequests")
      .orderBy("createdAt", "desc")
      .limit(50)
      .get();

    const items = snap.docs.map((doc) => mapDoc(doc.id, doc.data()));

    return NextResponse.json(items);
  } catch (error: any) {
    console.error("Admin catering list error:", error?.message || error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
