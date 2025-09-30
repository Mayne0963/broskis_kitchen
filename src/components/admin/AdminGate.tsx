"use client";
import { useAuth } from "@/lib/context/AuthContext";
import { useRouter } from "next/navigation";

/**
 * Simplified AdminGate - purely for UI after server authorization
 * Server components should handle admin checks before rendering
 * This component only provides fallback UI for edge cases
 */
export default function AdminGate({ children }: { children: React.ReactNode }) {
  const { user, claims, isLoading } = useAuth();
  const router = useRouter();

  // Loading state
  if (isLoading) {
    return <div className="p-6 text-slate-200">Loading…</div>;
  }

  // Not authenticated - show sign in
  if (!user) {
    return (
      <div className="p-6 text-slate-200">
        <p>Admin access required.</p>
        <button 
          onClick={() => router.push("/login?redirect=/admin/catering")} 
          className="bg-yellow-500 px-4 py-2 rounded mt-2 text-black"
        >
          Sign in
        </button>
      </div>
    );
  }

  // Check role from Firebase claims
  const userRole = claims.role || user.role;
  if (userRole !== "admin") {
    return (
      <div className="p-6 text-red-400">
        Access denied. Admin privileges required.
      </div>
    );
  }

  // User is admin - render children
  return <>{children}</>;
}