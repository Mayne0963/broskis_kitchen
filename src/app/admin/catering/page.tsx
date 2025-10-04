import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "../../api/auth/[...nextauth]/route";

export default async function AdminCateringPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?reason=unauthenticated");
  if (session.user.role !== "ADMIN") redirect("/not-authorized");

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Admin Catering</h1>
      {/* Place secure admin UI here */}
      <p className="text-sm text-neutral-600">
        Welcome, Admin. This page is protected server-side.
      </p>
    </div>
  );
}