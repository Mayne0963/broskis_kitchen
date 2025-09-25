// app/account/profile/page.tsx
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getServerUser } from "@/lib/session";
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
  const user = await getServerUser();

  if (!user) {
    redirect('/login?next=/account/profile');
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