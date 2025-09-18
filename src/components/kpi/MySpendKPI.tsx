"use client";

import useSWR from "swr";
import { Card, CardContent } from '@/components/ui/card';
import { DollarSign } from 'lucide-react';
import { fetchJson } from "@/lib/fetcher";

interface MySpendKPIProps {
  userId?: string;
}

export default function MySpendKPI({ userId }: MySpendKPIProps) {
  const { data, error, isLoading } = useSWR("/api/my-orders", fetchJson);
  const cents = (data?.orders || []).reduce((a: number, o: any) => a + (o.totalCents || 0), 0);
  const formatted = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(cents / 100);

  if (isLoading) {
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

  // Handle 401 or other errors
  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">My Spending</p>
              <p className="text-2xl font-bold text-gray-900">$0.00</p>
              <p className="text-xs text-gray-500">Sign in to see your data</p>
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
            <p className="text-2xl font-bold text-gray-900">{formatted}</p>
          </div>
          <DollarSign className="h-8 w-8 text-green-600" />
        </div>
      </CardContent>
    </Card>
  );
}