// app/account/orders/page.tsx
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getServerUser } from "@/lib/authServer";
import { adminDb } from "@/lib/firebaseAdmin";

interface Order {
  id: string;
  userId: string;
  items: any[];
  totalCents: number;
  status?: string;
  createdAt: any;
}

export default async function OrdersPage() {
  const user = await getServerUser();
  
  if (!user) {
    return (
      <main className="p-6">
        <Card className="border-[#FFD700] bg-[#0b0b0b] text-white">
          <CardHeader>
            <CardTitle>My Orders</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Please sign in to see your orders.</p>
          </CardContent>
        </Card>
      </main>
    );
  }

  // Fetch orders from Firestore
  const ordersSnapshot = await adminDb
    .collection('orders')
    .where('userId', '==', user.uid)
    .orderBy('createdAt', 'desc')
    .limit(50)
    .get();

  const orders: Order[] = ordersSnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as Order[];

  // Calculate lifetime spend
  const lifetimeSpend = orders.reduce((total, order) => total + (order.totalCents || 0), 0);
  const lifetimeSpendFormatted = `$${(lifetimeSpend / 100).toFixed(2)}`;

  return (
    <main className="p-6">
      <Card className="border-[#FFD700] bg-[#0b0b0b] text-white">
        <CardHeader>
          <CardTitle>My Orders</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Lifetime Spend Block */}
          <div className="flex justify-between items-center">
            <span className="text-white/70">Lifetime Spend</span>
            <span className="text-xl font-semibold text-[#FFD700]">{lifetimeSpendFormatted}</span>
          </div>

          {/* Orders Table */}
          <div className="overflow-x-auto rounded-xl border border-white/10">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-white/70">Date</TableHead>
                  <TableHead className="text-white/70">Items</TableHead>
                  <TableHead className="text-white/70">Total</TableHead>
                  <TableHead className="text-white/70">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-white/60">
                      No orders yet.
                    </TableCell>
                  </TableRow>
                ) : (
                  orders.map((order) => {
                    const date = order.createdAt?.toDate ? 
                      order.createdAt.toDate().toISOString().split('T')[0] : 
                      new Date().toISOString().split('T')[0];
                    const itemsCount = order.items?.length || 0;
                    const totalFormatted = `$${((order.totalCents || 0) / 100).toFixed(2)}`;
                    const status = order.status || 'processing';

                    return (
                      <TableRow key={order.id} className="hover:bg-white/5">
                        <TableCell>{date}</TableCell>
                        <TableCell>{itemsCount}</TableCell>
                        <TableCell>{totalFormatted}</TableCell>
                        <TableCell>{status}</TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}