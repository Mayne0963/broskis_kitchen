import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { redirect } from "next/navigation";
import AdminCateringClient from "./AdminCateringClient";

export default async function CateringAdminPage() {
  const session = await getServerSession(authOptions as any);
  const role = (session?.user as any)?.role;
  const isAdmin = role === "admin" || (session as any)?.user?.firebaseClaims?.admin === true;

  if (!isAdmin) {
    redirect("/auth/login?error=admin_required&next=/admin/catering");
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-6 text-[var(--color-harvest-gold)]">Catering Admin</h1>
      <AdminCateringClient />
    </div>
  );
}
