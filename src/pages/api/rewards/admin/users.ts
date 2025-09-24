import { NextApiRequest, NextApiResponse } from 'next';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';
import { initializeFirebaseAdmin } from '../../../../lib/firebase-admin';
import { verifyAdminToken } from '../../../../lib/auth';
import { LoyaltyProfile, PointsTransaction } from '../../../../types/rewards';

interface UserManagementRequest {
  action: 'get' | 'update' | 'adjustPoints' | 'setTier' | 'ban' | 'unban';
  userId?: string;
  data?: {
    points?: number;
    tier?: 'bronze' | 'silver' | 'gold' | 'platinum';
    reason?: string;
    banned?: boolean;
  };
}

interface UserDetails extends LoyaltyProfile {
  email?: string;
  displayName?: string;
  photoURL?: string;
  emailVerified?: boolean;
  disabled?: boolean;
  creationTime?: string;
  lastSignInTime?: string;
  recentTransactions?: PointsTransaction[];
  totalEarned?: number;
  totalSpent?: number;
  totalRedemptions?: number;
}

interface UsersListResponse {
  users: UserDetails[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    hasMore: boolean;
  };
}

interface UserActionResponse {
  success: boolean;
  message: string;
  user?: UserDetails;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<UsersListResponse | UserDetails | UserActionResponse | { error: string }>
) {
  try {
    // Verify admin authentication
    const admin = await verifyAdminToken(req);
    if (!admin) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Initialize Firebase Admin
    initializeFirebaseAdmin();
    const db = getFirestore();
    const auth = getAuth();

    if (req.method === 'GET') {
      // Get users list or specific user
      const {
        userId,
        page = '1',
        limit = '20',
        tier,
        search,
        sortBy = 'lastActivity',
        sortOrder = 'desc'
      } = req.query;

      if (userId && typeof userId === 'string') {
        // Get specific user details
        try {
          const [loyaltyDoc, userRecord] = await Promise.all([
            db.collection('loyalty').doc(userId).get(),
            auth.getUser(userId)
          ]);

          if (!loyaltyDoc.exists) {
            return res.status(404).json({ error: 'User not found' });
          }

          const loyaltyData = loyaltyDoc.data() as LoyaltyProfile;

          // Get recent transactions
          const transactionsSnapshot = await db.collection('pointsTransactions')
            .where('userId', '==', userId)
            .orderBy('createdAt', 'desc')
            .limit(10)
            .get();

          const recentTransactions: PointsTransaction[] = [];
          transactionsSnapshot.forEach(doc => {
            recentTransactions.push(doc.data() as PointsTransaction);
          });

          // Calculate totals
          const allTransactionsSnapshot = await db.collection('pointsTransactions')
            .where('userId', '==', userId)
            .get();

          let totalEarned = 0;
          let totalSpent = 0;
          allTransactionsSnapshot.forEach(doc => {
            const transaction = doc.data() as PointsTransaction;
            if (transaction.type === 'earned') {
              totalEarned += transaction.points;
            } else if (transaction.type === 'redeemed') {
              totalSpent += Math.abs(transaction.points);
            }
          });

          // Get total redemptions count
          const redemptionsSnapshot = await db.collection('userRedemptions')
            .where('userId', '==', userId)
            .get();

          const userDetails: UserDetails = {
            ...loyaltyData,
            email: userRecord.email,
            displayName: userRecord.displayName,
            photoURL: userRecord.photoURL,
            emailVerified: userRecord.emailVerified,
            disabled: userRecord.disabled,
            creationTime: userRecord.metadata.creationTime,
            lastSignInTime: userRecord.metadata.lastSignInTime,
            recentTransactions,
            totalEarned,
            totalSpent,
            totalRedemptions: redemptionsSnapshot.size
          };

          return res.status(200).json(userDetails);
        } catch (error) {
          console.error('Error fetching user details:', error);
          return res.status(404).json({ error: 'User not found' });
        }
      } else {
        // Get users list
        const pageNum = parseInt(page as string, 10);
        const limitNum = Math.min(parseInt(limit as string, 10), 100);
        const offset = (pageNum - 1) * limitNum;

        let loyaltyQuery = db.collection('loyalty');

        // Apply tier filter
        if (tier && typeof tier === 'string') {
          loyaltyQuery = loyaltyQuery.where('tier', '==', tier);
        }

        // Apply sorting
        const validSortFields = ['lastActivity', 'currentPoints', 'totalPointsEarned', 'createdAt'];
        const sortField = validSortFields.includes(sortBy as string) ? sortBy as string : 'lastActivity';
        const order = sortOrder === 'asc' ? 'asc' : 'desc';
        
        loyaltyQuery = loyaltyQuery.orderBy(sortField, order);

        const loyaltySnapshot = await loyaltyQuery.get();
        const allUsers: LoyaltyProfile[] = [];
        loyaltySnapshot.forEach(doc => {
          allUsers.push({ ...doc.data() as LoyaltyProfile, userId: doc.id });
        });

        // Apply search filter (client-side for simplicity)
        let filteredUsers = allUsers;
        if (search && typeof search === 'string') {
          const searchLower = search.toLowerCase();
          filteredUsers = allUsers.filter(user => 
            user.userId.toLowerCase().includes(searchLower) ||
            user.tier.toLowerCase().includes(searchLower)
          );
        }

        // Apply pagination
        const total = filteredUsers.length;
        const paginatedUsers = filteredUsers.slice(offset, offset + limitNum);
        const hasMore = offset + limitNum < total;

        // Enhance with auth data
        const enhancedUsers: UserDetails[] = [];
        for (const user of paginatedUsers) {
          try {
            const userRecord = await auth.getUser(user.userId);
            enhancedUsers.push({
              ...user,
              email: userRecord.email,
              displayName: userRecord.displayName,
              emailVerified: userRecord.emailVerified,
              disabled: userRecord.disabled,
              creationTime: userRecord.metadata.creationTime,
              lastSignInTime: userRecord.metadata.lastSignInTime
            });
          } catch (error) {
            // If user not found in auth, still include loyalty data
            enhancedUsers.push(user as UserDetails);
          }
        }

        return res.status(200).json({
          users: enhancedUsers,
          pagination: {
            page: pageNum,
            limit: limitNum,
            total,
            hasMore
          }
        });
      }
    }

    if (req.method === 'POST') {
      // Handle user management actions
      const { action, userId, data }: UserManagementRequest = req.body;

      if (!userId) {
        return res.status(400).json({ error: 'User ID is required' });
      }

      const loyaltyRef = db.collection('loyalty').doc(userId);
      const loyaltyDoc = await loyaltyRef.get();

      if (!loyaltyDoc.exists) {
        return res.status(404).json({ error: 'User not found' });
      }

      const loyaltyData = loyaltyDoc.data() as LoyaltyProfile;

      switch (action) {
        case 'adjustPoints': {
          if (!data?.points || !data?.reason) {
            return res.status(400).json({ error: 'Points amount and reason are required' });
          }

          const pointsAdjustment = data.points;
          const newBalance = Math.max(0, loyaltyData.currentPoints + pointsAdjustment);

          // Create transaction record
          const transactionId = `admin_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const transaction: PointsTransaction = {
            id: transactionId,
            userId,
            type: pointsAdjustment > 0 ? 'earned' : 'redeemed',
            points: Math.abs(pointsAdjustment),
            description: `Admin adjustment: ${data.reason}`,
            createdAt: new Date(),
            metadata: {
              adminId: admin.uid,
              adminEmail: admin.email,
              originalBalance: loyaltyData.currentPoints,
              newBalance,
              reason: data.reason
            }
          };

          // Update loyalty profile and create transaction
          await Promise.all([
            loyaltyRef.update({
              currentPoints: newBalance,
              lastActivity: new Date(),
              updatedAt: new Date()
            }),
            db.collection('pointsTransactions').doc(transactionId).set(transaction)
          ]);

          return res.status(200).json({
            success: true,
            message: `Points adjusted by ${pointsAdjustment}. New balance: ${newBalance}`,
            user: {
              ...loyaltyData,
              currentPoints: newBalance
            } as UserDetails
          });
        }

        case 'setTier': {
          if (!data?.tier) {
            return res.status(400).json({ error: 'Tier is required' });
          }

          const validTiers = ['bronze', 'silver', 'gold', 'platinum'];
          if (!validTiers.includes(data.tier)) {
            return res.status(400).json({ error: 'Invalid tier' });
          }

          await loyaltyRef.update({
            tier: data.tier,
            lastActivity: new Date(),
            updatedAt: new Date()
          });

          // Create transaction record for tier change
          const transactionId = `tier_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const transaction: PointsTransaction = {
            id: transactionId,
            userId,
            type: 'earned',
            points: 0,
            description: `Tier changed to ${data.tier} by admin${data.reason ? `: ${data.reason}` : ''}`,
            createdAt: new Date(),
            metadata: {
              adminId: admin.uid,
              adminEmail: admin.email,
              previousTier: loyaltyData.tier,
              newTier: data.tier,
              reason: data.reason
            }
          };

          await db.collection('pointsTransactions').doc(transactionId).set(transaction);

          return res.status(200).json({
            success: true,
            message: `User tier updated to ${data.tier}`,
            user: {
              ...loyaltyData,
              tier: data.tier
            } as UserDetails
          });
        }

        case 'ban':
        case 'unban': {
          const shouldBan = action === 'ban';
          
          try {
            await auth.updateUser(userId, {
              disabled: shouldBan
            });

            // Update loyalty profile
            await loyaltyRef.update({
              banned: shouldBan,
              lastActivity: new Date(),
              updatedAt: new Date()
            });

            // Create transaction record
            const transactionId = `${action}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const transaction: PointsTransaction = {
              id: transactionId,
              userId,
              type: 'earned',
              points: 0,
              description: `User ${shouldBan ? 'banned' : 'unbanned'} by admin${data?.reason ? `: ${data.reason}` : ''}`,
              createdAt: new Date(),
              metadata: {
                adminId: admin.uid,
                adminEmail: admin.email,
                action,
                reason: data?.reason
              }
            };

            await db.collection('pointsTransactions').doc(transactionId).set(transaction);

            return res.status(200).json({
              success: true,
              message: `User ${shouldBan ? 'banned' : 'unbanned'} successfully`,
              user: {
                ...loyaltyData,
                banned: shouldBan
              } as UserDetails
            });
          } catch (error) {
            console.error(`Error ${action} user:`, error);
            return res.status(500).json({ error: `Failed to ${action} user` });
          }
        }

        default:
          return res.status(400).json({ error: 'Invalid action' });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('Error in admin users API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}