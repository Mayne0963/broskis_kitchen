import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { getFirestore } from "firebase-admin/firestore";
import { isAdmin, normalizeRole } from "@/lib/roles";
import type { CateringRequest, CateringListResponse } from "@/types/catering";

const db = getFirestore();

export async function GET(req: NextRequest) {
  try {
    // Check admin authentication using our global role system
    const session = await getServerSession(authOptions);
    const userRole = normalizeRole((session?.user as any)?.role);
    
    if (!isAdmin(userRole)) {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "all";
    const q = (searchParams.get("q") || "").toLowerCase().trim();
    const pageSize = Math.min(Number(searchParams.get("limit") || 20), 100); // Cap at 100
    const cursor = searchParams.get("cursor");

    // Build Firestore query
    let query = db.collection("cateringRequests").orderBy("createdAt", "desc");
    
    // Filter by status if not "all"
    if (status !== "all") {
      query = query.where("status", "==", status);
    }
    
    // Handle pagination cursor
    if (cursor) {
      const cursorTimestamp = Number(cursor);
      if (!isNaN(cursorTimestamp)) {
        query = query.startAfter(cursorTimestamp);
      }
    }

    // Execute query
    const snap = await query.limit(pageSize).get();
    
    // Transform documents to typed objects
    const items: CateringRequest[] = snap.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as CateringRequest));

    // Apply text search filter (client-side for flexibility)
    const filtered = q 
      ? items.filter((item) => 
          (item.name || "").toLowerCase().includes(q) || 
          (item.email || "").toLowerCase().includes(q) ||
          (item.phone || "").toLowerCase().includes(q)
        ) 
      : items;

    // Calculate next cursor
    const nextCursor = snap.docs.length === pageSize && snap.docs.length > 0
      ? String(snap.docs[snap.docs.length - 1].get("createdAt"))
      : null;

    const response: CateringListResponse = {
      items: filtered,
      nextCursor
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error("Error fetching catering requests:", error);
    return NextResponse.json(
      { error: "Internal server error" }, 
      { status: 500 }
    );
  }
}