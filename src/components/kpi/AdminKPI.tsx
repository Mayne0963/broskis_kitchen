"use client";

import useSWR from 'swr';
import { Card, CardContent } from '@/components/ui/card';
import { BarChart3, DollarSign, Users } from 'lucide-react';

const fetcher = (url: string) => fetch(url, { credentials: 'include' }).then(r => r.json());

export default function AdminKPI() {
  const { data, error, isLoading } = useSWR('/api/orders?kpi=1', fetcher);
  
  const kpi = data?.kpi ?? { totalOrders: 0, revenueCents: 0, activeUsers: 0 };
  const revenue = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format((kpi.revenueCents || 0) / 100);

  if (error) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <p>Error loading admin metrics</p>
              <p className="text-sm">{error.message || 'Access denied'}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard label="Total Orders" value="Loading..." icon={BarChart3} />
        <KpiCard label="Revenue" value="Loading..." icon={DollarSign} />
        <KpiCard label="Active Users" value="Loading..." icon={Users} />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <KpiCard label="Total Orders" value={kpi.totalOrders ?? 0} icon={BarChart3} />
      <KpiCard label="Revenue" value={revenue} icon={DollarSign} />
      <KpiCard label="Active Users" value={kpi.activeUsers ?? 0} icon={Users} />
    </div>
  );
}

interface KpiCardProps {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
}

function KpiCard({ label, value, icon: Icon }: KpiCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600">{label}</p>
            <p className="text-2xl font-bold text-gray-900">{value}</p>
          </div>
          <Icon className="h-8 w-8 text-blue-600" />
        </div>
      </CardContent>
    </Card>
  );
}