import { NextRequest, NextResponse } from "next/server";
import { adminAuth } from "../../../../../firebase/admin";
import { getFirestore } from "firebase-admin/firestore";

const db = getFirestore();

export async function POST(req: NextRequest) {
  const { email } = await req.json();
  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });
  
  try {
    const user = await adminAuth.getUserByEmail(email);
    const snap = await db.collection("users").doc(user.uid).get();
    let admin = false;
    
    if (snap.exists) {
      const data = snap.data() || {};
      const raw = (data.role ?? data.Role ?? "").toString().toLowerCase();
      const flag = !!(data.admin || data.ADMIN || data.isAdmin);
      admin = raw === "admin" || flag;
    }
    
    await adminAuth.setCustomUserClaims(user.uid, { admin });
    return NextResponse.json({ ok: true, email, claim: { admin } });
  } catch (e: any) {
    return NextResponse.json({ error: String(e?.message || e) }, { status: 500 });
  }
}