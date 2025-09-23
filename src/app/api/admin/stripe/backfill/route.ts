/**
 * Stripe → Firestore Backfill API
 * 
 * This endpoint allows admins to import historical Stripe data into Firestore orders.
 * 
 * Usage:
 * POST /api/admin/stripe/backfill
 * 
 * Body:
 * {
 *   "mode": "sessions" | "payment_intents",  // Default: "sessions"
 *   "since": "2024-01-01T00:00:00Z",          // ISO date string (optional)
 *   "limit": 100,                             // Items per page (default: 100)
 *   "maxPages": 5,                            // Max pages to process (default: 5)
 *   "dryRun": true                            // Simulate only (default: true)
 * }
 * 
 * Examples:
 * - Dry run last 50 sessions: {"mode": "sessions", "limit": 50, "dryRun": true}
 * - Import payment intents since Jan 1: {"mode": "payment_intents", "since": "2024-01-01T00:00:00Z", "dryRun": false}
 * 
 * Features:
 * - Idempotent: Safe to run multiple times
 * - Supports both Stripe sessions and payment intents
 * - Preserves existing createdAt timestamps
 * - DryRun:true simulates results without writing to Firestore
 * - DryRun:false actually writes orders into Firestore
 */

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { adminDb, Timestamp } from "@/lib/firebaseAdmin";
import { toOrderDocFromSession } from "@/lib/orders/normalizeStripeOrder";
import { requireAdmin } from "@/lib/auth/adminOnly";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
});

// -------- Helpers --------
async function upsertOrderFromSession(session: any, dryRun = false) {
  try {
    let lineItems: any[] = [];
    if (session?.line_items?.data) {
      lineItems = session.line_items.data;
    } else {
      const li = await stripe.checkout.sessions.listLineItems(session.id, { limit: 100 });
      lineItems = li.data;
    }

    const orderDoc = toOrderDocFromSession(session, lineItems);
    if (dryRun) return { id: session.id, simulated: true };

    const ref = adminDb.collection("orders").doc(session.id);
    const existing = await ref.get();
    const dataToSave = {
      ...orderDoc,
      createdAt:
        (existing.exists ? existing.data()?.createdAt : null) ??
        orderDoc.createdAt ??
        Timestamp.now(),
    };

    await ref.set(dataToSave, { merge: true });
    return { id: session.id, written: true };
  } catch (err) {
    console.error("Upsert from session error:", err);
    throw err;
  }
}

// ---- Helper: upsert from Stripe payment intent ----
async function upsertOrderFromPaymentIntent(pi: any, dryRun = false) {
  try {
    const orderDoc = {
      id: pi.id,
      source: "stripe" as const,
      status: pi.status === "succeeded" ? "paid" : pi.status,
      userId: pi.metadata?.userId ?? null,
      email: pi.receipt_email ?? null,
      amount: typeof pi.amount === "number" ? pi.amount : null,
      currency: pi.currency ?? "usd",
      items: [] as any[],
      createdAt: Timestamp.now(),
    };

    if (dryRun) return { id: pi.id, simulated: true };

    const ref = adminDb.collection("orders").doc(pi.id);
    const existing = await ref.get();
    const dataToSave = {
      ...orderDoc,
      createdAt:
        (existing.exists ? existing.data()?.createdAt : null) ??
        orderDoc.createdAt ??
        Timestamp.now(),
    };

    await ref.set(dataToSave, { merge: true });
    return { id: pi.id, written: true };
  } catch (err) {
    console.error("Upsert from payment_intent error:", err);
    throw err;
  }
}

// -------- Types -------- 
type BackfillBody = { 
  mode?: "sessions" | "payment_intents"; 
  since?: string; // ISO date 
  limit?: number; // per page 
  maxPages?: number; 
  dryRun?: boolean; 
}; 

// -------- Route -------- 
export async function POST(req: NextRequest) { 
  try { 
    // Admin gate (returns NextResponse on failure) 
    const gate = await requireAdmin(req); 
    if (gate instanceof NextResponse) return gate; 

    // Parse body with defaults 
    const body = (await req.json().catch(() => ({}))) as BackfillBody; 
    const mode: "sessions" | "payment_intents" = body.mode ?? "sessions"; 
    const limit: number = Math.max(1, Math.min(100, body.limit ?? 100)); 
    const maxPages: number = Math.max(1, body.maxPages ?? 5); 
    const dryRun: boolean = body.dryRun ?? true; 

    // since -> created[gte] (UNIX seconds) 
    let createdGte: number | undefined; 
    if (body.since) { 
      const d = new Date(body.since); 
      if (!isNaN(d.getTime())) { 
        createdGte = Math.floor(d.getTime() / 1000); 
      } 
    } 

    const results: any[] = []; 
    let pages = 0; 
    let startingAfter: string | undefined; 

    if (mode === "sessions") { 
      while (pages < maxPages) { 
        const listParams: any = { 
          limit, 
          expand: ["data.line_items"], 
        }; 
        if (createdGte) listParams.created = { gte: createdGte }; 
        if (startingAfter) listParams.starting_after = startingAfter; 

        const resp = await stripe.checkout.sessions.list(listParams); 

        for (const session of resp.data) { 
          if (session.payment_status === "paid" || session.status === "complete") { 
            const out = await upsertOrderFromSession(session, dryRun); 
            results.push(out); 
          } 
        } 

        pages++; 
        if (!resp.has_more) break; 
        if (resp.data.length > 0) startingAfter = resp.data[resp.data.length - 1].id; 
      } 
    } else { 
      // payment_intents 
      while (pages < maxPages) { 
        const listParams: any = { limit }; 
        if (createdGte) listParams.created = { gte: createdGte }; 
        if (startingAfter) listParams.starting_after = startingAfter; 

        const resp = await stripe.paymentIntents.list(listParams); 

        for (const pi of resp.data) { 
          if (pi.status === "succeeded") { 
            const out = await upsertOrderFromPaymentIntent(pi, dryRun); 
            results.push(out); 
          } 
        } 

        pages++; 
        if (!resp.has_more) break; 
        if (resp.data.length > 0) startingAfter = resp.data[resp.data.length - 1].id; 
      } 
    } 

    return NextResponse.json({ 
      ok: true, 
      mode, 
      dryRun, 
      pagesProcessed: pages, 
      count: results.length, 
      sample: results.slice(0, 10), 
    }); 
  } catch (error: any) { 
    console.error("Backfill error:", error); 
    return NextResponse.json( 
      { ok: false, error: error?.message ?? "Unknown error" }, 
      { status: 500 } 
    ); 
  } 
}