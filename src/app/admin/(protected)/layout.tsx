import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth/options";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const fetchCache = "force-no-store";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions as any);
  if (!session?.user || (session.user as any).role !== "admin") {
    redirect("/auth/signin?from=/admin");
  }
  return <>{children}</>;
}