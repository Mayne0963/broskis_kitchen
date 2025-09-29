export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import AdminClient from "./AdminClient";

function isAdminEmail(email?: string) {
  const list = (process.env.ALLOWED_ADMIN_EMAILS || "")
    .split(",").map(s=>s.trim().toLowerCase()).filter(Boolean);
  return !!email && list.includes(email.toLowerCase());
}

export default async function AdminCatering() {
  const session = await getServerSession(authOptions as any);
  const email = session?.user?.email || "";
  const flag = (session as any)?.user?.isAdmin === true;

  if (!session) {
    redirect(`/api/auth/signin?callbackUrl=/admin/catering`);
  }
  if (!(flag || isAdminEmail(email))) {
    redirect(`/unauthorized`);
  }

  return <AdminClient adminEmail={email} />;
}