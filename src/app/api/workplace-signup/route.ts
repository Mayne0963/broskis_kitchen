import { NextRequest, NextResponse } from "next/server";
import { adminDb, Timestamp } from "@/lib/firebase/admin";

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const requiredFields = [
      "workplaceName",
      "address",
      "contactName",
      "phone",
      "email",
      "shift",
    ];

    for (const field of requiredFields) {
      if (!body[field] || String(body[field]).trim().length === 0) {
        return NextResponse.json(
          { error: `Missing required field: ${field}` },
          { status: 400 }
        );
      }
    }

    const workplace = {
      createdAt: Timestamp.now(),
      workplaceName: String(body.workplaceName),
      address: String(body.address),
      contactName: String(body.contactName),
      phone: String(body.phone),
      email: String(body.email),
      shift: String(body.shift),
      employeeCount:
        body.employeeCount !== undefined && body.employeeCount !== null
          ? Number(body.employeeCount)
          : null,
      deliveryNotes: body.deliveryNotes ? String(body.deliveryNotes) : "",
      status: "new",
      source: "website",
    };
    const docRef = await adminDb.collection("workplaceSignups").add(workplace);

    return NextResponse.json({ success: true, id: docRef.id });
  } catch (err) {
    console.error("Workplace signup error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET() {
  try {
    const snap = await adminDb
      .collection("workplaceSignups")
      .orderBy("createdAt", "desc")
      .limit(5)
      .get();

    const signups = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    return NextResponse.json({ signups });
  } catch (err) {
    console.error("Failed to fetch workplace signups:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
