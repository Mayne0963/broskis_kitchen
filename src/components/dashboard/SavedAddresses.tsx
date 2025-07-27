"use client";

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { toast } from 'sonner';

type Address = { id: string; label: string; street: string; city: string; state: string; zip: string };

export function SavedAddresses({ addresses }: { addresses: Address[] }) {
  const [savedAddresses, setSavedAddresses] = useState(addresses);
  const [loading, setLoading] = useState(false);

  const deleteAddress = async (id: string) => {
    setLoading(true);
    try {
      const response = await fetch('/api/user/addresses', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      });
      
      if (response.ok) {
        setSavedAddresses(savedAddresses.filter((a) => a.id !== id));
        toast.success('Address deleted successfully');
      } else {
        const error = await response.json();
        toast.error(error.error || 'Failed to delete address');
      }
    } catch (error) {
      console.error('Error deleting address:', error);
      toast.error('Failed to delete address');
    } finally {
      setLoading(false);
    }
  };

  const editAddress = (id: string) => {
    // For now, show a placeholder message
    toast.info('Address editing coming soon');
  };

  const addNewAddress = () => {
    toast.info('Add new address functionality coming soon');
  };

  return (
    <Card className="bg-[#1A1A1A] shadow-md rounded-lg border border-[var(--color-harvest-gold)]">
      <CardHeader>
        <CardTitle className="text-[var(--color-harvest-gold)]">Saved Addresses</CardTitle>
      </CardHeader>
      <CardContent>
        {savedAddresses.length === 0 ? (
          <p className="text-gray-400 text-center py-4">No addresses saved</p>
        ) : (
          savedAddresses.map((addr) => (
            <div key={addr.id} className="mb-4">
              <p className="font-semibold">{addr.label}</p>
              <p>{`${addr.street}, ${addr.city}, ${addr.state} ${addr.zip}`}</p>
              <div className="flex gap-2 mt-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => editAddress(addr.id)} 
                  disabled={loading}
                  aria-label={`Edit ${addr.label} address`}
                >
                  Edit
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm" 
                  onClick={() => deleteAddress(addr.id)} 
                  disabled={loading}
                  aria-label={`Delete ${addr.label} address`}
                >
                  {loading ? 'Deleting...' : 'Delete'}
                </Button>
              </div>
            </div>
          ))
        )}
        <Button 
          onClick={addNewAddress} 
          className="bg-[var(--color-harvest-gold)] text-black mt-4" 
          disabled={loading}
          aria-label="Add new address"
        >
          Add New Address
        </Button>
      </CardContent>
    </Card>
  );
}