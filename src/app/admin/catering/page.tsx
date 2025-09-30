export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import CateringAdminView from "./CateringAdminView";

export default async function Page() {
  const s = await getServerSession(authOptions as any);
  if (!s) redirect(`/api/auth/signin?callbackUrl=/admin/catering`);
  if ((s.user as any)?.role !== "admin") redirect("/403?m=admin_only");
  return <CateringAdminView adminEmail={s.user?.email || ""} />;
}