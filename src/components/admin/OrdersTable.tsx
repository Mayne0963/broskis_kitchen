'use client';
import { useMemo } from 'react';
import StatusPill from './StatusPill';

function usd(cents: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
    .format((cents ?? 0) / 100);
}

export type AdminOrder = {
  id: string;
  createdAt: string | Date;
  status: string;
  userId?: string;
  userName?: string;
  totalCents: number;
  items: { name: string; qty: number; priceCents: number; options?: any[]; id?: string }[];
};

export default function OrdersTable({ orders }: { orders: AdminOrder[] }) {
  const rows = useMemo(
    () => orders.map((o) => {
      const hasTestItem = (o.items || []).some(item => 
        item.id === 'test-item-5c' || item.name?.includes('Test Item')
      );
      const isProduction = process.env.NODE_ENV === 'production';
      const showTestWarning = hasTestItem && isProduction;
      
      return {
        ...o,
        when: new Date(o.createdAt),
        line: (o.items || []).map(it => `${it.qty}× ${it.name}`).join(', '),
        hasTestItem,
        showTestWarning
      };
    }),
    [orders]
  );

  return (
    <div className="overflow-hidden rounded-2xl ring-1 ring-white/10 bg-zinc-900/40">
      <table className="w-full text-sm">
        <thead className="bg-zinc-900/60 text-zinc-300">
          <tr>
            <th className="px-4 py-3 text-left">Order</th>
            <th className="px-4 py-3 text-left">When</th>
            <th className="px-4 py-3 text-left">Customer</th>
            <th className="px-4 py-3 text-left">Items</th>
            <th className="px-4 py-3 text-left">Total</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-left">Flags</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-white/5">
          {rows.map((o) => (
            <tr key={o.id} className={`hover:bg-zinc-900/60 ${o.showTestWarning ? 'bg-red-900/20' : ''}`}>
              <td className="px-4 py-3 font-mono text-zinc-200">#{o.id.slice(0, 8)}</td>
              <td className="px-4 py-3 text-zinc-300">{o.when.toLocaleString()}</td>
              <td className="px-4 py-3 text-zinc-300">{o.userName || o.userId || '—'}</td>
              <td className="px-4 py-3 text-zinc-200">{o.line || '—'}</td>
              <td className="px-4 py-3 font-medium">{usd(o.totalCents)}</td>
              <td className="px-4 py-3"><StatusPill status={o.status} /></td>
              <td className="px-4 py-3">
                {o.hasTestItem && (
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    o.showTestWarning 
                      ? 'bg-red-100 text-red-800 border border-red-200' 
                      : 'bg-yellow-100 text-yellow-800 border border-yellow-200'
                  }`}>
                    {o.showTestWarning ? '⚠️ TEST ORDER' : 'TEST'}
                  </span>
                )}
              </td>
            </tr>
          ))}
          {rows.length === 0 && (
            <tr><td colSpan={7} className="px-4 py-10 text-center text-zinc-400">No orders found.</td></tr>
          )}
        </tbody>
      </table>
    </div>
  );
}