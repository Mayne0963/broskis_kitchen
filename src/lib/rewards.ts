// Broski's Rewards System Utilities
// Common functions for rewards business logic

import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  writeBatch,
  Timestamp,
  FieldValue,
  increment
} from 'firebase/firestore';
import { db } from './firebase/admin';
import {
  LoyaltyProfile,
  PointsTransaction,
  UserRedemption,
  SpinHistory,
  RewardCatalog,
  UserTier,
  TransactionType,
  SpinWheelConfig,
  DEFAULT_SPIN_WHEEL_CONFIG,
  POINTS_PER_DOLLAR,
  POINTS_EXPIRY_DAYS,
  SPIN_COOLDOWN_HOURS,
  SENIOR_SPIN_COST,
  VOLUNTEER_DISCOUNT_THRESHOLD,
  VOLUNTEER_DISCOUNT_PERCENTAGE
} from '../types/rewards';

// Constants - NEW PROFIT LOGIC
export const SPIN_COST_POINTS = 10; // Regular users
export const SENIOR_SPIN_COST_POINTS = 5; // Senior users
export const JACKPOT_PROBABILITY = 0.02; // 2% (reduced from 5%)
export const TARGET_GIVEBACK_PERCENTAGE = 0.08; // 8%

// Points calculation utilities
export function calculatePointsFromSubtotal(subtotal: number): number {
  return Math.floor(subtotal * POINTS_PER_DOLLAR);
}

export function calculatePointsFromAmount(amountUSD: number): number {
  const safe = isFinite(amountUSD) && amountUSD > 0 ? amountUSD : 0;
  // 1 point per $10 => 0.1 pt per $1
  return Math.floor(safe * 0.1);
}

export function calculateExpiryDate(earnedAt: Date = new Date()): Date {
  const expiryDate = new Date(earnedAt);
  expiryDate.setDate(expiryDate.getDate() + POINTS_EXPIRY_DAYS);
  return expiryDate;
}

// Loyalty profile management
export async function getLoyaltyProfile(userId: string): Promise<LoyaltyProfile | null> {
  try {
    const profileDoc = await getDoc(doc(db, 'loyalty', userId));
    if (!profileDoc.exists()) {
      return null;
    }
    
    const data = profileDoc.data();
    return {
      ...data,
      lastSpinAt: data.lastSpinAt?.toDate() || null,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate()
    } as LoyaltyProfile;
  } catch (error) {
    console.error('Error getting loyalty profile:', error);
    throw error;
  }
}

export async function createLoyaltyProfile(userId: string, tier: UserTier = 'regular'): Promise<LoyaltyProfile> {
  const now = new Date();
  const profile: LoyaltyProfile = {
    userId,
    currentPoints: 0,
    totalEarned: 0,
    totalRedeemed: 0,
    lastSpinAt: null,
    lifetimeSpins: 0,
    tier,
    createdAt: now,
    updatedAt: now
  };
  
  try {
    await setDoc(doc(db, 'loyalty', userId), {
      ...profile,
      lastSpinAt: null,
      createdAt: Timestamp.fromDate(now),
      updatedAt: Timestamp.fromDate(now)
    });
    
    return profile;
  } catch (error) {
    console.error('Error creating loyalty profile:', error);
    throw error;
  }
}

export async function updateLoyaltyProfile(userId: string, updates: Partial<LoyaltyProfile>): Promise<void> {
  try {
    const updateData: any = {
      ...updates,
      updatedAt: Timestamp.fromDate(new Date())
    };
    
    // Convert Date objects to Timestamps
    if (updates.lastSpinAt) {
      updateData.lastSpinAt = Timestamp.fromDate(updates.lastSpinAt);
    }
    
    await updateDoc(doc(db, 'loyalty', userId), updateData);
  } catch (error) {
    console.error('Error updating loyalty profile:', error);
    throw error;
  }
}

// Points transaction management
export async function addPointsTransaction(
  userId: string,
  orderId: string,
  type: TransactionType,
  amount: number,
  orderSubtotal?: number,
  metadata?: Record<string, any>
): Promise<string> {
  try {
    const now = new Date();
    const transaction: Omit<PointsTransaction, 'id'> = {
      userId,
      orderId,
      type,
      amount,
      orderSubtotal,
      earnedAt: now,
      expiresAt: type === 'earned' || type === 'bonus' ? calculateExpiryDate(now) : now,
      isExpired: false,
      metadata
    };
    
    const transactionRef = doc(collection(db, 'pointsTransactions'));
    await setDoc(transactionRef, {
      ...transaction,
      earnedAt: Timestamp.fromDate(transaction.earnedAt),
      expiresAt: Timestamp.fromDate(transaction.expiresAt)
    });
    
    return transactionRef.id;
  } catch (error) {
    console.error('Error adding points transaction:', error);
    throw error;
  }
}

// Reward catalog management
export async function getActiveRewards(): Promise<RewardCatalog[]> {
  try {
    const rewardsQuery = query(
      collection(db, 'rewardCatalog'),
      where('isActive', '==', true),
      orderBy('sortOrder', 'asc')
    );
    
    const snapshot = await getDocs(rewardsQuery);
    return snapshot.docs.map(doc => ({
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate()
    })) as RewardCatalog[];
  } catch (error) {
    console.error('Error getting active rewards:', error);
    throw error;
  }
}

export async function getRewardById(rewardId: string): Promise<RewardCatalog | null> {
  try {
    const rewardDoc = await getDoc(doc(db, 'rewardCatalog', rewardId));
    if (!rewardDoc.exists()) {
      return null;
    }
    
    const data = rewardDoc.data();
    return {
      ...data,
      createdAt: data.createdAt.toDate(),
      updatedAt: data.updatedAt.toDate()
    } as RewardCatalog;
  } catch (error) {
    console.error('Error getting reward by ID:', error);
    throw error;
  }
}

// Spin wheel utilities
export function canUserSpin(profile: LoyaltyProfile): { canSpin: boolean; nextSpinAt?: Date; reason?: string } {
  if (!profile.lastSpinAt) {
    return { canSpin: true };
  }
  
  const nextSpinAt = new Date(profile.lastSpinAt);
  nextSpinAt.setHours(nextSpinAt.getHours() + SPIN_COOLDOWN_HOURS);
  
  if (new Date() < nextSpinAt) {
    return {
      canSpin: false,
      nextSpinAt,
      reason: 'Spin cooldown active'
    };
  }
  
  return { canSpin: true };
}

export function getSpinCost(tier: UserTier): number {
  return tier === 'senior' ? SENIOR_SPIN_COST : 0;
}

export function executeSpinWheel(config: SpinWheelConfig = DEFAULT_SPIN_WHEEL_CONFIG): {
  points: number;
  isJackpot: boolean;
} {
  const random = Math.random();
  let cumulativeProbability = 0;
  
  for (const segment of config.segments) {
    cumulativeProbability += segment.probability;
    if (random <= cumulativeProbability) {
      return {
        points: segment.points,
        isJackpot: segment.isJackpot
      };
    }
  }
  
  // Fallback to smallest reward
  const fallback = config.segments[0];
  return {
    points: fallback.points,
    isJackpot: fallback.isJackpot
  };
}

// Redemption utilities
export function validateRedemption(
  reward: RewardCatalog,
  userPoints: number,
  itemCogs?: number
): { valid: boolean; reason?: string } {
  if (!reward.isActive) {
    return { valid: false, reason: 'Reward is not active' };
  }
  
  if (userPoints < reward.pointsCost) {
    return { valid: false, reason: 'Insufficient points' };
  }
  
  if (reward.type === 'fixed_item' && itemCogs && itemCogs > reward.maxCogsValue) {
    return { valid: false, reason: `Item COGS ($${itemCogs}) exceeds maximum allowed ($${reward.maxCogsValue})` };
  }
  
  return { valid: true };
}

export function calculateDiscountAmount(
  reward: RewardCatalog,
  orderSubtotal: number,
  itemCogs?: number
): number {
  switch (reward.type) {
    case 'fixed_item':
      return itemCogs || reward.maxCogsValue;
    case 'percentage_discount':
      return orderSubtotal * (reward.discountPercent! / 100);
    case 'merchandise':
      return reward.maxCogsValue;
    default:
      return 0;
  }
}

// Volunteer benefits
export function shouldApplyVolunteerDiscount(
  tier: UserTier,
  orderSubtotal: number,
  hasOtherDiscounts: boolean
): boolean {
  return (
    tier === 'volunteer' &&
    orderSubtotal >= VOLUNTEER_DISCOUNT_THRESHOLD &&
    !hasOtherDiscounts
  );
}

export function calculateVolunteerDiscount(orderSubtotal: number): number {
  return orderSubtotal * VOLUNTEER_DISCOUNT_PERCENTAGE;
}

// Expiry management
export async function expireOldPoints(): Promise<number> {
  try {
    const now = new Date();
    const expiredQuery = query(
      collection(db, 'pointsTransactions'),
      where('expiresAt', '<=', Timestamp.fromDate(now)),
      where('isExpired', '==', false),
      where('type', 'in', ['earned', 'bonus'])
    );
    
    const snapshot = await getDocs(expiredQuery);
    const batch = writeBatch(db);
    let expiredCount = 0;
    
    for (const docSnapshot of snapshot.docs) {
      const transaction = docSnapshot.data() as PointsTransaction;
      
      // Mark transaction as expired
      batch.update(docSnapshot.ref, { isExpired: true });
      
      // Create expiry transaction
      const expiryTransactionRef = doc(collection(db, 'pointsTransactions'));
      batch.set(expiryTransactionRef, {
        userId: transaction.userId,
        orderId: transaction.orderId,
        type: 'expired',
        amount: -transaction.amount,
        earnedAt: Timestamp.fromDate(now),
        expiresAt: Timestamp.fromDate(now),
        isExpired: false,
        metadata: {
          originalTransactionId: docSnapshot.id,
          expiredAt: Timestamp.fromDate(now)
        }
      });
      
      // Update user's current points
      const profileRef = doc(db, 'loyalty', transaction.userId);
      batch.update(profileRef, {
        currentPoints: increment(-transaction.amount),
        updatedAt: Timestamp.fromDate(now)
      });
      
      expiredCount++;
    }
    
    await batch.commit();
    console.log(`Expired ${expiredCount} point transactions`);
    return expiredCount;
    
  } catch (error) {
    console.error('Error expiring old points:', error);
    throw error;
  }
}

// Analytics utilities
export async function calculateGivebackPercentage(days: number = 30): Promise<number> {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Get all redemptions in the period
    const redemptionsQuery = query(
      collection(db, 'userRedemptions'),
      where('redeemedAt', '>=', Timestamp.fromDate(startDate))
    );
    
    const redemptionsSnapshot = await getDocs(redemptionsQuery);
    let totalDiscountValue = 0;
    
    redemptionsSnapshot.docs.forEach(doc => {
      const redemption = doc.data() as UserRedemption;
      totalDiscountValue += redemption.discountAmount;
    });
    
    // Get total order value in the same period (this would need to be implemented based on your orders collection)
    // For now, we'll use a placeholder calculation
    const estimatedOrderValue = totalDiscountValue / 0.08; // Assuming 8% target giveback
    
    return totalDiscountValue / estimatedOrderValue;
  } catch (error) {
    console.error('Error calculating giveback percentage:', error);
    throw error;
  }
}