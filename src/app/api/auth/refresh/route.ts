export const dynamic = "force-dynamic";
export const runtime = "nodejs";

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

// Helper function to decode JWT payload
function decodeJWTPayload(token: string) {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) {
      return null;
    }
    
    // Decode base64url payload with proper padding
    let base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    
    const payload = JSON.parse(atob(base64));
    return payload;
  } catch (error) {
    console.log('[decodeJWTPayload] Error decoding token:', error);
    return null;
  }
}

// Concurrency guard: coalesce overlapping refresh requests
const inFlightRequests = new Map<string, Promise<Response>>();

export async function POST(request: NextRequest) {
  const t0 = Date.now();
  const checkpoints: Record<string, number> = {};
  
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get("session");
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
        
        // Validate session token structure and content
        const tokenPayload = decodeJWTPayload(sessionCookie.value);
        checkpoints.validation = Date.now() - t0;
        
        if (!tokenPayload || !tokenPayload.uid || !tokenPayload.exp) {
          console.log(`[refresh] ms=${Date.now() - t0}, detail=${JSON.stringify(checkpoints)} (invalid session structure)`);
          return new Response(JSON.stringify({ ok: false }), {
            status: 401,
            headers: {
              "Cache-Control": "no-store, no-cache, must-revalidate",
              "Vary": "Cookie",
              "Content-Type": "application/json"
            }
          });
        }
        
        // Check if token is expired
        const now = Date.now();
        if (tokenPayload.exp * 1000 < now) {
          console.log(`[refresh] ms=${Date.now() - t0}, detail=${JSON.stringify(checkpoints)} (expired session)`);
          return new Response(JSON.stringify({ ok: false }), {
            status: 401,
            headers: {
              "Cache-Control": "no-store, no-cache, must-revalidate",
              "Vary": "Cookie",
              "Content-Type": "application/json"
            }
          });
        }
    
        // Generate new session token using existing payload data
        const refreshStart = Date.now();
        const newPayload = {
          uid: tokenPayload.uid,
          role: tokenPayload.role || 'customer',
          exp: Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7), // 7 days
          iat: Math.floor(Date.now() / 1000)
        };
        
        // Create a simple JWT-like token (for demo purposes)
        const header = btoa(JSON.stringify({
            alg: 'HS256',
            typ: 'JWT'
        }));
        const encodedPayload = btoa(JSON.stringify(newPayload)).replace(/=/g, '');
        const newSessionToken = `${header}.${encodedPayload}.signature`;
        checkpoints.refreshCall = Date.now() - refreshStart;
        
        const setCookieStart = Date.now();
        const maxAge = 60 * 60 * 24 * 7; // 7 days
        const cookieValue = `session=${newSessionToken}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=${maxAge}`;
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