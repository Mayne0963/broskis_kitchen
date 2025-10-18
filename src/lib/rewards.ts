import { dbAdmin } from "@/lib/firebase/admin";

export async function getOrCreateRewardsProfile(uid: string) {
  const ref = dbAdmin.collection("rewardsProfiles").doc(uid);
  const snap = await ref.get();
  if (snap.exists) {
    const data = snap.data() || {};
    // guarantee required fields exist
    const profile = {
      uid,
      points: Number(data.points ?? 0),
      lifetimePoints: Number(data.lifetimePoints ?? 0),
      tier: (data.tier ?? "bronze").toString(),
      createdAt: Number(data.createdAt ?? Date.now()),
      updatedAt: Number(data.updatedAt ?? Date.now()),
      referralCode: data.referralCode,
      referredBy: data.referredBy,
      birthday: data.birthday,
      streak: data.streak,
    };
    return { profile, created: false };
  }

  const now = Date.now();
  const profile = {
    uid, points: 0, lifetimePoints: 0, tier: "bronze",
    createdAt: now, updatedAt: now,
  };
  await ref.set(profile, { merge: true });
  return { profile, created: true };
}

export async function getLastTransactions(uid: string, limit = 25) {
  const q = await dbAdmin.collection("rewardsTransactions")
    .where("uid", "==", uid)
    .orderBy("createdAt", "desc")
    .limit(limit)
    .get();
  return q.docs.map(d => ({ id: d.id, ...d.data() }));
}

export async function calculateGivebackPercentage(startDate: Date, endDate: Date) {
  try {
    // Get all redemptions in the date range
    const redemptionsQuery = await dbAdmin.collection("rewardsTransactions")
      .where("type", "==", "redemption")
      .where("createdAt", ">=", startDate.getTime())
      .where("createdAt", "<=", endDate.getTime())
      .get();

    let totalPointsRedeemed = 0;
    let totalCogsValue = 0;

    redemptionsQuery.docs.forEach(doc => {
      const data = doc.data();
      totalPointsRedeemed += Math.abs(data.points || 0);
      totalCogsValue += data.cogsValue || 0;
    });

    // Calculate giveback percentage (assuming 1 point = $0.01)
    const totalDollarValue = totalPointsRedeemed * 0.01;
    const givebackPercentage = totalDollarValue > 0 ? (totalCogsValue / totalDollarValue) * 100 : 0;

    return {
      totalPointsRedeemed,
      totalCogsValue,
      totalDollarValue,
      givebackPercentage
    };
  } catch (error) {
    console.error('Error calculating giveback percentage:', error);
    return {
      totalPointsRedeemed: 0,
      totalCogsValue: 0,
      totalDollarValue: 0,
      givebackPercentage: 0
    };
  }
}

export async function getLoyaltyProfile(uid: string) {
  // This is an alias for getOrCreateRewardsProfile for backward compatibility
  return getOrCreateRewardsProfile(uid);
}

export function shouldApplyVolunteerDiscount(profile: any): boolean {
  // Check if user has volunteer status or special tier
  return profile?.tier === 'volunteer' || profile?.isVolunteer === true;
}

export function calculateVolunteerDiscount(orderTotal: number, profile: any): number {
  if (!shouldApplyVolunteerDiscount(profile)) {
    return 0;
  }
  
  // Apply 10% volunteer discount, max $20
  const discount = Math.min(orderTotal * 0.1, 20);
  return discount;
}

export async function expireOldPoints() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Find points that are older than 30 days
    const expiredPointsQuery = await dbAdmin.collection("rewardsTransactions")
      .where("type", "==", "earned")
      .where("createdAt", "<=", thirtyDaysAgo.getTime())
      .where("expired", "!=", true)
      .get();

    const batch = dbAdmin.batch();
    let totalExpiredPoints = 0;

    expiredPointsQuery.docs.forEach(doc => {
      const data = doc.data();
      totalExpiredPoints += data.points || 0;
      
      // Mark the transaction as expired
      batch.update(doc.ref, { expired: true, expiredAt: Date.now() });
      
      // Create an expiration transaction
      const expirationRef = dbAdmin.collection("rewardsTransactions").doc();
      batch.set(expirationRef, {
        uid: data.uid,
        type: "expired",
        points: -(data.points || 0),
        description: "Points expired after 30 days",
        createdAt: Date.now(),
        originalTransactionId: doc.id
      });
    });

    await batch.commit();

    return {
      expiredTransactions: expiredPointsQuery.size,
      totalExpiredPoints
    };
  } catch (error) {
    console.error('Error expiring old points:', error);
    throw error;
  }
}

export function calculatePointsFromAmount(amount: number): number {
  // Calculate points: 1 point per dollar spent
  return Math.floor(amount / 100); // amount is in cents
}

export async function createLoyaltyProfile(uid: string, initialData: any = {}) {
  const now = Date.now();
  const profile = {
    uid,
    points: 0,
    lifetimePoints: 0,
    tier: "bronze",
    createdAt: now,
    updatedAt: now,
    ...initialData
  };
  
  const ref = dbAdmin.collection("rewardsProfiles").doc(uid);
  await ref.set(profile, { merge: true });
  return { profile, created: true };
}

export async function updateLoyaltyProfile(uid: string, updates: any) {
  const ref = dbAdmin.collection("rewardsProfiles").doc(uid);
  const updateData = {
    ...updates,
    updatedAt: Date.now()
  };
  
  await ref.update(updateData);
  
  // Return updated profile
  const snap = await ref.get();
  return snap.exists ? snap.data() : null;
}

export async function createPointsTransaction(transactionData: {
  uid: string;
  type: string;
  points: number;
  description: string;
  orderId?: string;
  metadata?: any;
}) {
  const transaction = {
    ...transactionData,
    createdAt: Date.now(),
    id: dbAdmin.collection("rewardsTransactions").doc().id
  };
  
  const ref = dbAdmin.collection("rewardsTransactions").doc(transaction.id);
  await ref.set(transaction);
  
  return transaction;
}