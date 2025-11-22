import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    const workplace = {
      createdAt: new Date().toISOString(),
      workplaceName: body.workplaceName || "",
      address: body.address || "",
      contactName: body.contactName || "",
      phone: body.phone || "",
      email: body.email || "",
      shift: body.shift || "",
      employeeCount: body.employeeCount || null,
      deliveryNotes: body.deliveryNotes || "",
    };

    console.log("NEW WORKPLACE SIGNUP:", workplace);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Workplace signup error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
