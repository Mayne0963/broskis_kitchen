export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { redirect } from "next/navigation";
import { getServerUser } from "@/lib/authServer";
import AdminDashboardClient from "./AdminDashboardClient";

/**
 * Server-side admin dashboard with zero extra fetches
 * Uses Firebase session cookie with role from custom claims
 */
export default async function AdminPage() {
  const user = await getServerUser();
  
  // Redirect to sign in if not authenticated
  if (!user) {
    redirect("/auth/login?next=/admin");
  }
  
  // Check admin role from Firebase session
  if (user.role !== "admin") {
    redirect("/unauthorized");
  }
  
  return (
    <AdminDashboardClient 
      adminEmail={user.email || ""} 
      adminName={user.name || ""} 
    />
  );
}