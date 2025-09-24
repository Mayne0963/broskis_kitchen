import { NextApiRequest, NextApiResponse } from 'next';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { initializeFirebaseAdmin } from '../../../lib/firebase-admin';
import { verifyAuthToken } from '../../../lib/auth';
import { RewardCatalog, LoyaltyProfile, UserRedemption, PointsTransaction, UserTier } from '../../../types/rewards';

interface RedeemRequest {
  rewardId: string;
  quantity?: number;
}

interface RedeemResponse {
  success: boolean;
  redemptionId: string;
  pointsDeducted: number;
  newBalance: number;
  estimatedCogsValue: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<RedeemResponse | { error: string }>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Verify authentication
    const user = await verifyAuthToken(req);
    if (!user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { rewardId, quantity = 1 }: RedeemRequest = req.body;

    if (!rewardId) {
      return res.status(400).json({ error: 'Reward ID is required' });
    }

    if (quantity < 1 || quantity > 10) {
      return res.status(400).json({ error: 'Quantity must be between 1 and 10' });
    }

    // Initialize Firebase Admin
    initializeFirebaseAdmin();
    const db = getFirestore();

    // Start a transaction to ensure data consistency
    const result = await db.runTransaction(async (transaction) => {
      // Get reward details
      const rewardRef = db.collection('rewardCatalog').doc(rewardId);
      const rewardDoc = await transaction.get(rewardRef);
      
      if (!rewardDoc.exists) {
        throw new Error('Reward not found');
      }

      const reward = rewardDoc.data() as RewardCatalog;
      
      if (!reward.isActive) {
        throw new Error('Reward is not available');
      }

      // Get user's loyalty profile
      const loyaltyRef = db.collection('loyalty').doc(user.uid);
      const loyaltyDoc = await transaction.get(loyaltyRef);
      
      if (!loyaltyDoc.exists) {
        throw new Error('User loyalty profile not found');
      }

      const loyaltyData = loyaltyDoc.data() as LoyaltyProfile;

      // Check tier restrictions
      if (reward.tierRestrictions && reward.tierRestrictions.length > 0) {
        const tierHierarchy: UserTier[] = ['bronze', 'silver', 'gold', 'platinum'];
        const userTierIndex = tierHierarchy.indexOf(loyaltyData.tier);
        const hasAccess = reward.tierRestrictions.some(requiredTier => {
          const requiredTierIndex = tierHierarchy.indexOf(requiredTier);
          return userTierIndex >= requiredTierIndex;
        });
        
        if (!hasAccess) {
          throw new Error('Insufficient tier level for this reward');
        }
      }

      // Apply tier-based discount
      const tierDiscounts = {
        bronze: 0,
        silver: 0.05,
        gold: 0.10,
        platinum: 0.15
      };
      
      const discount = tierDiscounts[loyaltyData.tier] || 0;
      const finalPointsCost = Math.floor(reward.pointsCost * (1 - discount)) * quantity;

      // Check if user has enough points
      if (loyaltyData.currentPoints < finalPointsCost) {
        throw new Error('Insufficient points');
      }

      // COGS validation - ensure we don't exceed 8% average giveback
      const estimatedCogsValue = (reward.maxCogsValue || 0) * quantity;
      
      // Get recent redemptions to calculate running average
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const recentRedemptionsRef = db.collection('userRedemptions')
        .where('redeemedAt', '>=', thirtyDaysAgo);
      
      const recentRedemptionsSnapshot = await recentRedemptionsRef.get();
      
      let totalCogsValue = estimatedCogsValue;
      let totalPointsRedeemed = finalPointsCost;
      
      recentRedemptionsSnapshot.forEach(doc => {
        const redemption = doc.data() as UserRedemption;
        totalCogsValue += redemption.estimatedCogsValue || 0;
        totalPointsRedeemed += redemption.pointsUsed;
      });
      
      // Calculate giveback percentage (assuming 1 point = $0.01)
      const totalDollarValue = totalPointsRedeemed * 0.01;
      const givebackPercentage = totalDollarValue > 0 ? (totalCogsValue / totalDollarValue) * 100 : 0;
      
      // Enforce 8% maximum giveback
      if (givebackPercentage > 8) {
        throw new Error('Redemption would exceed profit controls. Please try again later.');
      }

      // Check daily redemption limits
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const todayRedemptionsRef = db.collection('userRedemptions')
        .where('userId', '==', user.uid)
        .where('redeemedAt', '>=', today)
        .where('redeemedAt', '<', tomorrow);
      
      const todayRedemptionsSnapshot = await todayRedemptionsRef.get();
      
      if (todayRedemptionsSnapshot.size >= 5) {
        throw new Error('Daily redemption limit reached (5 per day)');
      }

      // Create redemption record
      const redemptionId = db.collection('userRedemptions').doc().id;
      const redemption: UserRedemption = {
        id: redemptionId,
        userId: user.uid,
        rewardId: reward.id,
        rewardName: reward.name,
        pointsUsed: finalPointsCost,
        quantity,
        status: 'pending',
        redeemedAt: new Date(),
        estimatedCogsValue,
        fulfillmentCode: `BROSKI${Date.now().toString().slice(-6)}`,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
        metadata: {
          userTier: loyaltyData.tier,
          discountApplied: discount,
          originalPointsCost: reward.pointsCost * quantity
        }
      };

      // Create points transaction record
      const transactionId = db.collection('pointsTransactions').doc().id;
      const pointsTransaction: PointsTransaction = {
        id: transactionId,
        userId: user.uid,
        type: 'redeemed',
        points: -finalPointsCost,
        description: `Redeemed: ${reward.name}${quantity > 1 ? ` (x${quantity})` : ''}`,
        relatedOrderId: null,
        relatedRedemptionId: redemptionId,
        createdAt: new Date(),
        expiresAt: null,
        metadata: {
          rewardId: reward.id,
          quantity,
          cogsValue: estimatedCogsValue
        }
      };

      // Update user's loyalty profile
      const newBalance = loyaltyData.currentPoints - finalPointsCost;
      const updatedLoyalty = {
        ...loyaltyData,
        currentPoints: newBalance,
        totalPointsSpent: loyaltyData.totalPointsSpent + finalPointsCost,
        lastActivity: new Date()
      };

      // Write all changes
      transaction.set(db.collection('userRedemptions').doc(redemptionId), redemption);
      transaction.set(db.collection('pointsTransactions').doc(transactionId), pointsTransaction);
      transaction.update(loyaltyRef, updatedLoyalty);

      return {
        redemptionId,
        pointsDeducted: finalPointsCost,
        newBalance,
        estimatedCogsValue
      };
    });

    return res.status(200).json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Error processing redemption:', error);
    
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    
    return res.status(500).json({ error: 'Internal server error' });
  }
}