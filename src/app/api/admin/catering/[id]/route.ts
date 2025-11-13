import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getFirestore } from "firebase-admin/firestore";
import { ensureAdmin } from "@/lib/firebase/admin";
import { mapDoc } from "@/lib/catering/transform";
import type { CateringRequest, CateringUpdateRequest } from "@/types/catering";

const db = getFirestore();

export async function GET(
  _: NextRequest, 
  { params }: { params: { id: string } }
) {
  try {
    // Validate ID parameter
    if (!params.id || typeof params.id !== "string") {
      return NextResponse.json({ error: "Invalid request ID" }, { status: 400 });
    }

    // Fetch document from Firestore
    const doc = await db.collection("cateringRequests").doc(params.id).get();
    
    if (!doc.exists) {
      return NextResponse.json({ error: "Catering request not found" }, { status: 404 });
    }

    // Transform document using mapDoc for nested/flat compatibility
    const cateringRequest = mapDoc(doc.id, doc.data()) as CateringRequest;

    return NextResponse.json(cateringRequest);

  } catch (error) {
    console.error("Error fetching catering request:", error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest, 
  { params }: { params: { id: string } }
) {
  try {
    await ensureAdmin(req);

    // Validate ID parameter
    if (!params.id || typeof params.id !== "string") {
      return NextResponse.json({ error: "Invalid request ID" }, { status: 400 });
    }

    // Parse request body
    const body: CateringUpdateRequest = await req.json();
    
    // Build update object with validation
    const updates: Record<string, any> = {};
    
    if (body.status) {
      const validStatuses = ["new", "in_review", "quoted", "confirmed", "cancelled", "archived"];
      if (validStatuses.includes(body.status)) {
        updates.status = body.status;
      } else {
        return NextResponse.json({ error: "Invalid status value" }, { status: 400 });
      }
    }
    
    if (typeof body.notes === "string") {
      updates.notes = body.notes.trim();
    }
    
    if (typeof body.totalEstimate === "number" && body.totalEstimate >= 0) {
      updates.totalEstimate = body.totalEstimate;
    }
    
    // Always update the timestamp
    updates.updatedAt = Date.now();

    // Check if document exists before updating
    const docRef = db.collection("cateringRequests").doc(params.id);
    const docSnap = await docRef.get();
    
    if (!docSnap.exists) {
      return NextResponse.json({ error: "Catering request not found" }, { status: 404 });
    }

    // Perform the update
    await docRef.set(updates, { merge: true });
    
    // Fetch and return updated document
    const updatedDoc = await docRef.get();
    const updatedRequest = mapDoc(updatedDoc.id, updatedDoc.data()) as CateringRequest;

    return NextResponse.json(updatedRequest);

  } catch (error) {
    console.error("Error updating catering request:", error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}
