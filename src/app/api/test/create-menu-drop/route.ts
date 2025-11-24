import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST() {
  try {
    if (process.env.ALLOW_TEST_ROUTES !== 'true') {
      return NextResponse.json({ error: 'Test routes disabled' }, { status: 403 });
    }

    const now = new Date();
    const startTime = new Date(now.getTime() + 5 * 60 * 1000);
    const endTime = new Date(now.getTime() + 65 * 60 * 1000);

    const docRef = await db.collection('menuDrops').add({
      name: 'Test Lunch Drop',
      description: 'Automated test drop',
      price: 9.99,
      totalQuantity: 50,
      soldQuantity: 0,
      availableQuantity: 50,
      status: 'scheduled',
      startTime,
      endTime,
      createdAt: now,
      updatedAt: now,
      createdBy: 'test-agent'
    });

    return NextResponse.json({ ok: true, id: docRef.id });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: error.message || String(error) }, { status: 500 });
  }
}
