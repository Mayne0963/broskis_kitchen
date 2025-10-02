export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import CateringAdminView from "./CateringAdminView";

export default async function Page() {
  const session = await getServerSession(authOptions);
  
  // Redirect to sign in if not authenticated
  if (!session?.user) {
    redirect(`/api/auth/signin?callbackUrl=${encodeURIComponent('/admin/catering')}`);
  }
  
  // Check admin role from NextAuth session
  const userRole = (session.user as any).role;
  if (userRole !== "admin") {
    redirect("/403?m=admin_only");
  }
  
  return <CateringAdminView adminEmail={session.user.email || ""} />;
}