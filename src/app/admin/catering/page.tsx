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
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Admin Catering</h1>
      <p className="text-sm text-neutral-500">
        Welcome, {session.user?.name}. This page is protected server-side.
      </p>
      <CateringDashboardClient
        initialStatus={searchParams.status ?? "all"}
        initialQ={searchParams.q ?? ""}
        initialId={searchParams.id}
      />
    </div>
  );
}