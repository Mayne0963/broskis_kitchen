import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { checkRateLimit, userExists } from '../rewards/utils';

interface ElevateUserRequest {
  targetUid: string;
}

interface ElevateUserResponse {
  success: boolean;
  targetUid: string;
  updatedClaims?: Record<string, any>;
  message?: string;
}

// Secure callable function to elevate a user's privileges to admin
export const elevateUserToAdmin = functions
  .region('us-central1')
  .runWith({ enforceAppCheck: true, timeoutSeconds: 60, memory: '256MB' })
  .https.onCall(async (data: ElevateUserRequest, context): Promise<ElevateUserResponse> => {
    try {
      // Authentication required
      if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
      }

      const requesterUid = context.auth.uid;
      const requesterClaims = context.auth.token as Record<string, any>;
      const isRequesterAdmin = requesterClaims?.admin === true || requesterClaims?.role === 'admin';
      if (!isRequesterAdmin) {
        throw new functions.https.HttpsError('permission-denied', 'Admin privileges required');
      }

      // Input validation
      if (!data || typeof data.targetUid !== 'string') {
        throw new functions.https.HttpsError('invalid-argument', 'targetUid must be a string');
      }

      const targetUid = data.targetUid.trim();
      if (targetUid.length < 6 || targetUid.length > 128) {
        throw new functions.https.HttpsError('invalid-argument', 'Invalid targetUid length');
      }

      // Rate limit per requester to prevent abuse
      const allowed = checkRateLimit(`elevate:${requesterUid}`, 5, 60 * 1000);
      if (!allowed) {
        throw new functions.https.HttpsError('resource-exhausted', 'Rate limit exceeded, try again later');
      }

      // Ensure target user exists
      const exists = await userExists(targetUid);
      if (!exists) {
        throw new functions.https.HttpsError('not-found', 'Target user not found');
      }

      // Read existing claims and merge with admin role
      const user = await admin.auth().getUser(targetUid);
      const existingClaims = user.customClaims || {};
      const updatedClaims = { ...existingClaims, admin: true, role: 'admin' };

      await admin.auth().setCustomUserClaims(targetUid, updatedClaims);

      // Audit log
      const db = admin.firestore();
      await db.collection('adminLogs').add({
        type: 'elevateUserToAdmin',
        targetUid,
        requesterUid,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
        requesterClaims: { admin: requesterClaims?.admin === true, role: requesterClaims?.role || null },
      });

      functions.logger.info('Admin elevation completed', { targetUid, requesterUid });

      return { success: true, targetUid, updatedClaims, message: 'User elevated to admin' };
    } catch (error: any) {
      // Map errors to HttpsError if not already one
      if (error instanceof functions.https.HttpsError) {
        throw error;
      }
      functions.logger.error('Admin elevation failed', { error: error?.message || error });
      throw new functions.https.HttpsError('internal', 'Unexpected error during admin elevation');
    }
  });