import { adminDb } from '@/lib/firebaseAdmin';
const db = adminDb;

export type RewardsBalance = {
  uid: string;
  points: number;
  expiringSoon?: Array<{ points: number; expiresAt: number }>;
  nextSpinUTC?: string; // ISO
};

export async function getUserRewardsBalance(uid: string): Promise<RewardsBalance> {
  try {
    const doc = await db.collection('rewards_balances').doc(uid).get();
    const data = (doc.exists ? doc.data() : {}) as any;
    return {
      uid,
      points: Number(data?.points || 0),
      expiringSoon: Array.isArray(data?.expiringSoon) ? data.expiringSoon : [],
      nextSpinUTC: data?.nextSpinUTC || null
    };
  } catch (error) {
    console.error('Error fetching user rewards balance:', error);
    // Return safe defaults if collection doesn't exist or other error
    return {
      uid,
      points: 0,
      expiringSoon: [],
      nextSpinUTC: null
    };
  }
}

export async function getUserRewardsHistory(uid: string, limit = 25) {
  try {
    const q = await db.collection('rewards_ledger')
      .where('uid', '==', uid)
      .orderBy('createdAt', 'desc')
      .limit(limit)
      .get();
    return q.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('Error fetching user rewards history:', error);
    // Return empty array if collection doesn't exist or other error
    return [];
  }
}

export async function getRewardsCatalog() {
  try {
    const snap = await db.collection('rewards_catalog').get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  } catch (error) {
    console.error('Error fetching rewards catalog:', error);
    // Return empty catalog if collection doesn't exist or other error
    return [];
  }
}