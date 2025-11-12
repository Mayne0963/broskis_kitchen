"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

type Order = { id: string; date: string; items: string; total: number };

export function OrderHistory({ orders }: { orders: Order[] }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const reorder = async (id: string) => {
    setLoading(true);
    try {
      // For now, redirect to menu page with a message
      // In a real implementation, this would fetch the order details and add items to cart
      toast.success(`Redirecting to menu to reorder items from order ${id}`);
      router.push('/menu');
    } catch (error) {
      console.error('Error reordering:', error);
      toast.error('Failed to reorder');
    } finally {
      setLoading(false);
    }
  };

  const viewOrderDetails = (id: string) => {
    router.push(`/account/orders`);
  };

  return (
    <Card className="bg-[#1A1A1A] shadow-md rounded-lg border border-[var(--color-harvest-gold)]">
      <CardHeader>
        <CardTitle className="text-[var(--color-harvest-gold)]">Order History</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-4">
        {orders.length === 0 ? (
          <p className="text-gray-400 text-center py-4">No orders found</p>
        ) : (
          orders.map((order) => (
            <div key={order.id} className="border-b pb-4 last:border-b-0">
              <p className="font-semibold">Order #{order.id} - {order.date}</p>
              <p className="text-gray-300">Items: {order.items}</p>
              <p className="text-[var(--color-harvest-gold)] font-semibold">Total: ${order.total.toFixed(2)}</p>
              <div className="flex gap-2 mt-2">
                <Button 
                  onClick={() => viewOrderDetails(order.id)} 
                  variant="outline" 
                  size="sm"
                  disabled={loading}
                  aria-label={`View details for order ${order.id}`}
                >
                  View Details
                </Button>
                <Button 
                  onClick={() => reorder(order.id)} 
                  className="bg-[var(--color-harvest-gold)] text-black" 
                  size="sm"
                  disabled={loading}
                  aria-label={`Reorder ${order.id}`}
                >
                  {loading ? 'Processing...' : 'Reorder'}
                </Button>
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}
