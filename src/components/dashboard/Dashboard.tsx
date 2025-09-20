"use client";

import { isAdmin } from '@/lib/rbac';
import AdminKPI from '@/components/kpi/AdminKPI';
import QuickActions from '@/components/dashboard/QuickActions';

type Props = { 
  session?: any; 
  userId?: string; 
  role?: string; 
};

export default function Dashboard({ session, userId, role }: Props) {
  const admin = isAdmin(role ?? session?.user?.role);
  const currentUserId = userId ?? session?.user?.id ?? session?.user?.uid;
  const currentRole = role ?? session?.user?.role ?? 'customer';

  return (
    <div className="p-6 space-y-6">
      {/* Admin KPIs — HIDE for customers */}
      {admin && (
        <section aria-label="admin-kpis" className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <AdminKPI />
        </section>
      )}
      
      {/* Customer KPIs now handled server-side in dashboard page */}
      
      {/* Authentication Status panel REMOVED completely */}
      
      {/* Quick Actions */}
      <QuickActions role={currentRole} />
    </div>
  );
}