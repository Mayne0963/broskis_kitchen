export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;

import { requireRole } from "@/lib/auth/session";
import MenuDropsTab from "@/components/admin/MenuDropsTab";

export default async function AdminMenuDropsPage() {
  await requireRole(["admin"]);
  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      <h1 className="text-3xl font-bold text-yellow-300 mb-6">Menu Drops Admin</h1>
      <MenuDropsTab initialMenuDrops={[]} />
    </div>
  );
}
