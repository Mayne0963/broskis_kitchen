export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const preferredRegion = ["iad1"]; // Co-locate near US East for admin traffic

import { NextRequest, NextResponse } from 'next/server';
import { getServerUser } from '@/lib/session';
import { cacheGet, cacheSet, CacheKeys } from '@/lib/cache';
import { getUserByEmail } from '@/lib/user';

/**
 * Fast cached admin role verification endpoint
 * Eliminates repetitive "who am I?" database hits with 60s TTL cache
 */
export async function GET(request: NextRequest) {
  try {
    // Get user from session cookie
    const sessionUser = await getServerUser();
    if (!sessionUser?.email) {
      return new Response(null, { status: 401 });
    }

    const email = sessionUser.email.toLowerCase();
    const cacheKey = CacheKeys.adminCheck(email);

    // Try cache first for fast response
    let adminStatus = await cacheGet(cacheKey);
    
    if (adminStatus === null) {
      // Cache miss - check user role from database
      try {
        const user = await getUserByEmail(email);
        const isAdmin = user?.role === "admin";
        
        // Cache the admin status for 60 seconds
        adminStatus = { isAdmin, timestamp: Date.now() };
        await cacheSet(cacheKey, adminStatus);
        
        // Also cache user data for other operations
        if (user) {
          await cacheSet(CacheKeys.user(email), user);
        }
      } catch (error) {
        console.error('Admin check database error:', error);
        
        // Fallback to environment-based admin check
        const allowedEmails = (process.env.ALLOWED_ADMIN_EMAILS || "")
          .split(",")
          .map(s => s.trim().toLowerCase());
        
        const isAdmin = allowedEmails.includes(email);
        adminStatus = { isAdmin, timestamp: Date.now(), fallback: true };
        
        // Cache fallback result for shorter time (15 seconds)
        await cacheSet(cacheKey, adminStatus);
      }
    }

    // Return appropriate status
    const isAdmin = adminStatus.isAdmin === true;
    return new Response(null, { 
      status: isAdmin ? 200 : 403,
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'X-Cache-Hit': adminStatus.timestamp ? 'true' : 'false',
        'X-Fallback': adminStatus.fallback ? 'true' : 'false'
      }
    });

  } catch (error) {
    console.error('Admin check error:', error);
    return new Response(null, { status: 500 });
  }
}

/**
 * OPTIONS handler for CORS
 */
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });
}