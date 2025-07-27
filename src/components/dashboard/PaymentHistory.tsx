"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { Download } from 'lucide-react';
import { toast } from 'sonner';

type Payment = { id: string; date: string; amount: number; method: string; status: string };

export function PaymentHistory({ history }: { history: Payment[] }) {
  const [visibleItems, setVisibleItems] = useState(5);
  const [loading, setLoading] = useState(false);
  
  const loadMore = () => setVisibleItems((prev) => prev + 5);

  const downloadReceipt = async (paymentId: string) => {
    setLoading(true);
    try {
      // In a real implementation, this would download a receipt
      toast.info(`Receipt download for payment ${paymentId} coming soon`);
    } catch (error) {
      console.error('Error downloading receipt:', error);
      toast.error('Failed to download receipt');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusColors = {
      'completed': 'bg-gold-foil',
    'pending': 'bg-harvest-gold',
    'failed': 'bg-gold-foil',
    'refunded': 'bg-harvest-gold'
    };
    return (
      <Badge className={`${statusColors[status as keyof typeof statusColors] || 'bg-gray-500'} text-white`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  return (
    <Card className="bg-[#1A1A1A] shadow-md rounded-lg border border-[var(--color-harvest-gold)]">
      <CardHeader>
        <CardTitle className="text-[var(--color-harvest-gold)]">Payment History</CardTitle>
      </CardHeader>
      <CardContent>
        {history.length === 0 ? (
          <p className="text-gray-400 text-center py-4">No payment history found</p>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-[var(--color-harvest-gold)]">Date</TableHead>
                  <TableHead className="text-[var(--color-harvest-gold)]">Amount</TableHead>
                  <TableHead className="text-[var(--color-harvest-gold)]">Method</TableHead>
                  <TableHead className="text-[var(--color-harvest-gold)]">Status</TableHead>
                  <TableHead className="text-[var(--color-harvest-gold)]">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {history.slice(0, visibleItems).map((pay) => (
                  <TableRow key={pay.id} className="border-b border-gray-700">
                    <TableCell className="text-white">{pay.date}</TableCell>
                    <TableCell className="text-white font-semibold">${pay.amount.toFixed(2)}</TableCell>
                    <TableCell className="text-gray-300">{pay.method}</TableCell>
                    <TableCell>{getStatusBadge(pay.status)}</TableCell>
                    <TableCell>
                      <Button
                        onClick={() => downloadReceipt(pay.id)}
                        variant="ghost"
                        size="sm"
                        disabled={loading}
                        className="text-[var(--color-harvest-gold)] hover:bg-[var(--color-harvest-gold)]/10"
                        aria-label={`Download receipt for payment ${pay.id}`}
                      >
                        <Download className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {visibleItems < history.length && (
              <Button 
                onClick={loadMore} 
                className="mt-4 bg-[var(--color-harvest-gold)] text-black" 
                disabled={loading}
                aria-label="Load more payments"
              >
                Load More
              </Button>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}