export const dynamic = "force-dynamic";
export const runtime = "edge";

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

// Concurrency guard: coalesce overlapping refresh requests
const inFlightRequests = new Map<string, Promise<Response>>();

// Helper to decode JWT payload (base64url decode)
function decodeJWTPayload(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    // Base64url decode
    const payload = parts[1];
    const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const t0 = Date.now();
  const checkpoints: Record<string, number> = {};
  
  try {
    const cookieStore = cookies();
    const sessionCookie = cookieStore.get("bk_session");
    checkpoints.parseCookies = Date.now() - t0;
    
    if (!sessionCookie || !sessionCookie.value) {
      checkpoints.fastPath = Date.now() - t0;
      console.log(`[refresh] ms=${Date.now() - t0}, detail=${JSON.stringify(checkpoints)} (no session)`);
      return new Response(null, {
        status: 401,
        headers: { 
          "Cache-Control": "no-store, no-cache, must-revalidate",
          "Vary": "Cookie"
        }
      });
    }
    
    // FAST-PATH: Check if session has >10 minutes remaining
    const sessionId = sessionCookie.value.split('_')[1] || 'anon';
    
    // Check for existing in-flight request
    const existingRequest = inFlightRequests.get(sessionId);
    if (existingRequest) {
      checkpoints.coalesced = Date.now() - t0;
      console.log(`[refresh] ms=${Date.now() - t0}, detail=${JSON.stringify(checkpoints)} (coalesced)`);
      return existingRequest;
    }
    
    // Create the refresh promise
    const refreshPromise = (async () => {
      try {
        // Try to decode JWT or check freshness
        const payload = decodeJWTPayload(sessionCookie.value);
        if (payload && payload.exp) {
          const timeRemaining = payload.exp * 1000 - Date.now();
          if (timeRemaining > 10 * 60 * 1000) { // >10 minutes
            checkpoints.fastPath = Date.now() - t0;
            console.log(`[refresh] ms=${Date.now() - t0}, detail=${JSON.stringify(checkpoints)} (fast-path)`);
            return new Response(null, {
              status: 204,
              headers: {
                "Cache-Control": "no-store, no-cache, must-revalidate",
                "Vary": "Cookie"
              }
            });
          }
        }
        
        // Validate session token (simplified for demo)
        const isValidSession = sessionCookie.value.length > 10;
        checkpoints.validation = Date.now() - t0;
        
        if (!isValidSession) {
          console.log(`[refresh] ms=${Date.now() - t0}, detail=${JSON.stringify(checkpoints)} (invalid session)`);
          return new Response(JSON.stringify({ ok: false }), {
            status: 401,
            headers: {
              "Cache-Control": "no-store, no-cache, must-revalidate",
              "Vary": "Cookie",
              "Content-Type": "application/json"
            }
          });
        }
    
        // Generate new session token (simplified)
        const refreshStart = Date.now();
        const newSessionToken = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        checkpoints.refreshCall = Date.now() - refreshStart;
        
        const setCookieStart = Date.now();
        const maxAge = 60 * 60 * 24 * 7; // 7 days
        const cookieValue = `bk_session=${newSessionToken}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}`;
        checkpoints.setCookie = Date.now() - setCookieStart;
        
        const totalMs = Date.now() - t0;
        console.log(`[refresh] ms=${totalMs}, detail=${JSON.stringify(checkpoints)} (success)`);
        
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate",
            "Vary": "Cookie",
            "Content-Type": "application/json",
            "Set-Cookie": cookieValue
          }
        });
      } finally {
        inFlightRequests.delete(sessionId);
      }
    })();
    
    // Store the promise for coalescing
    inFlightRequests.set(sessionId, refreshPromise);
    return refreshPromise;
  } catch (error) {
    const totalMs = Date.now() - t0;
    console.log(`[refresh] ms=${totalMs}, detail=${JSON.stringify(checkpoints)} (error)`);
    return new Response(JSON.stringify({ ok: false }), {
      status: 401,
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate",
        "Vary": "Cookie",
        "Content-Type": "application/json"
      }
    });
  }
}

export async function OPTIONS() {
  return new Response(null, { 
    status: 204, 
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate",
      "Vary": "Cookie"
    }
  });
}