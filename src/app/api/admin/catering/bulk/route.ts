import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getFirestore } from "firebase-admin/firestore";
import { isAdmin, normalizeRole } from "@/lib/roles";
import type { CateringStatus } from "@/types/catering";

const db = getFirestore();

// Valid status values for validation
const VALID_STATUSES: CateringStatus[] = [
  "new", "in_review", "quoted", "confirmed", "cancelled", "archived", "paid"
];

export async function PATCH(req: NextRequest) {
  try {
    // Check admin authentication
    const session = await getServerSession(authOptions);
    const userRole = normalizeRole((session?.user as any)?.role);
    
    if (!isAdmin(userRole)) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    // Parse request body
    const body = await req.json();
    const { ids, status } = body;

    // Validate request body
    if (!Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ error: "Invalid or empty ids array" }, { status: 400 });
    }

    if (!status || typeof status !== "string") {
      return NextResponse.json({ error: "Status is required and must be a string" }, { status: 400 });
    }

    // Validate status value
    if (!VALID_STATUSES.includes(status as CateringStatus)) {
      return NextResponse.json({ 
        error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` 
      }, { status: 400 });
    }

    // Validate IDs are strings
    if (!ids.every(id => typeof id === "string" && id.trim().length > 0)) {
      return NextResponse.json({ error: "All IDs must be non-empty strings" }, { status: 400 });
    }

    // Limit batch size for performance
    if (ids.length > 500) {
      return NextResponse.json({ error: "Cannot update more than 500 items at once" }, { status: 400 });
    }

    // Create batch write
    const batch = db.batch();
    const timestamp = Date.now();
    let updateCount = 0;

    // Add each document update to the batch
    for (const id of ids) {
      const docRef = db.collection("cateringRequests").doc(id.trim());
      
      // Check if document exists first (optional - you can remove this for better performance)
      try {
        const doc = await docRef.get();
        if (doc.exists) {
          batch.update(docRef, {
            status: status,
            updatedAt: timestamp
          });
          updateCount++;
        }
      } catch (error) {
        console.warn(`Document ${id} not found or inaccessible, skipping`);
      }
    }

    // Execute batch write
    if (updateCount > 0) {
      await batch.commit();
    }

    // Log the bulk action for audit purposes
    console.log(`[BULK UPDATE] Admin ${session.user?.email} updated ${updateCount} catering requests to status: ${status}`);

    return NextResponse.json({
      success: true,
      count: updateCount,
      status: status,
      message: `Successfully updated ${updateCount} item${updateCount !== 1 ? 's' : ''} to ${status}`
    });

  } catch (error) {
    console.error("Bulk update error:", error);
    return NextResponse.json(
      { error: "Internal server error during bulk update" },
      { status: 500 }
    );
  }
}