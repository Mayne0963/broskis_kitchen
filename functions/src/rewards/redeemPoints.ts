import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import {
  getOrCreateRewardsProfile,
  updateRewardsProfile,
  createRewardsTransaction,
  validatePointsAmount,
  checkRateLimit,
  PointsTransaction
} from './utils';

interface RedeemPointsRequest {
  userId: string;
  points: number;
  rewardId: string;
  description?: string;
  metadata?: any;
}

// Reward catalog - this would typically come from Firestore
const REWARD_CATALOG = [
  { id: 'free_appetizer', name: 'Free Appetizer', points: 250, active: true },
  { id: 'free_entree', name: 'Free Entree', points: 500, active: true },
  { id: 'free_dessert', name: 'Free Dessert', points: 200, active: true },
  { id: '10_percent_off', name: '10% Off Next Order', points: 150, active: true },
  { id: '20_percent_off', name: '20% Off Next Order', points: 300, active: true },
  { id: 'free_drink', name: 'Free Drink', points: 100, active: true },
];

export const redeemPoints = functions.https.onCall(async (data: RedeemPointsRequest, context) => {
  try {
    // Validate authentication
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { userId, points, rewardId, description, metadata } = data;

    // Validate input
    if (!userId || !validatePointsAmount(points) || !rewardId) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid userId, points amount, or rewardId');
    }

    // Rate limiting: 5 redemptions per hour per user
    const rateLimitKey = `redeemPoints:${userId}`;
    if (!checkRateLimit(rateLimitKey, 5, 3600000)) {
      throw new functions.https.HttpsError('resource-exhausted', 'Redemption rate limit exceeded');
    }

    // Validate reward exists and is active
    const reward = REWARD_CATALOG.find(r => r.id === rewardId && r.active);
    if (!reward) {
      throw new functions.https.HttpsError('not-found', 'Reward not found or inactive');
    }

    // Validate points match reward cost
    if (points !== reward.points) {
      throw new functions.https.HttpsError('invalid-argument', 'Points amount does not match reward cost');
    }

    // Get user profile
    const { profile } = await getOrCreateRewardsProfile(userId);

    // Check if user has enough points
    if (profile.points < points) {
      throw new functions.https.HttpsError('failed-precondition', 'Insufficient points balance');
    }

    // Calculate new balance
    const newPoints = profile.points - points;

    // Generate redemption code
    const redemptionCode = generateRedemptionCode();

    // Update profile
    await updateRewardsProfile(userId, {
      points: newPoints
    });

    // Create transaction record
    const transaction: PointsTransaction = {
      uid: userId,
      delta: -points,
      type: 'redeemed',
      description: description || `Redeemed: ${reward.name}`,
      metadata: {
        rewardId,
        rewardName: reward.name,
        redemptionCode,
        ...metadata
      },
      createdAt: Date.now()
    };

    const transactionId = await createRewardsTransaction(transaction);

    // Create redemption record in separate collection
    const db = admin.firestore();
    const redemptionRef = await db.collection('userRedemptions').add({
      userId,
      rewardId,
      rewardName: reward.name,
      pointsRedeemed: points,
      redemptionCode,
      status: 'active',
      usedAt: null,
      createdAt: Date.now(),
      expiresAt: Date.now() + (30 * 24 * 60 * 60 * 1000) // 30 days
    });

    console.log(`User ${userId} redeemed ${points} points for ${reward.name}, code: ${redemptionCode}`);

    return {
      success: true,
      transactionId,
      redemptionId: redemptionRef.id,
      redemptionCode,
      newBalance: newPoints,
      pointsRedeemed: points,
      rewardName: reward.name
    };

  } catch (error) {
    console.error('Error in redeemPoints:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', 'Internal server error');
  }
});

// Helper function to generate redemption codes
function generateRedemptionCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 8; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}