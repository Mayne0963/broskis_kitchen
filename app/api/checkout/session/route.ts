import { NextResponse } from "next/server";

type LineItem = { name: string; price: number | string; qty?: number };

function siteBase() {
  return process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

export async function POST(req: Request) {
  try {
    const { items } = await req.json();
    const normalized: LineItem[] = Array.isArray(items) ? items : [];
    const clean = normalized.map(it => ({
      name: String(it?.name ?? "Item"),
      price: Math.max(0, Math.round(Number(it?.price ?? 0) * 100)), // cents
      qty: Math.max(1, Number(it?.qty ?? 1)),
    }));
    const successUrl = `${siteBase()}/checkout/success`;
    const cancelUrl = `${siteBase()}/checkout/cancel`;
    
    // If no Stripe secret, return mock redirect URL
    if (!process.env.STRIPE_SECRET_KEY) {
      const mock = `${successUrl}?mock=1`;
      return NextResponse.json({ url: mock, mode: "mock" });
    }
    
    // Try to import Stripe; if it fails, fallback to mock
    let stripeMod: any = null;
    try {
      stripeMod = (await import("stripe")).default;
    } catch (_e:any) {
      const mock = `${successUrl}?mock=1&reason=module_missing`;
      return NextResponse.json({ url: mock, mode: "mock" });
    }
    
    const stripe = new stripeMod(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-04-10" });
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: clean.map(li => ({
        price_data: {
          currency: "usd",
          product_data: { name: li.name },
          unit_amount: li.price,
        },
        quantity: li.qty,
      })),
      success_url: successUrl,
      cancel_url: cancelUrl,
    });
    
    return NextResponse.json({ url: session.url, mode: "stripe" });
  } catch (e: any) {
    return NextResponse.json(
      { error: "checkout_error", message: e?.message || "unknown" },
      { status: 400 }
    );
  }
}

export async function GET() {
  // Explicitly disallow GET to avoid confusion
  return NextResponse.json({ error: "method_not_allowed" }, { status: 405 });
}