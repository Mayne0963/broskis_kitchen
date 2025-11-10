import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Firebase Admin
admin.initializeApp();

// Import and export all reward functions
export { earnPoints } from './rewards/earnPoints';
export { redeemPoints } from './rewards/redeemPoints';
export { adminAdjustPoints } from './rewards/adminAdjustPoints';
export { birthdayCron } from './rewards/birthdayCron';
export { markCouponUsed, validateRedemptionCode } from './rewards/markCouponUsed';
export { processReferralBonus, getReferralCode } from './rewards/processReferralBonus';
// Admin functions
export { elevateUserToAdmin } from './admin/elevateUser';

// Health check function
export const healthCheck = functions.https.onRequest((req, res) => {
  res.status(200).json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    version: "1.0.0"
  });
});