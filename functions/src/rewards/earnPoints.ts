import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import {
  getOrCreateRewardsProfile,
  updateRewardsProfile,
  createRewardsTransaction,
  calculateTier,
  validatePointsAmount,
  checkRateLimit,
  PointsTransaction
} from './utils';

interface EarnPointsRequest {
  userId: string;
  points: number;
  orderId?: string;
  description?: string;
  metadata?: any;
}

export const earnPoints = functions.https.onCall(async (data: EarnPointsRequest, context) => {
  try {
    // Validate authentication
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { userId, points, orderId, description = 'Points earned', metadata } = data;

    // Validate input
    if (!userId || !validatePointsAmount(points)) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid userId or points amount');
    }

    // Rate limiting: 10 requests per minute per user
    const rateLimitKey = `earnPoints:${userId}`;
    if (!checkRateLimit(rateLimitKey, 10, 60000)) {
      throw new functions.https.HttpsError('resource-exhausted', 'Rate limit exceeded');
    }

    // Check for duplicate order processing
    if (orderId) {
      const db = admin.firestore();
      const existingTransaction = await db.collection('rewardsTransactions')
        .where('orderId', '==', orderId)
        .where('type', '==', 'earned')
        .limit(1)
        .get();

      if (!existingTransaction.empty) {
        return {
          success: true,
          duplicate: true,
          message: 'Points already awarded for this order'
        };
      }
    }

    // Get or create user profile
    const { profile } = await getOrCreateRewardsProfile(userId);

    // Calculate new values
    const newPoints = profile.points + points;
    const newLifetimePoints = profile.lifetimePoints + points;
    const newTier = calculateTier(newLifetimePoints);
    const tierChanged = newTier !== profile.tier;

    // Update profile
    await updateRewardsProfile(userId, {
      points: newPoints,
      lifetimePoints: newLifetimePoints,
      tier: newTier
    });

    // Create transaction record
    const transaction: PointsTransaction = {
      uid: userId,
      delta: points,
      type: 'earned',
      description,
      orderId,
      metadata,
      createdAt: Date.now()
    };

    const transactionId = await createRewardsTransaction(transaction);

    // Log tier change if applicable
    if (tierChanged) {
      console.log(`User ${userId} tier changed from ${profile.tier} to ${newTier}`);
      
      // Create tier change transaction
      await createRewardsTransaction({
        uid: userId,
        delta: 0,
        type: 'earned',
        description: `Tier upgraded to ${newTier}`,
        metadata: { tierChange: { from: profile.tier, to: newTier } },
        createdAt: Date.now()
      });
    }

    return {
      success: true,
      transactionId,
      newBalance: newPoints,
      newLifetimePoints,
      newTier,
      tierChanged,
      pointsAwarded: points
    };

  } catch (error) {
    console.error('Error in earnPoints:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', 'Internal server error');
  }
});