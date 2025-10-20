// app/account/profile/page.tsx
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { withAuthGuard } from "@/lib/auth/session";

export default async function ProfilePage() {
  return await withAuthGuard(async (user) => {

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
            <span className="ml-2">{(user as any).role ?? "customer"}</span>
          </div>
        </CardContent>
      </Card>
    </main>
  );
  }, { requireEmailVerification: true });
}