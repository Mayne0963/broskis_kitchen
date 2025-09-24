import { NextApiRequest, NextApiResponse } from 'next';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeFirebaseAdmin } from '../../../lib/firebase-admin';
import { verifyAuthToken } from '../../../lib/auth';
import { LoyaltyProfile } from '../../../types/rewards';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method !== 'GET') {
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

    // Get user's loyalty profile
    const loyaltyRef = db.collection('loyalty').doc(user.uid);
    const loyaltyDoc = await loyaltyRef.get();

    if (!loyaltyDoc.exists) {
      // Create new loyalty profile if it doesn't exist
      const newProfile: LoyaltyProfile = {
        userId: user.uid,
        currentPoints: 0,
        totalPointsEarned: 0,
        totalPointsSpent: 0,
        tier: 'bronze',
        tierProgress: 0,
        nextTierThreshold: 500,
        joinDate: new Date(),
        lastActivity: new Date(),
        pointsExpiringNext30Days: 0,
        lifetimeSpent: 0,
        averageOrderValue: 0,
        visitCount: 0,
        lastVisit: null,
        preferences: {
          emailNotifications: true,
          smsNotifications: false,
          pushNotifications: true
        },
        achievements: [],
        referralCode: `BROSKI${user.uid.substring(0, 6).toUpperCase()}`,
        referredBy: null,
        referralCount: 0
      };

      await loyaltyRef.set(newProfile);
      
      return res.status(200).json({
        currentPoints: 0,
        tier: 'bronze',
        tierProgress: 0,
        nextTierThreshold: 500,
        pointsExpiringNext30Days: 0
      });
    }

    const loyaltyData = loyaltyDoc.data() as LoyaltyProfile;

    // Calculate points expiring in next 30 days
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);
    
    const transactionsRef = db.collection('pointsTransactions')
      .where('userId', '==', user.uid)
      .where('type', '==', 'earned')
      .where('expiresAt', '<=', thirtyDaysFromNow)
      .where('expiresAt', '>', new Date());
    
    const expiringTransactions = await transactionsRef.get();
    const pointsExpiringNext30Days = expiringTransactions.docs.reduce(
      (total, doc) => total + (doc.data().points || 0),
      0
    );

    // Update the expiring points in the loyalty profile
    await loyaltyRef.update({ pointsExpiringNext30Days });

    return res.status(200).json({
      currentPoints: loyaltyData.currentPoints,
      tier: loyaltyData.tier,
      tierProgress: loyaltyData.tierProgress,
      nextTierThreshold: loyaltyData.nextTierThreshold,
      pointsExpiringNext30Days
    });

  } catch (error) {
    console.error('Error fetching balance:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}