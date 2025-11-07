export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { getFirestore } from "firebase-admin/firestore";
import { mapDoc } from "@/lib/catering/transform";

const db = getFirestore();

export async function GET() {
  try {
    const session = await getServerSession(authOptions as any);
    const role = (session?.user as any)?.role;

    if (!session || role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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