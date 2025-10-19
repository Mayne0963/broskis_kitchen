import { NextRequest, NextResponse } from "next/server";
import { isAdmin, normalizeRole } from "@/lib/roles";
import { getFirestore } from "firebase-admin/firestore";
import { mapDoc } from "@/lib/catering/transform";
import { getServerUser } from "@/lib/session";

const db = getFirestore();

export async function GET(req: NextRequest) {
  try {
    // Check admin authentication using custom session system
    const user = await getServerUser();
    if (!user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    
    const userRole = normalizeRole(user.roles?.[0] || 'user');
    if (!isAdmin(userRole)) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
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