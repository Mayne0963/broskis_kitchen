import RewardsClient from "./RewardsClient";
import { requireUser } from "@/lib/auth/server";

export default async function RewardsPage() {
  const user = await requireUser();
  if (!user.ok) {
    return (
      <div className="mx-auto max-w-3xl p-8">
        <h1 className="text-2xl font-semibold mb-2">Rewards</h1>
        <p className="text-white/70">
          Please <a className="underline" href="/login">sign in</a> to view your rewards.
        </p>
      </div>
    );
  }
  // Prefer internal call to reuse API error shapes
  const base = process.env.NEXTAUTH_URL || "";
  let initial: any = { ok: false, reason: "bootstrap" };
  try {
    const res = await fetch(`${base}/api/rewards/me`, { cache: "no-store" });
    initial = await res.json();
  } catch {
    initial = { ok: false, reason: "fetch_failed" };
  }
  return <RewardsClient initial={initial} />;
}
