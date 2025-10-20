export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { requireRole } from "@/lib/auth/session";
import AdminDashboardClient from "./AdminDashboardClient";

/**
 * Server-side admin dashboard with enhanced authentication
 * Uses new authentication system with role-based access control
 */
export default async function AdminPage() {
  // Require admin role with email verification
  const user = await requireRole(["admin"]);
  
  return (
    <AdminDashboardClient 
      adminEmail={user.email || ""} 
      adminName={user.name || ""} 
    />
  );
}