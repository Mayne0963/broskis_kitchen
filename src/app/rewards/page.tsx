import RewardsClient from "./RewardsClient";
import { withAuthGuard } from "@/lib/auth/session";

export default async function RewardsPage() {
  return await withAuthGuard(async (user) => {
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
  }, { requireEmailVerification: false }); // Rewards can be viewed without email verification
}
