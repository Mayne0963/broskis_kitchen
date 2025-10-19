import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth/options";
import CateringDashboardClient from "./shell";

export default async function AdminCateringPage({
  searchParams,
}: {
  searchParams: { id?: string; status?: string; q?: string };
}) {
  // Get session with proper error handling
  const session = await getServerSession(authOptions);
  
  // Strict authentication check
  if (!session?.user) {
    redirect("/api/auth/signin?callbackUrl=" + encodeURIComponent("/admin/catering"));
  }

  // Strict role validation with explicit admin check
  const userRole = (session.user as any)?.role;
  if (userRole !== "admin") {
    console.warn(`Unauthorized admin access attempt: ${session.user.email}, role: ${userRole}`);
    redirect("/unauthorized");
  }

  // Input sanitization with stricter validation
  const sanitizedParams = {
    status: searchParams.status?.match(/^(all|pending|approved|rejected|confirmed|quoted|canceled)$/) 
      ? searchParams.status : "all",
    q: searchParams.q?.slice(0, 50).replace(/[<>'"&]/g, '') || "", // Stricter XSS protection
    id: searchParams.id?.match(/^[a-zA-Z0-9_-]{1,50}$/) ? searchParams.id : undefined // Length limit
  };

  return (
    <div className="admin-surface mx-auto max-w-6xl p-4 md:p-6 space-y-4">
      <div className="rounded-xl border px-5 py-4 bk-gradient" style={{ borderColor: "var(--bk-border)" }}>
        <h1 className="text-3xl font-bold text-white">Admin Catering</h1>
        <p className="text-sm" style={{ color: "var(--bk-text-dim)" }}>
          Welcome, {session.user?.name}. Secure admin access verified.
        </p>
      </div>
      <CateringDashboardClient 
        initialStatus={sanitizedParams.status}
        initialQ={sanitizedParams.q}
        initialId={sanitizedParams.id}
      />
    </div>
  );
}