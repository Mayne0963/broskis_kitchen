import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { isAdmin } from "@/lib/roles";
import { ensureAdmin } from "@/lib/firebase/admin";
import { getFirestore } from "firebase-admin/firestore";
import { mapDoc } from "@/lib/catering/transform";

const db = getFirestore();

export async function GET(req: NextRequest) {
  try {
    // Primary admin authentication via Firebase Admin
    try {
      await ensureAdmin(req);
    } catch (e) {
      // Fallback to NextAuth session role if Firebase check not available
      const session = await getServerSession(authOptions);
      const role = (session?.user as any)?.role;
      if (!isAdmin(role)) {
        return NextResponse.json({ error: "forbidden" }, { status: 403 });
      }
    }

    // Fetch all catering requests
    const snapshot = await db
      .collection("cateringRequests")
      .orderBy("createdAt", "desc")
      .get();

    // Transform documents using mapDoc for nested/flat compatibility
    const rows = snapshot.docs.map(d => mapDoc(d.id, d.data()));

    // Generate CSV content with comprehensive nested data structure
    const headers = [
      "id","createdAt","eventDate","eventAddress","customerName","customerEmail",
      "guests","packageTier","status","currency","subtotal","deposit","addons","total","checkoutUrl","notes"
    ];

    const csv = [
      headers.join(","),
      ...rows.map((r: any) =>
        [
          r.id, r.createdAt, r.event?.date, r.event?.address,
          r.customer?.name, r.customer?.email, r.event?.guests,
          r.packageTier, r.status, r.price?.currency,
          r.price?.subtotal, r.price?.deposit, r.price?.addons,
          r.price?.total, r.stripe?.checkoutUrl, r.notes
        ].map(v => JSON.stringify(v ?? "")).join(",")
      ),
    ].join("\n");

    const csvContent = csv;
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `catering-requests-${timestamp}.csv`;

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": "no-cache"
      }
    });

  } catch (error: any) {
    console.error("CSV export error:", error);
    return NextResponse.json(
      { error: "Failed to export CSV" },
      { status: 500 }
    );
  }
}
