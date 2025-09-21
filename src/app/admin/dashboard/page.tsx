export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import OrdersManager from '@/components/admin/OrdersManager';

export default async function AdminDashboardPage() {
  // Authentication is handled by middleware
  return (
    <main className="mx-auto max-w-7xl px-4 pb-20 pt-10 space-y-10">
      <header className="space-y-1">
        <h1 className="text-2xl font-bold text-zinc-100">Admin Dashboard</h1>
        <p className="text-sm text-zinc-400">Track live orders and order history.</p>
      </header>
      <OrdersManager />
    </main>
  );
}