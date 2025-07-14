"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

type Address = { id: string; label: string; street: string; city: string; state: string; zip: string };

export function SavedAddresses({ addresses }: { addresses: Address[] }) {
  const [savedAddresses, setSavedAddresses] = useState(addresses);

  const deleteAddress = (id: string) => {
    // TODO: Call API to delete address (e.g., fetch('/api/user/addresses', { method: 'DELETE', body: JSON.stringify({ id }) }))
    setSavedAddresses(savedAddresses.filter((a) => a.id !== id));
  };

  const editAddress = (id: string) => {
    // TODO: Open edit modal or form
    alert(`Edit address ${id}`);
  };

  return (
    <Card className="bg-[#1A1A1A] shadow-md rounded-lg border border-[var(--color-harvest-gold)]">
      <CardHeader>
        <CardTitle className="text-[var(--color-harvest-gold)]">Saved Addresses</CardTitle>
      </CardHeader>
      <CardContent>
        {savedAddresses.map((addr) => (
          <div key={addr.id} className="mb-4">
            <p className="font-semibold">{addr.label}</p>
            <p>{`${addr.street}, ${addr.city}, ${addr.state} ${addr.zip}`}</p>
            <div className="flex gap-2 mt-2">
              <Button variant="outline" size="sm" onClick={() => editAddress(addr.id)} aria-label={`Edit ${addr.label} address`}>Edit</Button>
              <Button variant="destructive" size="sm" onClick={() => deleteAddress(addr.id)} aria-label={`Delete ${addr.label} address`}>Delete</Button>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}