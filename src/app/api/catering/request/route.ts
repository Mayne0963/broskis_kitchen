export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { calcPrice } from "@/lib/catering/price";
import { db } from "@/lib/firebase/admin";
import type { CateringMenu } from "@/types/catering";

// Menu rules for each package type
const MENU_RULES = {
  standard: { meats: 2, sides: 2, drinks: 0, appetizers: 0, desserts: 0 },
  premium: { meats: 3, sides: 3, drinks: 1, appetizers: 0, desserts: 0 },
  luxury: { meats: 3, sides: 3, drinks: 1, appetizers: 2, desserts: 1 }
};

// Server-side menu validation function
function serverValidateMenu(menu: CateringMenu | undefined, rule: typeof MENU_RULES.standard) {
  if (!menu) return { ok: false, msg: "Menu required" };
  
  if ((menu.meats || []).length > rule.meats) {
    return { ok: false, msg: `Choose up to ${rule.meats} meats` };
  }
  if ((menu.meats || []).length < 1) {
    return { ok: false, msg: "Pick at least 1 meat" };
  }
  if ((menu.sides || []).length > rule.sides) {
    return { ok: false, msg: `Choose up to ${rule.sides} sides` };
  }
  if (rule.drinks && (menu.drinks || []).length !== rule.drinks) {
    return { ok: false, msg: `Choose ${rule.drinks} drink` };
  }
  if (rule.appetizers && (menu.appetizers || []).length !== rule.appetizers) {
    return { ok: false, msg: `Choose ${rule.appetizers} appetizer${rule.appetizers > 1 ? 's' : ''}` };
  }
  if (rule.desserts && (menu.desserts || []).length !== rule.desserts) {
    return { ok: false, msg: `Choose ${rule.desserts} dessert` };
  }
  
  return { ok: true };
}

export async function POST(req: Request) {
  const b = await req.json();
  const { customer, event, packageId, guests, addons = [], menu } = b;
  
  if (!customer?.name || !customer?.email || !event?.date || !event?.address) {
    return NextResponse.json({ error: "INVALID" }, { status: 400 });
  }
  
  if (guests < 25) {
    return NextResponse.json({ error: "MIN_GUESTS" }, { status: 422 });
  }
  
  // Validate package ID and get menu rules
  const rule = MENU_RULES[packageId as keyof typeof MENU_RULES];
  if (!rule) {
    return NextResponse.json({ error: "INVALID_PACKAGE" }, { status: 400 });
  }
  
  // Validate menu selection
  const menuValidation = serverValidateMenu(menu, rule);
  if (!menuValidation.ok) {
    // Log invalid submission for debugging
    console.warn("Bad menu submission", { 
      packageId, 
      menu, 
      ip: req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown'
    });
    return NextResponse.json({ error: menuValidation.msg }, { status: 422 });
  }
  
  const price = calcPrice(packageId, guests, addons);
  const ref = db.collection("cateringRequests").doc();
  
  const payload = {
    id: ref.id,
    createdAt: new Date().toISOString(),
    customer,
    event,
    packageId,
    guests,
    addons,
    menu,
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