import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { isAdmin } from "@/lib/roles";
import { getFirestore } from "firebase-admin/firestore";

const db = getFirestore();

export async function GET(req: NextRequest) {
  try {
    // Check admin authentication
    const session = await getServerSession(authOptions);
    if (!isAdmin(session?.user)) {
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    }

    // Fetch all catering requests
    const snapshot = await db
      .collection("cateringRequests")
      .orderBy("createdAt", "desc")
      .get();

    const requests = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    // Generate CSV content
    const headers = [
      "ID",
      "Created At",
      "Event Date", 
      "Name",
      "Email",
      "Phone",
      "Guest Count",
      "Package Tier",
      "Selections",
      "Notes",
      "Status",
      "Total Estimate",
      "Source",
      "Updated At"
    ];

    const csvRows = [
      headers.join(","),
      ...requests.map(req => [
        req.id,
        req.createdAt ? new Date(req.createdAt).toISOString() : "",
        req.eventDate ? new Date(req.eventDate).toISOString() : "",
        `"${(req.name || "").replace(/"/g, '""')}"`,
        `"${(req.email || "").replace(/"/g, '""')}"`,
        `"${(req.phone || "").replace(/"/g, '""')}"`,
        req.guestCount || "",
        req.packageTier || "",
        `"${(req.selections || []).join("; ").replace(/"/g, '""')}"`,
        `"${(req.notes || "").replace(/"/g, '""')}"`,
        req.status || "",
        req.totalEstimate || "",
        req.source || "",
        req.updatedAt ? new Date(req.updatedAt).toISOString() : ""
      ].join(","))
    ];

    const csvContent = csvRows.join("\n");
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