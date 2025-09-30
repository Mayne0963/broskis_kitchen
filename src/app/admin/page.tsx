export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import AdminDashboardClient from "./AdminDashboardClient";

/**
 * Server-side admin dashboard with zero extra fetches
 * Uses NextAuth session with role computed in JWT
 */
export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  
  // Redirect to sign in if not authenticated
  if (!session?.user) {
    redirect("/api/auth/signin?callbackUrl=/admin");
  }
  
  // Check admin role from NextAuth session (computed in JWT)
  const userRole = (session.user as any).role;
  if (userRole !== "admin") {
    redirect("/unauthorized");
  }
  
  return (
    <AdminDashboardClient 
      adminEmail={session.user.email || ""} 
      adminName={session.user.name || ""} 
    />
  );
}