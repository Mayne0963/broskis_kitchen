import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import {
  getOrCreateRewardsProfile,
  updateRewardsProfile,
  createRewardsTransaction,
  calculateTier,
  isAdmin,
  userExists,
  PointsTransaction
} from './utils';

interface AdminAdjustPointsRequest {
  targetUserId: string;
  pointsDelta: number; // Can be positive or negative
  reason: string;
  metadata?: any;
}

export const adminAdjustPoints = functions.https.onCall(async (data: AdminAdjustPointsRequest, context) => {
  try {
    // Validate authentication
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'Admin must be authenticated');
    }

    const adminUserId = context.auth.uid;

    // Validate admin permissions
    if (!(await isAdmin(adminUserId))) {
      throw new functions.https.HttpsError('permission-denied', 'Admin privileges required');
    }

    const { targetUserId, pointsDelta, reason, metadata } = data;

    // Validate input
    if (!targetUserId || !reason || !Number.isInteger(pointsDelta)) {
      throw new functions.https.HttpsError('invalid-argument', 'Invalid targetUserId, pointsDelta, or reason');
    }

    // Validate points delta is within reasonable bounds
    if (Math.abs(pointsDelta) > 10000) {
      throw new functions.https.HttpsError('invalid-argument', 'Points adjustment too large (max ±10,000)');
    }

    // Validate target user exists
    if (!(await userExists(targetUserId))) {
      throw new functions.https.HttpsError('not-found', 'Target user not found');
    }

    // Get target user profile
    const { profile } = await getOrCreateRewardsProfile(targetUserId);

    // Calculate new values
    const newPoints = Math.max(0, profile.points + pointsDelta); // Ensure points don't go negative
    const newLifetimePoints = pointsDelta > 0 
      ? profile.lifetimePoints + pointsDelta 
      : profile.lifetimePoints; // Don't reduce lifetime points for negative adjustments
    
    const newTier = calculateTier(newLifetimePoints);
    const tierChanged = newTier !== profile.tier;

    // Update profile
    await updateRewardsProfile(targetUserId, {
      points: newPoints,
      lifetimePoints: newLifetimePoints,
      tier: newTier
    });

    // Create transaction record
    const transaction: PointsTransaction = {
      uid: targetUserId,
      delta: pointsDelta,
      type: 'admin_adjustment',
      description: `Admin adjustment: ${reason}`,
      adminId: adminUserId,
      metadata: {
        reason,
        adminId: adminUserId,
        originalBalance: profile.points,
        ...metadata
      },
      createdAt: Date.now()
    };

    const transactionId = await createRewardsTransaction(transaction);

    // Log admin action
    const db = admin.firestore();
    await db.collection('adminLogs').add({
      adminId: adminUserId,
      action: 'points_adjustment',
      targetUserId,
      pointsDelta,
      reason,
      previousBalance: profile.points,
      newBalance: newPoints,
      tierChanged,
      timestamp: Date.now()
    });

    // Log tier change if applicable
    if (tierChanged) {
      console.log(`Admin ${adminUserId} adjustment caused user ${targetUserId} tier change from ${profile.tier} to ${newTier}`);
      
      // Create tier change transaction
      await createRewardsTransaction({
        uid: targetUserId,
        delta: 0,
        type: 'admin_adjustment',
        description: `Tier ${tierChanged ? 'upgraded' : 'changed'} to ${newTier} (admin action)`,
        adminId: adminUserId,
        metadata: { 
          tierChange: { from: profile.tier, to: newTier },
          adminAction: true
        },
        createdAt: Date.now()
      });
    }

    console.log(`Admin ${adminUserId} adjusted points for user ${targetUserId}: ${pointsDelta > 0 ? '+' : ''}${pointsDelta} (${reason})`);

    return {
      success: true,
      transactionId,
      targetUserId,
      pointsDelta,
      newBalance: newPoints,
      newLifetimePoints,
      newTier,
      tierChanged,
      reason
    };

  } catch (error) {
    console.error('Error in adminAdjustPoints:', error);
    
    if (error instanceof functions.https.HttpsError) {
      throw error;
    }
    
    throw new functions.https.HttpsError('internal', 'Internal server error');
  }
});