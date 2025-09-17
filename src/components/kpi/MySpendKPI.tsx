"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';

interface MySpendKPIProps {
  userId?: string;
}

export default function MySpendKPI({ userId }: MySpendKPIProps) {
  const [totalSpent, setTotalSpent] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserSpending = async () => {
      if (!userId) {
        setLoading(false);
        return;
      }

      try {
        // TODO: Replace with actual API call to fetch user's spending
        // const response = await fetch(`/api/user/spending?userId=${userId}`);
        // const data = await response.json();
        // setTotalSpent(data.totalSpent);
        
        // Mock data for now - only user's spending
        setTotalSpent(127.50);
      } catch (error) {
        console.error('Error fetching user spending:', error);
        setTotalSpent(0);
      } finally {
        setLoading(false);
      }
    };

    fetchUserSpending();
  }, [userId]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">My Spending</p>
              <div className="w-20 h-6 bg-gray-200 animate-pulse rounded"></div>
            </div>
            <DollarSign className="h-8 w-8 text-green-600" />
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
            <p className="text-sm font-medium text-gray-600">My Spending</p>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalSpent)}</p>
          </div>
          <DollarSign className="h-8 w-8 text-green-600" />
        </div>
      </CardContent>
    </Card>
  );
}