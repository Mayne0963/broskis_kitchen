import { NextResponse } from "next/server";
import Stripe from "stripe";
import { getSessionCookie } from "@/lib/auth/session";

function baseUrl() {
  return process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
}

type InItem = { id?: unknown; name?: unknown; price?: unknown; qty?: unknown };

function toCents(priceDollars: unknown) {
  const n = typeof priceDollars === "string"
    ? parseFloat((priceDollars as string).replace(/[^0-9.]/g, ""))
    : Number(priceDollars);
  const safe = isFinite(n) ? n : 0;
  return Math.max(0, Math.round(safe * 100));
}

export async function POST(req: Request) {
  const secret = process.env.STRIPE_SECRET_KEY;
  if (!secret) {
    return NextResponse.json({ error: "missing_stripe_secret_key" }, { status: 500 });
  }
  const stripe = new Stripe(secret, { apiVersion: "2025-02-24.acacia" });

  // Get user authentication context
  const user = await getSessionCookie();

  const body = await req.json().catch(() => ({}));
  const items: InItem[] = Array.isArray(body?.items) ? body.items : [];
  const clean = items.map((it) => ({
    id: String(it?.id ?? ""),
    name: String(it?.name ?? "Item"),
    qty: Math.max(1, Number(it?.qty ?? 1)),
    amount: toCents(it?.price),
  })).filter(x => x.qty > 0 && x.amount >= 0);

  if (clean.length === 0) {
    return NextResponse.json({ error: "empty_cart" }, { status: 400 });
  }

  // Calculate subtotal and tax
  const TAX_RATE = 0.0825; // 8.25% sales tax
  const subtotalCents = clean.reduce((sum, item) => sum + (item.amount * item.qty), 0);
  const taxCents = Math.round(subtotalCents * TAX_RATE);
  const totalCents = subtotalCents + taxCents;

  // Stripe minimum charge validation
  const MIN_USD_CENTS = 50;
  if (totalCents < MIN_USD_CENTS) {
    return NextResponse.json(
      { error: 'Minimum charge is $0.50 USD. Please add more items.' },
      { status: 400 }
    );
  }

  const successUrl = `${baseUrl()}/checkout/success?session_id={CHECKOUT_SESSION_ID}`;
  const cancelUrl = `${baseUrl()}/checkout/cancel`;

  // Create line items array with products and tax
  const lineItems = [
    ...clean.map(li => ({
      price_data: {
        currency: "usd",
        product_data: { name: li.name },
        unit_amount: li.amount,
      },
      quantity: li.qty,
      adjustable_quantity: { enabled: true, minimum: 1, maximum: 99 },
    })),
    // Add tax as a separate line item
    {
      price_data: {
        currency: "usd",
        product_data: { 
          name: `Sales Tax (${(TAX_RATE * 100).toFixed(2)}%)`,
          description: "State and local taxes"
        },
        unit_amount: taxCents,
      },
      quantity: 1,
    }
  ];

  // Prepare cart items for metadata (with id, name, qty, priceCents)
  const cartItems = clean.map(item => ({
    id: item.id,
    name: item.name,
    qty: item.qty,
    priceCents: item.amount
  }));

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: lineItems,
    mode: 'payment',
    success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/cart`,
    client_reference_id: user?.uid || '',
    metadata: {
      userId: user?.uid || '',
      cartId: `cart_${Date.now()}_${user?.uid || 'anonymous'}`,
      uid: user?.uid || '',
      email: user?.email || '',
      cart: JSON.stringify(cartItems),
      subtotalCents: subtotalCents.toString(),
      taxCents: taxCents.toString(),
      totalCents: totalCents.toString(),
    },
    automatic_tax: {
      enabled: true,
    },
  });

  return NextResponse.json({ 
    url: session.url, 
    mode: "stripe", 
    itemsSent: clean.length,
    subtotal: subtotalCents / 100,
    tax: taxCents / 100,
    total: totalCents / 100,
    sessionId: session.id
  });
}

export async function GET() {
  return NextResponse.json({ error: "method_not_allowed" }, { status: 405 });
}