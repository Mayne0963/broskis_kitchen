"use client";

import useSWR from "swr";
import { Card, CardContent } from '@/components/ui/card';
import { Star } from 'lucide-react';
import { fetchJson } from "@/lib/fetcher";

interface LoyaltyKPIProps {
  userId?: string;
}

export default function LoyaltyKPI({ userId }: LoyaltyKPIProps) {
  const { data, error, isLoading } = useSWR("/api/my-orders", fetchJson);
  const cents = (data?.orders || []).reduce((a: number, o: any) => a + (o.totalCents || 0), 0);
  const points = Math.floor(cents / 100); // 1pt per $1

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Loyalty Points</p>
              <div className="w-16 h-6 bg-gray-200 animate-pulse rounded"></div>
            </div>
            <Star className="h-8 w-8 text-yellow-600" />
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
              <p className="text-sm font-medium text-gray-600">Loyalty Points</p>
              <p className="text-2xl font-bold text-gray-900">0</p>
              <p className="text-xs text-gray-500">Sign in to see your data</p>
            </div>
            <Star className="h-8 w-8 text-yellow-600" />
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
            <p className="text-sm font-medium text-gray-600">Loyalty Points</p>
            <p className="text-2xl font-bold text-gray-900">{points.toLocaleString()}</p>
          </div>
          <Star className="h-8 w-8 text-yellow-600" />
        </div>
      </CardContent>
    </Card>
  );
}