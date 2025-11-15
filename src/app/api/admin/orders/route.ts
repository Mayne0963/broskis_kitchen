export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const preferredRegion = ["iad1"]; // Co-locate near US East for admin traffic

// Ensure no caching for real-time order updates
export const fetchCache = 'force-no-store';

import { NextRequest, NextResponse } from 'next/server';
import { Timestamp } from 'firebase-admin/firestore';
import { adminDb, ensureAdmin } from '@/lib/firebase/admin';

type Stage =
  | 'all' | 'pending' | 'paid' | 'preparing' | 'ready' | 'out_for_delivery'
  | 'delivered' | 'completed' | 'cancelled';

function normalizeStage(s?: string): Stage {
  const v = (s ?? 'all').toLowerCase() as Stage;
  return ['all','pending','paid','preparing','ready','out_for_delivery','delivered','completed','cancelled'].includes(v)
    ? v : 'all';
}

export async function GET(req: NextRequest) {
  await ensureAdmin(req);
  try {
    const { searchParams } = new URL(req.url);
    const stage = normalizeStage(searchParams.get('status') || searchParams.get('stage') || undefined);
    const q = (searchParams.get('q') || '').trim().toLowerCase();
    const page = Math.max(1, Number(searchParams.get('page') || 1));
    const pageSize = Math.min(50, Math.max(5, Number(searchParams.get('pageSize') || 20)));
    const from = searchParams.get('from');
    const to = searchParams.get('to');

    let ref = adminDb.collection('orders').orderBy('createdAt', 'desc');
    if (stage !== 'all') ref = ref.where('status', '==', stage);
    if (from) ref = ref.where('createdAt', '>=', Timestamp.fromDate(new Date(from)));
    if (to) ref = ref.where('createdAt', '<=', Timestamp.fromDate(new Date(to)));

    const fetchCount = page * pageSize;
    const snap = await ref.limit(fetchCount).get();
    let docs = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }));

    if (q) {
      docs = docs.filter(o => {
        const hay = `${o.id} ${o.userId ?? ''} ${o.userName ?? ''} ${o.status ?? ''}`.toLowerCase();
        return hay.includes(q);
      });
    }

    const total = docs.length;
    const start = (page - 1) * pageSize;
    const items = docs.slice(start, start + pageSize);

    const orders = items.map((o) => ({
      id: o.id,
      createdAt: o.createdAt?.toDate?.() ?? new Date(o.createdAt),
      status: o.status ?? 'pending',
      userId: o.userId ?? '',
      userName: o.userName ?? '',
      totalCents: Number(o.totalCents ?? o.total_cents ?? o.total ?? 0),
      items: Array.isArray(o.items) ? o.items.map((it: any) => ({
        name: it.name ?? it.title ?? 'Item',
        qty: Number(it.qty ?? it.quantity ?? 1),
        priceCents: Number(it.priceCents ?? it.price_cents ?? Math.round((it.price ?? 0) * 100)),
        options: it.options ?? it.modifiers ?? [],
      })) : [],
      address: o.address ?? null,
    }));

    return NextResponse.json({ ok: true, page, pageSize, total, orders });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err?.message ?? 'Unknown error' }, { status: 500 });
  }
}