import { NextResponse } from "next/server";

type LineItemIn = { name?: string; price?: number | string; qty?: number };

function baseUrl() {
  return process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const items: LineItemIn[] = Array.isArray(body?.items) ? body.items : [];
    const clean = items.map((it) => ({
      name: String(it?.name ?? "Item"),
      qty: Math.max(1, Number(it?.qty ?? 1)),
      // convert dollars -> cents, clamp min 0
      amount: Math.max(0, Math.round(Number(it?.price ?? 0) * 100)),
    }));

    const successUrl = `${baseUrl()}/checkout/success`;
    const cancelUrl = `${baseUrl()}/checkout/cancel`;

    // If Stripe secret key missing, or module not available -> mock
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ url: `${successUrl}?mock=1`, mode: "mock" });
    }
    let Stripe: any;
    try {
      Stripe = (await import("stripe")).default;
    } catch {
      return NextResponse.json({ url: `${successUrl}?mock=1&reason=module_missing`, mode: "mock" });
    }
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-04-10" });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: clean.map(li => ({
        price_data: { currency: "usd", product_data: { name: li.name }, unit_amount: li.amount },
        quantity: li.qty
      })),
      success_url: successUrl,
      cancel_url: cancelUrl,
    });

    return NextResponse.json({ url: session.url, mode: "stripe" });
  } catch (e: any) {
    return NextResponse.json({ error: "checkout_error", message: e?.message || "unknown" }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "method_not_allowed" }, { status: 405 });
}