import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session) return <div className="p-6">Please sign in.</div>;

  const user = session.user;
  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">My Profile</h1>
      <div className="grid gap-2">
        <div><b>Name:</b> {user.name ?? "—"}</div>
        <div><b>Email:</b> {user.email ?? "—"}</div>
      </div>
    </main>
  );
}