import { NextApiRequest, NextApiResponse } from 'next';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeFirebaseAdmin } from '../../../lib/firebase-admin';
import { verifyAuthToken } from '../../../lib/auth';
import { LoyaltyProfile, SpinHistory, PointsTransaction, UserTier } from '../../../types/rewards';

interface SpinResult {
  type: 'points' | 'discount' | 'free_item' | 'nothing';
  value: number;
  description: string;
  cogsValue: number;
}

interface SpinResponse {
  success: boolean;
  result: SpinResult;
  newBalance: number;
  nextSpinAvailable: Date;
}

// Spin wheel probabilities by tier
const SPIN_PROBABILITIES = {
  bronze: {
    nothing: 0.40,
    points_small: 0.35,
    points_medium: 0.15,
    discount_5: 0.08,
    free_side: 0.02
  },
  silver: {
    nothing: 0.30,
    points_small: 0.30,
    points_medium: 0.20,
    discount_5: 0.12,
    discount_10: 0.05,
    free_side: 0.03
  },
  gold: {
    nothing: 0.25,
    points_small: 0.25,
    points_medium: 0.25,
    discount_5: 0.10,
    discount_10: 0.08,
    free_side: 0.05,
    free_dessert: 0.02
  },
  platinum: {
    nothing: 0.20,
    points_small: 0.20,
    points_medium: 0.25,
    points_large: 0.10,
    discount_10: 0.10,
    discount_15: 0.05,
    free_side: 0.05,
    free_dessert: 0.03,
    free_burger: 0.02
  }
};

// Spin outcomes with COGS values
const SPIN_OUTCOMES = {
  nothing: { type: 'nothing' as const, value: 0, description: 'Better luck next time!', cogsValue: 0 },
  points_small: { type: 'points' as const, value: 25, description: '25 bonus points!', cogsValue: 0.25 },
  points_medium: { type: 'points' as const, value: 50, description: '50 bonus points!', cogsValue: 0.50 },
  points_large: { type: 'points' as const, value: 100, description: '100 bonus points!', cogsValue: 1.00 },
  discount_5: { type: 'discount' as const, value: 5, description: '5% off your next order!', cogsValue: 1.50 },
  discount_10: { type: 'discount' as const, value: 10, description: '10% off your next order!', cogsValue: 3.00 },
  discount_15: { type: 'discount' as const, value: 15, description: '15% off your next order!', cogsValue: 4.50 },
  free_side: { type: 'free_item' as const, value: 1, description: 'Free side with your next order!', cogsValue: 2.00 },
  free_dessert: { type: 'free_item' as const, value: 1, description: 'Free dessert with your next order!', cogsValue: 1.50 },
  free_burger: { type: 'free_item' as const, value: 1, description: 'Free burger with your next order!', cogsValue: 5.00 }
};

function selectSpinOutcome(tier: UserTier): SpinResult {
  const probabilities = SPIN_PROBABILITIES[tier];
  const random = Math.random();
  let cumulative = 0;
  
  for (const [outcome, probability] of Object.entries(probabilities)) {
    cumulative += probability;
    if (random <= cumulative) {
      return SPIN_OUTCOMES[outcome as keyof typeof SPIN_OUTCOMES];
    }
  }
  
  // Fallback to nothing
  return SPIN_OUTCOMES.nothing;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<SpinResponse | { error: string }>
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

    // Initialize Firebase Admin
    initializeFirebaseAdmin();
    const db = getFirestore();

    // Start a transaction to ensure data consistency
    const result = await db.runTransaction(async (transaction) => {
      // Get user's loyalty profile
      const loyaltyRef = db.collection('loyalty').doc(user.uid);
      const loyaltyDoc = await transaction.get(loyaltyRef);
      
      if (!loyaltyDoc.exists) {
        throw new Error('User loyalty profile not found');
      }

      const loyaltyData = loyaltyDoc.data() as LoyaltyProfile;

      // Check if user can spin (once per day)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      const todaySpinsRef = db.collection('spinHistory')
        .where('userId', '==', user.uid)
        .where('spunAt', '>=', today)
        .where('spunAt', '<', tomorrow);
      
      const todaySpinsSnapshot = await todaySpinsRef.get();
      
      if (todaySpinsSnapshot.size >= 1) {
        throw new Error('Daily spin limit reached. Come back tomorrow!');
      }

      // Check COGS limits for the day
      const todaySpinsData = todaySpinsSnapshot.docs.map(doc => doc.data() as SpinHistory);
      const todayCogsValue = todaySpinsData.reduce((total, spin) => total + (spin.cogsValue || 0), 0);
      
      // Select spin outcome
      const spinResult = selectSpinOutcome(loyaltyData.tier);
      
      // Check if this spin would exceed daily COGS limit ($50 per day)
      if (todayCogsValue + spinResult.cogsValue > 50) {
        // Force a "nothing" result if it would exceed limits
        spinResult.type = 'nothing';
        spinResult.value = 0;
        spinResult.description = 'Better luck next time!';
        spinResult.cogsValue = 0;
      }

      // Create spin history record
      const spinId = db.collection('spinHistory').doc().id;
      const spinHistory: SpinHistory = {
        id: spinId,
        userId: user.uid,
        result: spinResult.type,
        value: spinResult.value,
        description: spinResult.description,
        cogsValue: spinResult.cogsValue,
        userTier: loyaltyData.tier,
        spunAt: new Date()
      };

      let newBalance = loyaltyData.currentPoints;
      let transactionId: string | null = null;

      // Process the spin result
      if (spinResult.type === 'points' && spinResult.value > 0) {
        // Award points
        newBalance += spinResult.value;
        
        // Create points transaction
        transactionId = db.collection('pointsTransactions').doc().id;
        const pointsTransaction: PointsTransaction = {
          id: transactionId,
          userId: user.uid,
          type: 'earned',
          points: spinResult.value,
          description: `Spin wheel bonus: ${spinResult.description}`,
          relatedOrderId: null,
          relatedRedemptionId: null,
          createdAt: new Date(),
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000), // 1 year
          metadata: {
            source: 'spin_wheel',
            spinId: spinId
          }
        };
        
        transaction.set(db.collection('pointsTransactions').doc(transactionId), pointsTransaction);
        
        // Update loyalty profile
        transaction.update(loyaltyRef, {
          currentPoints: newBalance,
          totalPointsEarned: loyaltyData.totalPointsEarned + spinResult.value,
          lastActivity: new Date()
        });
      } else {
        // For discounts and free items, just update last activity
        transaction.update(loyaltyRef, {
          lastActivity: new Date()
        });
      }

      // Save spin history
      transaction.set(db.collection('spinHistory').doc(spinId), spinHistory);

      // Calculate next spin availability (tomorrow)
      const nextSpinAvailable = new Date(tomorrow);

      return {
        result: spinResult,
        newBalance,
        nextSpinAvailable
      };
    });

    return res.status(200).json({
      success: true,
      ...result
    });

  } catch (error) {
    console.error('Error processing spin:', error);
    
    if (error instanceof Error) {
      return res.status(400).json({ error: error.message });
    }
    
    return res.status(500).json({ error: 'Internal server error' });
  }
}