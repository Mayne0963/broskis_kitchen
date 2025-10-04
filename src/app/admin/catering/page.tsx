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
    <div className="mx-auto max-w-6xl p-4 md:p-6 space-y-4">
      <div>
        <h1 className="text-3xl font-bold">Admin Catering</h1>
        <p className="text-sm text-white/60">
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