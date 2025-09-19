// app/account/profile/page.tsx
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getServerUser } from "@/lib/authServer";

export default async function ProfilePage() {
  const user = await getServerUser();

  if (!user) {
    return (
      <main className="p-6">
        <Card className="border-[#FFD700] bg-[#0b0b0b] text-white">
          <CardHeader>
            <CardTitle>Sign in required</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Please sign in to view your profile.</p>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="p-6">
      <Card className="border-[#FFD700] bg-[#0b0b0b] text-white">
        <CardHeader>
          <CardTitle>My Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <span className="text-white/70">User ID:</span>
            <span className="ml-2">{user.uid}</span>
          </div>
          <div>
            <span className="text-white/70">Email:</span>
            <span className="ml-2">{user.email ?? "—"}</span>
          </div>
          <div>
            <span className="text-white/70">Role:</span>
            <span className="ml-2">{user.role ?? "customer"}</span>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}