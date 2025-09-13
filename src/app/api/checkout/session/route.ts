import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { items, successUrl, cancelUrl } = await req.json();

    // Fallback to mock if no Stripe key
    if (!process.env.STRIPE_SECRET_KEY) {
      const url = `${successUrl || "/checkout/success"}?mock=1`;
      return NextResponse.json({ url });
    }

    // Lazy import stripe without new deps
    const Stripe = (await import("stripe")).default;
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-04-10" });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: (items || []).map((it: any) => ({
        price_data: {
          currency: "usd",
          product_data: { name: it.name },
          unit_amount: Math.round(Number(it.price) * 100),
        },
        quantity: it.qty || 1,
      })),
      success_url: `${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/checkout/success`,
      cancel_url: `${process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/checkout/cancel`,
    });

    return NextResponse.json({ url: session.url });
  } catch (e: any) {
    return NextResponse.json({ error: "checkout_error", message: e?.message || "unknown" }, { status: 400 });
  }
}