'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import OrdersTable, { AdminOrder } from './OrdersTable';
import OrdersKanban from '@/components/admin/OrdersKanban';

const STAGES = [
  { key: 'active', label: 'Active' },
  { key: 'pending', label: 'Pending' },
  { key: 'paid', label: 'Paid' },
  { key: 'preparing', label: 'Preparing' },
  { key: 'ready', label: 'Ready' },
  { key: 'out_for_delivery', label: 'Out for Delivery' },
  { key: 'completed', label: 'Completed' },
  { key: 'cancelled', label: 'Cancelled' },
  { key: 'all', label: 'All' },
] as const;

function isActiveStatus(s: string) {
  return ['pending','preparing','ready','out_for_delivery'].includes((s||'').toLowerCase());
}

export default function OrdersManager() {
  const [view, setView] = useState<'list'|'kanban'>('list');
  const [stage, setStage] = useState<(typeof STAGES)[number]['key']>('active');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [total, setTotal] = useState(0);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const statusParam = stage === 'active' ? 'all' : stage;
      const url = new URL('/api/admin/orders', window.location.origin);
      url.searchParams.set('status', statusParam);
      url.searchParams.set('page', String(page));
      url.searchParams.set('pageSize', '25');
      if (q.trim()) url.searchParams.set('q', q.trim());
      const res = await fetch(url.toString(), { cache: 'no-store' });
      const json = await res.json();
      if (!json?.ok) throw new Error(json?.error || 'Failed to load');
      let data: AdminOrder[] = json.orders ?? [];
      if (stage === 'active') data = data.filter(o => isActiveStatus(o.status));
      setOrders(data);
      setTotal(json.total ?? data.length);
    } catch (e) {
      console.error(e);
      setOrders([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [stage, page, q]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const header = useMemo(() =>
    `${STAGES.find(s => s.key === stage)?.label || 'Orders'} (${total})`,
  [stage, total]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        {STAGES.map(s => (
          <button
            key={s.key}
            onClick={() => { setStage(s.key); setPage(1); }}
            className={[
              'rounded-full px-3 py-1 text-sm ring-1 transition',
              stage === s.key
                ? 'bg-yellow-500 text-black ring-yellow-400'
                : 'bg-zinc-900/40 text-zinc-300 hover:text-white ring-white/10'
            ].join(' ')}
          >
            {s.label}
          </button>
        ))}
        <div className="ms-auto flex items-center gap-2">
          <input
            value={q}
            onChange={e => setQ(e.target.value)}
            placeholder="Search ID, email, name..."
            className="w-64 rounded-lg bg-zinc-900/50 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-500 ring-1 ring-white/10 focus:outline-none focus:ring-yellow-500"
          />
          <button
            onClick={() => { setPage(1); fetchData(); }}
            className="rounded-lg bg-yellow-500 px-3 py-2 text-sm font-medium text-black hover:bg-yellow-400"
          >
            Apply
          </button>
          <button
            onClick={() => setView(v => v === 'list' ? 'kanban' : 'list')}
            className="rounded-lg bg-zinc-900/50 px-3 py-2 text-sm text-zinc-200 ring-1 ring-white/10"
          >
            {view === 'list' ? 'Kanban View' : 'List View'}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-zinc-100">{header}</h3>
        {loading && <span className="text-xs text-zinc-400">Loading…</span>}
      </div>

      {view === 'list' ? <OrdersTable orders={orders}/> : <OrdersKanban orders={orders} onMoved={() => {}} />}

      <div className="flex items-center justify-end gap-2">
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          className="rounded-md bg-zinc-900/50 px-3 py-2 text-sm text-zinc-200 ring-1 ring-white/10 disabled:opacity-40"
        >
          Prev
        </button>
        <span className="text-sm text-zinc-400">Page {page}</span>
        <button
          onClick={() => setPage(p => p + 1)}
          className="rounded-md bg-zinc-900/50 px-3 py-2 text-sm text-zinc-200 ring-1 ring-white/10"
        >
          Next
        </button>
      </div>
    </div>
  );
}