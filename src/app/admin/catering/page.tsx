import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import CateringDashboardClient from "./shell";

export default async function AdminCateringPage({
  searchParams,
}: {
  searchParams: { id?: string; status?: string; q?: string };
}) {
  const session = await getServerSession(authOptions);
  const role = (session?.user as any)?.role?.toLowerCase?.() ?? "user";
  if (!session?.user) redirect("/login?reason=unauthenticated");
  if (role !== "admin") redirect("/not-authorized");

  return (
    <div className="admin-surface mx-auto max-w-6xl p-4 md:p-6 space-y-4">
      <div className="rounded-xl border px-5 py-4 bk-gradient" style={{ borderColor: "var(--bk-border)" }}>
        <h1 className="text-3xl font-bold text-white">Admin Catering</h1>
        <p className="text-sm" style={{ color: "var(--bk-text-dim)" }}>
          Welcome, {session.user?.name}. This page is protected server-side with normalized role checking.
        </p>
      </div>
      <CateringDashboardClient
        initialStatus={searchParams.status ?? "all"}
        initialQ={searchParams.q ?? ""}
        initialId={searchParams.id}
      />
    </div>
  );
}