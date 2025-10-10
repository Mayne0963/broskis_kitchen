import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/server";
import { getLastTransactions, getOrCreateRewardsProfile } from "@/lib/rewards";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";

export async function GET() {
  try {
    const user = await requireUser();
    if (!user.ok) {
      return NextResponse.json({ ok: false, reason: user.reason }, { status: 401 });
    }
    
    const [{ profile }, transactions] = await Promise.all([
      getOrCreateRewardsProfile(user.uid),
      getLastTransactions(user.uid, 25),
    ]);

    // Try to get referral code from Firebase Function
    let referralCode = null;
    try {
      const getReferralCode = httpsCallable(functions, 'getReferralCode');
      const referralResult = await getReferralCode({ uid: user.uid });
      const referralData = referralResult.data as any;
      if (referralData.success) {
        referralCode = referralData.referralCode;
      }
    } catch (referralError) {
      console.warn("Failed to get referral code:", referralError);
      // Don't fail the entire request if referral code fetch fails
    }

    // Add referral code to profile if available
    const enhancedProfile = {
      ...profile,
      ...(referralCode && { referralCode })
    };

    return NextResponse.json({ ok: true, profile: enhancedProfile, transactions });
  } catch (e: any) {
    console.error("[/api/rewards/me] error", e?.message || e);
    return NextResponse.json({ ok: false, reason: "server_error" }, { status: 500 });
  }
}