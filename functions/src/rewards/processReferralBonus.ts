import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import {
  getOrCreateRewardsProfile,
  updateRewardsProfile,
  createRewardsTransaction,
  calculateTier,
  generateReferralCode,
  userExists,
  checkRateLimit,
  PointsTransaction
} from './utils';

interface ProcessReferralBonusRequest {
  referrerUserId: string;
  newUserId: string;
  referralCode: string;
}

interface GetReferralCodeRequest {
  userId: string;
}

const REFERRAL_BONUS_REFERRER = 200; // Points for the person who referred
const REFERRAL_BONUS_REFEREE = 100;  // Points for the new user

export const processReferralBonus = functions.https.onCall(async (data: ProcessReferralBonusRequest, context) => {
  try {
    // Validate authentication
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { referrerUserId, newUserId, referralCode } = data;

    // Validate input
    if (!referrerUserId || !newUserId || !referralCode) {
      throw new functions.https.HttpsError('invalid-argument', 'Missing required fields');
    }

    // Prevent self-referral
    if (referrerUserId === newUserId) {
      throw new functions.https.HttpsError('invalid-argument', 'Users cannot refer themselves');
    }

    // Rate limiting: 5 referral processes per hour per user
    const rateLimitKey = `processReferral:${newUserId}`;
    if (!checkRateLimit(rateLimitKey, 5, 3600000)) {
      throw new functions.https.HttpsError('resource-exhausted', 'Referral processing rate limit exceeded');
    }

    // Validate both users exist
    if (!(await userExists(referrerUserId)) || !(await userExists(newUserId))) {
      throw new functions.https.HttpsError('not-found', 'One or both users not found');
    }

    const db = admin.firestore();

    // Validate referral code belongs to referrer
    const { profile: referrerProfile } = await getOrCreateRewardsProfile(referrerUserId);
    if (referrerProfile.referralCode !== referralCode) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid referral code for referrer');
    }

    // Check if new user already has a referrer
    const { profile: newUserProfile } = await getOrCreateRewardsProfile(newUserId);
    if (newUserProfile.referredBy) {
      throw new functions.https.HttpsError('failed-precondition', 'User already has a referrer');
    }

    // Check if this referral was already processed
    const existingReferral = await db.collection('referralBonuses')
      .where('referrerUserId', '==', referrerUserId)
      .where('newUserId', '==', newUserId)
      .limit(1)
      .get();

    if (!existingReferral.empty) {
      throw new functions.https.HttpsError('already-exists', 'Referral bonus already processed');
    }

    // Process referrer bonus
    const referrerNewPoints = referrerProfile.points + REFERRAL_BONUS_REFERRER;
    const referrerNewLifetimePoints = referrerProfile.lifetimePoints + REFERRAL_BONUS_REFERRER;
    const referrerNewTier = calculateTier(referrerNewLifetimePoints);
    const referrerTierChanged = referrerNewTier !== referrerProfile.tier;

    await updateRewardsProfile(referrerUserId, {
      points: referrerNewPoints,
      lifetimePoints: referrerNewLifetimePoints,
      tier: referrerNewTier
    });

    // Process referee bonus and set referrer
    const newUserNewPoints = newUserProfile.points + REFERRAL_BONUS_REFEREE;
    const newUserNewLifetimePoints = newUserProfile.lifetimePoints + REFERRAL_BONUS_REFEREE;
    const newUserNewTier = calculateTier(newUserNewLifetimePoints);
    const newUserTierChanged = newUserNewTier !== newUserProfile.tier;

    await updateRewardsProfile(newUserId, {
      points: newUserNewPoints,
      lifetimePoints: newUserNewLifetimePoints,
      tier: newUserNewTier,
      referredBy: referrerUserId
    });

    // Create transaction records
    const referrerTransaction: PointsTransaction = {
      uid: referrerUserId,
      delta: REFERRAL_BONUS_REFERRER,
      type: 'referral_bonus',
      description: `Referral bonus for inviting new user`,
      metadata: {
        referredUserId: newUserId,
        referralCode,
        bonusType: 'referrer'
      },
      createdAt: Date.now()
    };

    const newUserTransaction: PointsTransaction = {
      uid: newUserId,
      delta: REFERRAL_BONUS_REFEREE,
      type: 'referral_bonus',
      description: `Welcome bonus for joining via referral`,
      metadata: {
        referrerUserId,
        referralCode,
        bonusType: 'referee'
      },
      createdAt: Date.now()
    };

    const [referrerTransactionId, newUserTransactionId] = await Promise.all([
      createRewardsTransaction(referrerTransaction),
      createRewardsTransaction(newUserTransaction)
    ]);

    // Record the referral bonus processing
    await db.collection('referralBonuses').add({
      referrerUserId,
      newUserId,
      referralCode,
      referrerBonus: REFERRAL_BONUS_REFERRER,
      refereeBonus: REFERRAL_BONUS_REFEREE,
      referrerTransactionId,
      newUserTransactionId,
      processedAt: Date.now()
    });

    // Handle tier changes
    if (referrerTierChanged) {
      await createRewardsTransaction({
        uid: referrerUserId,
        delta: 0,
        type: 'referral_bonus',
        description: `Tier upgraded to ${referrerNewTier} (referral bonus)`,
        metadata: { 
          tierChange: { from: referrerProfile.tier, to: referrerNewTier },
          referralBonus: true
        },
        createdAt: Date.now()
      });
    }

    if (newUserTierChanged) {
      await createRewardsTransaction({
        uid: newUserId,
        delta: 0,
        type: 'referral_bonus',
        description: `Tier upgraded to ${newUserNewTier} (welcome bonus)`,
        metadata: { 
          tierChange: { from: newUserProfile.tier, to: newUserNewTier },
          welcomeBonus: true
        },
        createdAt: Date.now()
      });
    }

    console.log(`Referral bonus processed: ${referrerUserId} referred ${newUserId} with code ${referralCode}`);

    return {
      success: true,
      referrer: {
        userId: referrerUserId,
        bonusPoints: REFERRAL_BONUS_REFERRER,
        newBalance: referrerNewPoints,
        newTier: referrerNewTier,
        tierChanged: referrerTierChanged,
        transactionId: referrerTransactionId
      },
      referee: {
        userId: newUserId,
        bonusPoints: REFERRAL_BONUS_REFEREE,
        newBalance: newUserNewPoints,
        newTier: newUserNewTier,
        tierChanged: newUserTierChanged,
        transactionId: newUserTransactionId
      }
    };

  } catch (error) {
    console.error('Error in processReferralBonus:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', 'Internal server error');
  }
});

export const getReferralCode = functions.https.onCall(async (data: GetReferralCodeRequest, context) => {
  try {
    // Validate authentication
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }

    const { userId } = data;

    // Validate input
    if (!userId) {
      throw new functions.https.HttpsError('invalid-argument', 'userId is required');
    }

    // Validate user is requesting their own referral code or is admin
    if (context.auth.uid !== userId) {
      // Check if user is admin (simplified check)
      const user = await admin.auth().getUser(context.auth.uid);
      if (!user.customClaims?.admin) {
        throw new functions.https.HttpsError('permission-denied', 'Can only get your own referral code');
      }
    }

    // Get or create user profile
    const { profile } = await getOrCreateRewardsProfile(userId);

    // Generate referral code if doesn't exist
    if (!profile.referralCode) {
      const referralCode = generateReferralCode(userId);
      
      await updateRewardsProfile(userId, {
        referralCode
      });

      return {
        success: true,
        referralCode,
        generated: true
      };
    }

    return {
      success: true,
      referralCode: profile.referralCode,
      generated: false
    };

  } catch (error) {
    console.error('Error in getReferralCode:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', 'Internal server error');
  }
});