export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { calcPrice } from "@/lib/catering/price";
import { db } from "@/lib/firebase/admin";
import Stripe from "stripe";
import { Redis } from "@upstash/redis";
import { Ratelimit } from "@upstash/ratelimit";

// Menu rules for each package type
const MENU_RULES = {
  standard: { meats: 2, sides: 2, drinks: 0, appetizers: 0, desserts: 0 },
  premium: { meats: 3, sides: 3, drinks: 1, appetizers: 0, desserts: 0 },
  luxury: { meats: 3, sides: 3, drinks: 1, appetizers: 2, desserts: 1 }
};

// Server-side menu validation function
function serverValidateMenu(menu: any, rule: typeof MENU_RULES.standard) {
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

// Initialize rate limiter
let ratelimit: Ratelimit | null = null;

if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
  const redis = new Redis({
    url: process.env.UPSTASH_REDIS_REST_URL,
    token: process.env.UPSTASH_REDIS_REST_TOKEN,
  });

  ratelimit = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(10, "10 m"), // 10 requests per 10 minutes
    analytics: true,
  });
}

// Helper function to get client IP
function getClientIP(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  const realIP = req.headers.get("x-real-ip");
  
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return "unknown";
}

// Helper function to verify hCaptcha token
async function verifyHCaptcha(token: string): Promise<boolean> {
  if (!token) return false;
  
  const secretKey = process.env.HCAPTCHA_SECRET_KEY;
  if (!secretKey) {
    console.warn("hCaptcha secret key not configured");
    return false;
  }
  
  try {
    const response = await fetch("https://hcaptcha.com/siteverify", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        secret: secretKey,
        response: token,
      }),
    });
    
    const data = await response.json();
    return data.success === true;
  } catch (error) {
    console.error("hCaptcha verification error:", error);
    return false;
  }
}

export async function POST(req: Request) {
  // Check rate limit first
  if (ratelimit) {
    const clientIP = getClientIP(req);
    const { success, limit, reset, remaining } = await ratelimit.limit(clientIP);
    
    if (!success) {
      return NextResponse.json(
        { 
          error: "RATE_LIMITED",
          message: "Too many requests. Please try again later.",
          limit,
          reset,
          remaining
        }, 
        { status: 429 }
      );
    }
  }

  const b = await req.json();
  const { customer, event, packageId, guests, addons = [], menu, captchaToken } = b;

  if (!customer?.name || !customer?.email || !event?.date || !event?.address) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Verify hCaptcha token
  const isCaptchaValid = await verifyHCaptcha(captchaToken);
  if (!isCaptchaValid) {
    return NextResponse.json({ error: "CAPTCHA_FAILED" }, { status: 400 });
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
    const s = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: "2025-02-24.acacia" });
    
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