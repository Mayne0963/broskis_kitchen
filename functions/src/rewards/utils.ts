import * as admin from 'firebase-admin';

// Types
export interface RewardsProfile {
  uid: string;
  points: number;
  lifetimePoints: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  createdAt: number;
  updatedAt: number;
  referralCode?: string;
  referredBy?: string;
  birthday?: string;
  streak?: number;
  lastSpinAt?: number;
  lifetimeSpins?: number;
  lastBirthdayBonus?: number;
}

export interface PointsTransaction {
  uid: string;
  delta: number;
  type: 'earned' | 'redeemed' | 'admin_adjustment' | 'birthday_bonus' | 'referral_bonus';
  description: string;
  orderId?: string;
  adminId?: string;
  metadata?: any;
  createdAt: number;
}

// Tier thresholds
export const TIER_THRESHOLDS = {
  bronze: 0,
  silver: 500,
  gold: 1500,
  platinum: 3000
};

// Calculate user tier based on lifetime points
export function calculateTier(lifetimePoints: number): 'bronze' | 'silver' | 'gold' | 'platinum' {
  if (lifetimePoints >= TIER_THRESHOLDS.platinum) return 'platinum';
  if (lifetimePoints >= TIER_THRESHOLDS.gold) return 'gold';
  if (lifetimePoints >= TIER_THRESHOLDS.silver) return 'silver';
  return 'bronze';
}

// Get or create rewards profile
export async function getOrCreateRewardsProfile(uid: string): Promise<{ profile: RewardsProfile; created: boolean }> {
  const db = admin.firestore();
  const ref = db.collection('rewardsProfiles').doc(uid);
  const snap = await ref.get();

  if (snap.exists) {
    const data = snap.data() as RewardsProfile;
    return { profile: data, created: false };
  }

  const now = Date.now();
  const profile: RewardsProfile = {
    uid,
    points: 0,
    lifetimePoints: 0,
    tier: 'bronze',
    createdAt: now,
    updatedAt: now,
  };

  await ref.set(profile);
  return { profile, created: true };
}

// Update rewards profile
export async function updateRewardsProfile(uid: string, updates: Partial<RewardsProfile>): Promise<void> {
  const db = admin.firestore();
  const ref = db.collection('rewardsProfiles').doc(uid);
  await ref.update({
    ...updates,
    updatedAt: Date.now()
  });
}

// Create rewards transaction
export async function createRewardsTransaction(transaction: PointsTransaction): Promise<string> {
  const db = admin.firestore();
  const ref = await db.collection('rewardsTransactions').add(transaction);
  return ref.id;
}

// Generate unique referral code
export function generateReferralCode(uid: string): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 8);
  const uidPart = uid.substring(0, 4);
  return `${uidPart}${timestamp}${randomPart}`.toUpperCase();
}

// Validate points amount
export function validatePointsAmount(points: number): boolean {
  return Number.isInteger(points) && points > 0 && points <= 10000;
}

// Check if user exists
export async function userExists(uid: string): Promise<boolean> {
  try {
    await admin.auth().getUser(uid);
    return true;
  } catch (error) {
    return false;
  }
}

// Get user email
export async function getUserEmail(uid: string): Promise<string | null> {
  try {
    const user = await admin.auth().getUser(uid);
    return user.email || null;
  } catch (error) {
    return null;
  }
}

// Check if user is admin
export async function isAdmin(uid: string): Promise<boolean> {
  try {
    const user = await admin.auth().getUser(uid);
    return user.customClaims?.admin === true;
  } catch (error) {
    return false;
  }
}

// Rate limiting helper
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(key: string, maxRequests: number, windowMs: number): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(key);

  if (!record || now > record.resetTime) {
    rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (record.count >= maxRequests) {
    return false;
  }

  record.count++;
  return true;
}