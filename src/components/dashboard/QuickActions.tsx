"use client";

import Link from "next/link";
import { Card, CardContent } from '@/components/ui/card';
import { User, BarChart3, Shield } from 'lucide-react';
import { isAdmin } from '@/lib/rbac';

interface QuickActionsProps {
  role?: string;
}

export default function QuickActions({ role }: QuickActionsProps) {
  const admin = isAdmin(role);

  return (
    <div>
      <h2 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Link href="/account/profile">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <User className="h-5 w-5 text-blue-600" />
                <span className="font-medium">View Profile</span>
              </div>
            </CardContent>
          </Card>
        </Link>
        
        <Link href="/account/orders">
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <BarChart3 className="h-5 w-5 text-green-600" />
                <span className="font-medium">View Orders</span>
              </div>
            </CardContent>
          </Card>
        </Link>

        {admin && (
          <Link href="/admin">
            <Card className="hover:shadow-md transition-shadow cursor-pointer">
              <CardContent className="p-4">
                <div className="flex items-center space-x-3">
                  <Shield className="h-5 w-5 text-red-600" />
                  <span className="font-medium">Admin Panel</span>
                </div>
              </CardContent>
            </Card>
          </Link>
        )}
      </div>
    </div>
  );
}