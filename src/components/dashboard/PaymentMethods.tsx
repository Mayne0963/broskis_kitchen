"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

type PaymentMethod = { id: string; type: string; last4: string; expiry: string };

export function PaymentMethods({ methods }: { methods: PaymentMethod[] }) {
  const [paymentMethods, setPaymentMethods] = useState(methods);

  const removeMethod = (id: string) => {
    // TODO: Call API to remove payment method (e.g., fetch('/api/user/payment-methods', { method: 'DELETE', body: JSON.stringify({ id }) }))
    setPaymentMethods(paymentMethods.filter((m) => m.id !== id));
  };

  const addNew = () => {
    // TODO: Open modal or redirect to add payment method flow
    alert('Add new payment method functionality');
  };

  return (
    <Card className="bg-[#1A1A1A] shadow-md rounded-lg border border-[var(--color-harvest-gold)]">
      <CardHeader>
        <CardTitle className="text-[var(--color-harvest-gold)]">Saved Payment Methods</CardTitle>
      </CardHeader>
      <CardContent>
        {paymentMethods.map((method) => (
          <div key={method.id} className="flex justify-between items-center mb-4">
            <span>{`${method.type} ****${method.last4} (Exp: ${method.expiry})`}</span>
            <Button variant="destructive" size="sm" onClick={() => removeMethod(method.id)} aria-label={`Remove ${method.type} ending in ${method.last4}`}>Remove</Button>
          </div>
        ))}
        <Button onClick={addNew} className="bg-[var(--color-harvest-gold)] text-black" aria-label="Add new payment method">Add New</Button>
      </CardContent>
    </Card>
  );
}