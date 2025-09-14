import { NextResponse } from "next/server";
import Stripe from "stripe";

function baseUrl() {
  return process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

export async function POST(req: Request) {
  // Validate keys
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ error: "missing_stripe_secret_key" }, { status: 500 });
  }
  const stripe = new Stripe(secret, { apiVersion: "2024-04-10" });

  try {
    const body = await req.json().catch(() => ({}));
    const items = Array.isArray(body?.items) ? body.items : [];
    if (!items.length) {
      // simple default if cart not wired yet
      items.push({ name: "Order", price: 12.99, qty: 1 });
    }
    const line_items = items.map((it: any) => ({
      price_data: {
        currency: "usd",
        product_data: { name: String(it?.name ?? "Item") },
        unit_amount: Math.max(0, Math.round(Number(it?.price ?? 0) * 100)),
      },
      quantity: Math.max(1, Number(it?.qty ?? 1)),
      adjustable_quantity: { enabled: true, minimum: 1, maximum: 99 },
    }));

    const success_url = `${baseUrl()}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
    const cancel_url = `${baseUrl()}/checkout/cancel`;

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items,
      success_url,
      cancel_url,
    });

    return NextResponse.json({ url: session.url, mode: "stripe" });
  } catch (e: any) {
    return NextResponse.json({ error: "checkout_error", message: e?.message || "unknown" }, { status: 400 });
  }
}

export async function GET() {
  return NextResponse.json({ error: "method_not_allowed" }, { status: 405 });
}