export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { calcPrice } from "@/lib/catering/price";
import { fdb } from "@/lib/firebase/admin";

export async function POST(req: Request) {
  const b = await req.json();
  const { customer, event, packageId, guests, addons = [], menu } = b;
  
  if (!customer?.name || !customer?.email || !event?.date || !event?.address) {
    return NextResponse.json({ error: "INVALID" }, { status: 400 });
  }
  
  if (guests < 25) {
    return NextResponse.json({ error: "MIN_GUESTS" }, { status: 422 });
  }
  
  const price = calcPrice(packageId, guests, addons);
  const ref = fdb.collection("cateringRequests").doc();
  
  const payload = {
    id: ref.id,
    createdAt: new Date().toISOString(),
    customer,
    event,
    packageId,
    guests,
    addons,
    ...(menu && { menu }),
    price,
    status: "pending"
  };
  
  let stripe = null;
  if (process.env.STRIPE_SECRET_KEY) {
    const Stripe = (await import("stripe")).default;
    const s = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2024-06-20" });
    
    const session = await s.checkout.sessions.create({
      mode: "payment",
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: {
            name: `Deposit ${packageId}`
          },
          unit_amount: Math.round(price.deposit * 100)
        },
        quantity: 1
      }],
      success_url: `${process.env.NEXTAUTH_URL || "https://broskiskitchen.com"}/catering?success=1`,
      cancel_url: `${process.env.NEXTAUTH_URL || "https://broskiskitchen.com"}/catering?canceled=1`
    });
    
    stripe = { checkoutUrl: session.url };
  }
  
  await ref.set({ ...payload, stripe });
  
  return NextResponse.json({ ok: true, id: ref.id, price, stripe });
}