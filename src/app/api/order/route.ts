import { NextRequest, NextResponse } from "next/server";

function isValidDate(value: unknown): value is string {
  return typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export async function POST(req: NextRequest) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch {
      body = {};
    }

    let deliveryDate = isValidDate(body.deliveryDate) ? body.deliveryDate : null;
    if (!deliveryDate) {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      deliveryDate = tomorrow.toISOString().slice(0, 10);
    }

    if (!body.items || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { error: "Order must include at least one item." },
        { status: 400 }
      );
    }
    if (typeof body.total !== "number") {
      return NextResponse.json({ error: "Order total must be a number." }, { status: 400 });
    }

    const order = {
      createdAt: new Date().toISOString(),
      customerName: body.customerName || null,
      phone: body.phone || null,
      email: body.email || null,
      items: body.items,
      total: body.total,
      workplaceName: body.workplaceName || null,
      workplaceShift: body.workplaceShift || null,
      deliveryDate,
    };

    console.log("NEW ORDER RECEIVED:", order);

    return NextResponse.json({ success: true, orderId: null });
  } catch (err) {
    console.error("Order API error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
