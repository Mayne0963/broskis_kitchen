import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { NextRequest, NextResponse } from "next/server";

/**
 * Fast 401/403 guard for admin API routes
 * Uses getServerSession for zero-fetch authentication
 * Returns Response object for immediate short-circuit on auth failure
 */
export async function fastAdminGuard(request?: NextRequest): Promise<Response | null> {
  try {
    const session = await getServerSession(authOptions as any);
    
    // Check if user is authenticated
    if (!session?.user) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }), 
        { 
          status: 401,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    
    // Check if user has admin role
    const userRole = (session.user as any).role;
    if (userRole !== "admin") {
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
    const session = await getServerSession(authOptions as any);
    
    if (!session?.user) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }), 
        { 
          status: 401,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    
    return { user: session.user };
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