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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const aggregate = searchParams.get("aggregate") === "true";
    const q = (searchParams.get("q") || "").toLowerCase();
    const limit = Math.min(parseInt(searchParams.get("limit") || "100"), 1000);

    const baseQuery = adminDb
      .collection("workplaceSignups")
      .orderBy("createdAt", "desc")
      .limit(limit);

    const snap = await baseQuery.get();

    if (!aggregate) {
      const signups = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      return NextResponse.json({ signups });
    }

    const allShifts = ["1st", "2nd", "3rd"];
    const map = new Map<string, Set<string>>();
    for (const d of snap.docs) {
      const data = d.data() as any;
      const name = String(data.workplaceName || "").trim();
      if (!name) continue;
      const rawShift = String(data.shift || "").trim().toLowerCase();
      let shifts: string[] = [];
      if (rawShift === "multiple") {
        shifts = allShifts;
      } else if (["1st", "2nd", "3rd"].includes(String(data.shift))) {
        shifts = [String(data.shift)];
      }
      if (!map.has(name)) map.set(name, new Set<string>());
      const set = map.get(name)!;
      for (const s of shifts) set.add(s);
    }

    let workplaces = Array.from(map.entries()).map(([workplaceName, set]) => ({
      workplaceName,
      shifts: Array.from(set).sort(),
    }));

    if (q) {
      workplaces = workplaces.filter(w => w.workplaceName.toLowerCase().includes(q));
    }

    return NextResponse.json({ workplaces });
  } catch (err) {
    console.error("Failed to fetch workplace signups:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
