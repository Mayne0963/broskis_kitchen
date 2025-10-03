export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";

export default async function AdminCateringPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/admin/signin?callbackUrl=%2Fadmin%2Fcatering");
  }
  
  // Check admin role more safely
  const userRole = (session.user as any)?.role;
  const userEmail = session.user?.email?.toLowerCase();
  const isAdmin = userRole === "admin" || (userEmail && process.env.ALLOWED_ADMIN_EMAILS?.split(',').map(e => e.trim().toLowerCase()).includes(userEmail));
  
  if (!isAdmin) {
    redirect("/403");
  }
  
  return (
    <main className="container mx-auto px-4 py-8">
      <section>
        <h1 className="text-2xl font-bold mb-4">Catering Admin</h1>
        <p className="opacity-80">Manage requests, deposits, menus, and schedules.</p>
      </section>
    </main>
  );
}