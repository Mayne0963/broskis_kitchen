export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, ensureAdmin } from '@/lib/firebase/admin';
import { UserRole } from '@/lib/auth/rbac';
import { z } from 'zod';



// POST - Set user role
export async function POST(request: NextRequest) {
  try {
    await ensureAdmin(request);
    const BodySchema = z.object({ uid: z.string().min(1), role: z.enum(['admin','customer','user']).transform(r => (r === 'user' ? 'customer' : r)) });
    const parsed = BodySchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid body', issues: parsed.error.issues },
        { status: 400 }
      );
    }
    const { uid, role } = parsed.data;
    
    if (!uid || !role) {
      return NextResponse.json(
        { success: false, error: 'uid and role are required' },
        { status: 400 }
      );
    }
    
    // Set custom claims: standardize on { role, admin }
    await adminAuth.setCustomUserClaims(uid, { role, admin: role === 'admin' });
    
    return NextResponse.json({ success: true });
  } catch (error) {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    console.error('Error setting user role:', { error, requestId });
    return NextResponse.json(
      { success: false, error: 'Failed to set user role', requestId },
      { status: 500 }
    );
  }
}

// GET - Get user role or list all users with roles
export async function GET(request: NextRequest) {
  try {
    await ensureAdmin(request);
    const { searchParams } = new URL(request.url);
    const QuerySchema = z.object({
      uid: z.string().optional(),
      action: z.enum(['list']).optional(),
      maxResults: z.string().transform(v => parseInt(v)).optional(),
    });
    const q = QuerySchema.parse({
      uid: searchParams.get('uid') || undefined,
      action: searchParams.get('action') || undefined,
      maxResults: searchParams.get('maxResults') || undefined,
    });
    const uid = q.uid;
    const action = q.action;
    const maxResults = q.maxResults ?? 1000;
    
    if (action === 'list') {
      // Get all users with their roles
      const listUsersResult = await adminAuth.listUsers(maxResults);
      
      const users = listUsersResult.users.map(userRecord => ({
        uid: userRecord.uid,
        email: userRecord.email || '',
        role: (userRecord.customClaims?.role as UserRole) || 'customer',
        emailVerified: userRecord.emailVerified
      }));
      
      return NextResponse.json({ success: true, users });
    } else if (uid) {
      // Get specific user's role
      const userRecord = await adminAuth.getUser(uid);
      const role = userRecord.customClaims?.role as UserRole || 'customer';
      
      return NextResponse.json({ success: true, role });
    } else {
      return NextResponse.json(
        { success: false, error: 'uid parameter or action=list is required' },
        { status: 400 }
      );
    }
  } catch (error) {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    console.error('Error getting user role/users:', { error, requestId });
    return NextResponse.json(
      { success: false, error: 'Failed to get user role/users', requestId },
      { status: 500 }
    );
  }
}

// PUT - Bulk role assignment
export async function PUT(request: NextRequest) {
  try {
    await ensureAdmin(request);
    const AssignmentSchema = z.object({ uid: z.string().min(1), role: z.enum(['admin','customer','user']).transform(r => (r === 'user' ? 'customer' : r)) });
    const BodySchema = z.object({ assignments: z.array(AssignmentSchema) });
    const parsed = BodySchema.safeParse(await request.json());
    
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: 'Invalid body', issues: parsed.error.issues },
        { status: 400 }
      );
    }
    const { assignments } = parsed.data;
    
    const results = await Promise.all(
      assignments.map(async ({ uid, role }: { uid: string; role: UserRole }) => {
        try {
          // Standardize claims to include both role and admin boolean
          await adminAuth.setCustomUserClaims(uid, { role, admin: role === 'admin' });
          return { uid, success: true };
        } catch (error) {
          console.error(`Error setting role for user ${uid}:`, error);
          return { uid, success: false, error: 'Failed to set user role' };
        }
      })
    );
    
    const allSuccessful = results.every(result => result.success);
    
    return NextResponse.json({
      success: allSuccessful,
      results
    });
  } catch (error) {
    const requestId = `req_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    console.error('Error in bulk role assignment:', { error, requestId });
    return NextResponse.json(
      { success: false, error: 'Failed to process bulk role assignment', requestId },
      { status: 500 }
    );
  }
}