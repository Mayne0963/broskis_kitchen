import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/firebase/admin";
import { isAdmin, normalizeRole } from "@/lib/roles";
import { mapDoc } from "@/lib/catering/transform";
import type { CateringRequest, CateringListResponse } from "@/types/catering";
import { getServerUser } from "@/lib/session";

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

    // Parse query parameters
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "all";
    const q = (searchParams.get("q") || "").toLowerCase().trim();
    const pageSize = Math.min(Number(searchParams.get("limit") || 20), 100); // Cap at 100
    const cursor = searchParams.get("cursor");
    const dateStart = searchParams.get('dateStart');
    const dateEnd = searchParams.get('dateEnd');

    // Build Firestore query
    let query = db.collection("cateringRequests").orderBy("createdAt", "desc");
    
    // Filter by status if not "all"
    if (status !== "all") {
      query = query.where("status", "==", status);
    }
    
    // Note: Date filtering will be applied client-side after fetching
    // to properly handle event.date vs createdAt priority
    
    // Handle pagination cursor
    if (cursor) {
      const cursorTimestamp = Number(cursor);
      if (!isNaN(cursorTimestamp)) {
        query = query.startAfter(cursorTimestamp);
      }
    }

    // Execute query
    const snap = await query.limit(pageSize).get();
    
    // Transform documents using mapDoc for nested/flat compatibility
    let items: CateringRequest[] = snap.docs.map(doc => mapDoc(doc.id, doc.data()) as CateringRequest);

    // Apply date filtering - prioritize event.date over createdAt
    if (dateStart || dateEnd) {
      const startMs = dateStart ? parseInt(dateStart) : null;
      const endMs = dateEnd ? parseInt(dateEnd) : null;

      items = items.filter(item => {
        // Priority: event.date > eventDate (legacy) > createdAt
        let dateToCheck: number;
        
        if (item.event?.date) {
          // Convert event.date string to timestamp (handles various date formats)
          const eventDate = new Date(item.event.date);
          dateToCheck = isNaN(eventDate.getTime()) ? 0 : eventDate.getTime();
        } else if (item.eventDate) {
          // Legacy eventDate field (already a timestamp)
          dateToCheck = item.eventDate;
        } else {
          // Fallback to createdAt
          dateToCheck = item.createdAt || 0;
        }

        // Apply date range filters
        if (startMs && dateToCheck < startMs) return false;
        if (endMs && dateToCheck > endMs) return false;
        return true;
      });
    }

    // Apply text search filter (client-side for flexibility)
     const filtered = q 
       ? items.filter(item => 
           (item.name || "").toLowerCase().includes(q) || 
           (item.email || "").toLowerCase().includes(q) ||
           (item.phone || "").toLowerCase().includes(q) ||
           (item.customer?.name || "").toLowerCase().includes(q) ||
           (item.customer?.email || "").toLowerCase().includes(q) ||
           (item.event?.address || "").toLowerCase().includes(q)
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