"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

type Payment = { id: string; date: string; amount: number; method: string; status: string };

export function PaymentHistory({ history }: { history: Payment[] }) {
  const [visibleItems, setVisibleItems] = useState(5);
  const loadMore = () => setVisibleItems((prev) => prev + 5);

  // TODO: Fetch more data via API if needed (e.g., pagination with /api/user/payment-history?page=2)

  return (
    <Card className="bg-[#1A1A1A] shadow-md rounded-lg border border-[var(--color-harvest-gold)]">
      <CardHeader>
        <CardTitle className="text-[var(--color-harvest-gold)]">Payment History</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Method</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {history.slice(0, visibleItems).map((pay) => (
              <TableRow key={pay.id}>
                <TableCell>{pay.date}</TableCell>
                <TableCell>${pay.amount.toFixed(2)}</TableCell>
                <TableCell>{pay.method}</TableCell>
                <TableCell>{pay.status}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {visibleItems < history.length && (
          <Button onClick={loadMore} className="mt-4 bg-[var(--color-harvest-gold)] text-black" aria-label="Load more payments">Load More</Button>
        )}
      </CardContent>
    </Card>
  );
}