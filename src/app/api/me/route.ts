export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextResponse } from "next/server";
import { getServerUser } from "@/lib/authServer";
import { adminDb } from "@/lib/firebaseAdmin";

export async function GET() {
  const user = await getServerUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  // Optional profile doc
  const doc = await adminDb.collection("users").doc(user.uid).get();
  const profile = doc.exists ? doc.data() : {};
  return NextResponse.json({ 
    user: {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      ...profile
    }
  });
}