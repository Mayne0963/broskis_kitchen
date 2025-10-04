import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../../api/auth/[...nextauth]/route";
import { isAdmin, normalizeRole } from "../../../lib/roles";

export default async function AdminCateringPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?reason=unauthenticated");

  const role = normalizeRole((session.user as any).role);
  console.log("🔥 Admin Guard:", { email: session.user.email, role });

  if (!isAdmin(role)) redirect("/not-authorized");

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Admin Catering</h1>
      <p>Welcome, {session.user.name}! Role: {role}</p>
      {/* Place secure admin UI here */}
      <p className="text-sm text-neutral-600">
        This page is protected server-side with normalized role checking.
      </p>
    </div>
  );
}