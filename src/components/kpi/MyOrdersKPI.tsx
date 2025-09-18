"use client";

import useSWR from "swr";
import { Card, CardContent } from '@/components/ui/card';
import { ShoppingCart } from 'lucide-react';
import { fetchJson } from "@/lib/fetcher";

interface MyOrdersKPIProps {
  userId?: string;
}

export default function MyOrdersKPI({ userId }: MyOrdersKPIProps) {
  const { data, isLoading } = useSWR("/api/my-orders", fetchJson);
  const count = data?.orders?.length ?? 0;

  if (isLoading) {
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
            <p className="text-2xl font-bold text-gray-900">{count}</p>
          </div>
          <ShoppingCart className="h-8 w-8 text-blue-600" />
        </div>
      </CardContent>
    </Card>
  );
}