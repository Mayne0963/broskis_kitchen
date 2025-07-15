"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

type Order = { id: string; date: string; items: string; total: number };

export function OrderHistory({ orders }: { orders: Order[] }) {
  const reorder = (id: string) => {
    // TODO: Call API to reorder (e.g., fetch('/api/user/orders/reorder', { method: 'POST', body: JSON.stringify({ id }) }))
    alert(`Reordering ${id}`);
  };

  return (
    <Card className="bg-[#1A1A1A] shadow-md rounded-lg border border-[var(--color-harvest-gold)]">
      <CardHeader>
        <CardTitle className="text-[var(--color-harvest-gold)]">Order History</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        {orders.map((order) => (
          <div key={order.id} className="border-b pb-4">
            <p className="font-semibold">Order #{order.id} - {order.date}</p>
            <p>Items: {order.items}</p>
            <p>Total: ${order.total.toFixed(2)}</p>
            <Button onClick={() => reorder(order.id)} className="mt-2 bg-[var(--color-harvest-gold)] text-black" aria-label={`Reorder ${order.id}`}>Reorder</Button>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}