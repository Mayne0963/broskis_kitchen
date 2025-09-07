"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { toast } from 'sonner';

type PaymentMethod = { id: string; type: string; last4: string; expiry: string };

export function PaymentMethods({ methods }: { methods: PaymentMethod[] }) {
  const [paymentMethods, setPaymentMethods] = useState(methods);
  const [loading, setLoading] = useState(false);

  const removeMethod = async (id: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/user/payment-methods', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethodId: id })
      });
      
      if (response.ok) {
        setPaymentMethods(paymentMethods.filter((m) => m.id !== id));
        toast.success('Payment method removed successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to remove payment method');
      }
    } catch (error) {
      console.error('Error removing payment method:', error);
      toast.error('Failed to remove payment method');
    } finally {
      setLoading(false);
    }
  };

  const addNew = () => {
    // Redirect to Stripe setup or payment method addition flow
    toast.info('Payment method addition coming soon');
  };

  return (
    <Card className="bg-[#1A1A1A] shadow-md rounded-lg border border-[var(--color-harvest-gold)]">
      <CardHeader>
        <CardTitle className="text-[var(--color-harvest-gold)]">Saved Payment Methods</CardTitle>
      </CardHeader>
      <CardContent>
        {paymentMethods.length === 0 ? (
          <p className="text-gray-400 text-center py-4">No payment methods saved</p>
        ) : (
          paymentMethods.map((method) => (
            <div key={method.id} className="flex justify-between items-center mb-4">
              <span>{`${method.type} ****${method.last4} (Exp: ${method.expiry})`}</span>
              <Button 
                variant="destructive" 
                size="sm" 
                onClick={() => removeMethod(method.id)} 
                disabled={loading}
                aria-label={`Remove ${method.type} ending in ${method.last4}`}
              >
                {loading ? 'Removing...' : 'Remove'}
              </Button>
            </div>
          ))
        )}
        <Button 
          onClick={addNew} 
          className="bg-[var(--color-harvest-gold)] text-black" 
          aria-label="Add new payment method"
          disabled={loading}
        >
          Add New
        </Button>
      </CardContent>
    </Card>
  );
}