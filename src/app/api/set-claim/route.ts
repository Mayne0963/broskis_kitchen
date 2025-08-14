import { NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initAdmin } from '@/lib/firebaseAdmin';

export async function POST(req: Request) {
  try {
    const { uid, role } = await req.json();
    
    if (!uid || !role) {
      return NextResponse.json(
        { ok: false, error: 'uid/role required' },
        { status: 400 }
      );
    }
    
    initAdmin();
    await getAuth().setCustomUserClaims(uid, { role });
    
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: String(e?.message || e) },
      { status: 500 }
    );
  }
}