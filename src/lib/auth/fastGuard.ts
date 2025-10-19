import { cookies } from "next/headers";
import { adminAuth } from "@/lib/firebase/admin";
import { NextRequest, NextResponse } from "next/server";

/**
 * Fast 401/403 guard for admin API routes
 * Uses Firebase session cookie for zero-fetch authentication
 * Returns Response object for immediate short-circuit on auth failure
 */
export async function fastAdminGuard(request?: NextRequest): Promise<Response | null> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("__session")?.value || cookieStore.get("session")?.value;
    
    // Check if user is authenticated
    if (!sessionCookie) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }), 
        { 
          status: 401,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    
    // Check if user has admin role
    const userRole = (decoded as any).role || 'user';
    const isAdmin = userRole === 'admin' || (decoded as any).admin === true;
    
    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }), 
        { 
          status: 403,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    
    // Authentication successful - return null to continue
    return null;
  } catch (error) {
    console.error("Fast admin guard error:", error);
    return new Response(
      JSON.stringify({ error: "Authentication error" }), 
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}

/**
 * Fast user guard for authenticated API routes
 * Returns user session data or Response object for auth failure
 */
export async function fastUserGuard(request?: NextRequest): Promise<{ user: any } | Response> {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("__session")?.value || cookieStore.get("session")?.value;
    
    if (!sessionCookie) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }), 
        { 
          status: 401,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    
    const decoded = await adminAuth.verifySessionCookie(sessionCookie, true);
    
    return { 
      user: {
        uid: decoded.uid,
        email: decoded.email,
        role: (decoded as any).role || 'user',
        name: (decoded as any).name || decoded.email?.split('@')[0]
      }
    };
  } catch (error) {
    console.error("Fast user guard error:", error);
    return new Response(
      JSON.stringify({ error: "Authentication error" }), 
      { 
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
}