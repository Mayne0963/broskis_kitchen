// app/account/profile/page.tsx
export const dynamic = "force-dynamic";
import { API_BASE } from "@/lib/apiBase";

async function getMe() {
  try {
    const res = await fetch(`${API_BASE}/api/me`, {
      cache: "no-store",
      credentials: "include",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

export default async function ProfilePage() {
  const me = await getMe();
  const user = me?.user;

  if (!user) {
    return <main className="p-6">Please sign in to view your profile.</main>;
  }

  return (
    <main className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">My Profile</h1>
      <div className="grid gap-2">
        <div><b>User ID:</b> {user.uid}</div>
        <div><b>Email:</b> {user.email ?? "—"}</div>
        <div><b>Role:</b> {user.role ?? "customer"}</div>
      </div>
    </main>
  );
}