import { NextApiRequest, NextApiResponse } from 'next';
import { getFirestore } from 'firebase-admin/firestore';
import { initializeFirebaseAdmin } from '../../../lib/firebase-admin';
import { verifyAuthToken } from '../../../lib/auth';
import { RewardCatalog, LoyaltyProfile, UserTier } from '../../../types/rewards';

interface CatalogResponse {
  rewards: RewardCatalog[];
  userTier: UserTier;
  totalRewards: number;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CatalogResponse | { error: string }>
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

    // Get query parameters
    const { category, sortBy = 'pointsCost', order = 'asc' } = req.query;

    // Get user's loyalty profile to determine tier
    const loyaltyRef = db.collection('loyalty').doc(user.uid);
    const loyaltyDoc = await loyaltyRef.get();
    
    let userTier: UserTier = 'bronze';
    if (loyaltyDoc.exists) {
      const loyaltyData = loyaltyDoc.data() as LoyaltyProfile;
      userTier = loyaltyData.tier;
    }

    // Build query for reward catalog
    let query = db.collection('rewardCatalog')
      .where('isActive', '==', true);

    // Filter by category if specified
    if (category && typeof category === 'string') {
      query = query.where('category', '==', category);
    }

    // Apply tier restrictions
    const tierRestrictions = {
      bronze: ['bronze'],
      silver: ['bronze', 'silver'],
      gold: ['bronze', 'silver', 'gold'],
      platinum: ['bronze', 'silver', 'gold', 'platinum']
    };

    const allowedTiers = tierRestrictions[userTier] || ['bronze'];
    
    // Get all rewards first, then filter by tier in memory
    // (Firestore doesn't support array-contains-any with other where clauses efficiently)
    const rewardsSnapshot = await query.get();
    
    let rewards: RewardCatalog[] = [];
    
    rewardsSnapshot.forEach(doc => {
      const reward = { id: doc.id, ...doc.data() } as RewardCatalog;
      
      // Check tier restrictions
      if (!reward.tierRestrictions || reward.tierRestrictions.length === 0 || 
          reward.tierRestrictions.some(tier => allowedTiers.includes(tier))) {
        rewards.push(reward);
      }
    });

    // Apply sorting
    rewards.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (sortBy) {
        case 'pointsCost':
          aValue = a.pointsCost;
          bValue = b.pointsCost;
          break;
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'category':
          aValue = a.category;
          bValue = b.category;
          break;
        case 'sortOrder':
          aValue = a.sortOrder || 999;
          bValue = b.sortOrder || 999;
          break;
        default:
          aValue = a.sortOrder || 999;
          bValue = b.sortOrder || 999;
      }
      
      if (order === 'desc') {
        return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
      } else {
        return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
      }
    });

    // Apply tier-based discounts
    const tierDiscounts = {
      bronze: 0,
      silver: 0.05, // 5% discount
      gold: 0.10,   // 10% discount
      platinum: 0.15 // 15% discount
    };

    const discount = tierDiscounts[userTier] || 0;
    
    if (discount > 0) {
      rewards = rewards.map(reward => ({
        ...reward,
        pointsCost: Math.floor(reward.pointsCost * (1 - discount)),
        originalPointsCost: reward.pointsCost
      }));
    }

    return res.status(200).json({
      rewards,
      userTier,
      totalRewards: rewards.length
    });

  } catch (error) {
    console.error('Error fetching catalog:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}