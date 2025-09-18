import { getServerUser } from "@/lib/authServer";

export default async function ProfilePage() {
  const user = await getServerUser();
  if (!user) return <main className="p-6">Please sign in.</main>;

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">My Profile</h1>
      <div className="grid gap-2">
        <div><b>User ID:</b> {user.uid}</div>
        <div><b>Email:</b> {user.email || "—"}</div>
        <div><b>Role:</b> {user.role}</div>
      </div>
    </main>
  );
}