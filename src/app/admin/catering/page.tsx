import { redirect } from "next/navigation";
import { getSessionCookie } from "@/lib/auth/session";
import AdminCateringClient from "./AdminCateringClient";

export default async function CateringAdminPage() {
  const sessionUser = await getSessionCookie();
  
  if (!sessionUser) {
    redirect("/auth/login?error=admin_required&next=/admin/catering");
  }
  
  const isAdmin = sessionUser.role === "admin" || (sessionUser as any).admin === true;
  
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
export const dynamic = "force-dynamic";
export const revalidate = 0;
