"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingCart } from 'lucide-react';

interface MyOrdersKPIProps {
  userId?: string;
}

export default function MyOrdersKPI({ userId }: MyOrdersKPIProps) {
  const [orderCount, setOrderCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserOrders = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        // TODO: Replace with actual API call to fetch user's orders
        // const response = await fetch(`/api/user/orders?userId=${userId}`);
        // const data = await response.json();
        // setOrderCount(data.count);
        
        // Mock data for now - only user's orders
        setOrderCount(3);
      } catch (error) {
        console.error('Error fetching user orders:', error);
        setOrderCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchUserOrders();
  }, [userId]);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">My Orders</p>
              <div className="w-16 h-6 bg-gray-200 animate-pulse rounded"></div>
            </div>
            <ShoppingCart className="h-8 w-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">My Orders</p>
            <p className="text-2xl font-bold text-gray-900">{orderCount}</p>
          </div>
          <ShoppingCart className="h-8 w-8 text-blue-600" />
        </div>
      </CardContent>
    </Card>
  );
}