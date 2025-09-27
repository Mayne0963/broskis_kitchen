import { db } from "@/lib/db";
import { REWARD_RULES } from "@/config/rewardRules";

export async function mintTokensForUser(
  userId: string,
  { isVip, spentUsdLast24h, profileComplete }: {
    isVip: boolean;
    spentUsdLast24h: number;
    profileComplete: boolean;
  }
) {
  const eligibilityRules = [];

  // Check VIP daily spin eligibility
  if (REWARD_RULES.dailyVipSpin.enabled && isVip) {
    eligibilityRules.push({ rule: "vip:daily" });
  }

  // Check spending threshold eligibility
  if (REWARD_RULES.spendThreshold.enabled && spentUsdLast24h >= REWARD_RULES.spendThreshold.usd) {
    eligibilityRules.push({ rule: "order:$20+" });
  }

  // Check profile completion eligibility
  if (REWARD_RULES.profileComplete.enabled && profileComplete) {
    eligibilityRules.push({ rule: "profile:complete" });
  }

  // Create eligibility records for each qualifying rule
  for (const ruleData of eligibilityRules) {
    await db.rewardEligibility.create({
      data: {
        userId,
        rule: ruleData.rule
      }
    });
  }

  return eligibilityRules.length;
}