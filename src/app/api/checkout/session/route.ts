export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from "next/server";
import { getServerUser } from "@/lib/authServer";

type InItem = { name?: any; price?: any; qty?: any };
type NormItem = { name: string; price: number; qty: number };

function normalizeItem(it: InItem): NormItem | null {
  const name = typeof it?.name === "string" ? it.name : String(it?.name ?? "Item");
  const price = typeof it?.price === "string"
    ? parseFloat(it.price.replace(/[^0-9.]/g, ""))
    : Number(it?.price ?? 0);
  const qty = Math.max(1, Number(it?.qty ?? 1));
  if (!name || !Number.isFinite(price) || price < 0 || !Number.isFinite(qty) || qty < 1) return null;
  return { name, price, qty };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawItems: InItem[] = Array.isArray(body?.items) ? body.items : [];
    const serverUser = await getServerUser().catch(() => null);

    const items: NormItem[] = rawItems.map(normalizeItem).filter(Boolean) as NormItem[];
    console.log("[CHECKOUT] incoming items:", rawItems);
    console.log("[CHECKOUT] normalized items:", items);

    if (items.length === 0) {
      return NextResponse.json(
        { error: "No valid items provided" },
        { status: 400 }
      );
    }

    const total = items.reduce((sum, it) => sum + it.price * it.qty, 0);
    console.log("[CHECKOUT] computed total:", total);

    let url: string | null = null;
    let sessionId: string | null = null;

    if (process.env.STRIPE_SECRET_KEY) {
      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-02-24.acacia" });

      const line_items = items.map((it) => ({
        price_data: {
          currency: "usd",
          product_data: { name: it.name },
          unit_amount: Math.round(it.price * 100),
        },
        quantity: it.qty,
      }));

      const successBase = process.env.NEXTAUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://broskiskitchen.com";
      const metadata: Record<string, string> = {};
      if (serverUser?.uid) metadata.userId = serverUser.uid;
      if (serverUser?.email) metadata.userEmail = serverUser.email;
      if (items.length) {
        metadata.items = items.slice(0, 10).map((it) => it.name).join(", ").slice(0, 400);
      }

      // Lunch Drop metadata (optional)
      const workplaceName = typeof body?.workplaceName === 'string' && body.workplaceName.trim().length > 0
        ? body.workplaceName.trim()
        : undefined;
      const workplaceShift = typeof body?.workplaceShift === 'string' && ['1st','2nd','3rd'].includes(body.workplaceShift)
        ? body.workplaceShift
        : undefined;
      if (workplaceName) metadata.workplaceName = workplaceName;
      if (workplaceShift) metadata.workplaceShift = workplaceShift;

      const session = await stripe.checkout.sessions.create({
        mode: "payment",
        line_items,
        success_url: `${successBase}/checkout?success=1`,
        cancel_url: `${successBase}/checkout?canceled=1`,
        client_reference_id: serverUser?.uid || undefined,
        customer_email: serverUser?.email || undefined,
        // Attach metadata to the Checkout Session (for session-based processing)
        metadata: Object.keys(metadata).length ? metadata : undefined,
        // Ensure metadata is copied onto the PaymentIntent so webhook `payment_intent.succeeded`
        // can read Lunch Drop fields reliably
        payment_intent_data: Object.keys(metadata).length
          ? { metadata }
          : undefined,
      });
      url = session.url ?? null;
      sessionId = session.id ?? null;
      console.log("[CHECKOUT] stripe session created:", { sessionId, hasUrl: !!url });
    } else {
      console.warn("[CHECKOUT] STRIPE_SECRET_KEY not configured; returning mock URL");
      url = "/mock/checkout";
    }

    return NextResponse.json({ url, sessionId, count: items.length, total });
  } catch (error: any) {
    console.error("[CHECKOUT] error:", error);
    return NextResponse.json(
      { error: error?.message ?? "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
