import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (process.env.ALLOW_TEST_ROUTES !== 'true') {
      return NextResponse.json({ error: 'Test routes disabled' }, { status: 403 });
    }
    const snap = await db.collection('menuDrops').orderBy('createdAt', 'desc').limit(20).get();
    const items = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    return NextResponse.json(items);
  } catch (error: any) {
    return NextResponse.json({ error: error.message || String(error) }, { status: 500 });
  }
}
