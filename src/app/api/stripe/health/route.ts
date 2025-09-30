import { NextResponse } from "next/server";
import Stripe from "stripe";
import { adminDb, Timestamp } from "@/lib/firebase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const hasSecret = !!process.env.STRIPE_SECRET_KEY;
    const hasWebhook = !!process.env.STRIPE_WEBHOOK_SECRET;
    const stripeOk = (() => {
      try { new Stripe(process.env.STRIPE_SECRET_KEY || "", { apiVersion: "2025-02-24.acacia" }); return !!hasSecret; }
      catch { return false; }
    })();

    // Firestore smoke write/read to a throwaway doc
    const ref = adminDb.collection("healthChecks").doc("stripeWebhook");
    await ref.set({ at: Timestamp.now(), stripeOk, hasWebhook }, { merge: true });
    const snap = await ref.get();

    return NextResponse.json({
      ok: true,
      stripeSecretPresent: hasSecret,
      webhookSecretPresent: hasWebhook,
      stripeClientInitOk: stripeOk,
      firestoreWriteReadOk: snap.exists,
      now: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message || String(err) }, { status: 500 });
  }
}