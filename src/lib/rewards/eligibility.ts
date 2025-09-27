/**
 * Server-only utility functions for reward eligibility management.
 * These functions should only be used in server-side contexts.
 */

export async function consumeOneEligibility(tx: any, userId: string) {
  const token = await tx.rewardEligibility.findFirst({
    where: {
      userId,
      consumedAt: null
    },
    orderBy: {
      createdAt: "asc"
    }
  });
  
  if (!token) return null;
  
  await tx.rewardEligibility.update({
    where: {
      id: token.id
    },
    data: {
      consumedAt: new Date()
    }
  });
  
  return token;
}