"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminAdjustPoints = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const utils_1 = require("./utils");
exports.adminAdjustPoints = functions.https.onCall(async (data, context) => {
    try {
        // Validate authentication
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'Admin must be authenticated');
        }
        const adminUserId = context.auth.uid;
        // Validate admin permissions
        if (!(await (0, utils_1.isAdmin)(adminUserId))) {
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
        if (!(await (0, utils_1.userExists)(targetUserId))) {
            throw new functions.https.HttpsError('not-found', 'Target user not found');
        }
        // Get target user profile
        const { profile } = await (0, utils_1.getOrCreateRewardsProfile)(targetUserId);
        // Calculate new values
        const newPoints = Math.max(0, profile.points + pointsDelta); // Ensure points don't go negative
        const newLifetimePoints = pointsDelta > 0
            ? profile.lifetimePoints + pointsDelta
            : profile.lifetimePoints; // Don't reduce lifetime points for negative adjustments
        const newTier = (0, utils_1.calculateTier)(newLifetimePoints);
        const tierChanged = newTier !== profile.tier;
        // Update profile
        await (0, utils_1.updateRewardsProfile)(targetUserId, {
            points: newPoints,
            lifetimePoints: newLifetimePoints,
            tier: newTier
        });
        // Create transaction record
        const transaction = {
            uid: targetUserId,
            delta: pointsDelta,
            type: 'admin_adjustment',
            description: `Admin adjustment: ${reason}`,
            adminId: adminUserId,
            metadata: Object.assign({ reason, adminId: adminUserId, originalBalance: profile.points }, metadata),
            createdAt: Date.now()
        };
        const transactionId = await (0, utils_1.createRewardsTransaction)(transaction);
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
            await (0, utils_1.createRewardsTransaction)({
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
    }
    catch (error) {
        console.error('Error in adminAdjustPoints:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Internal server error');
    }
});
//# sourceMappingURL=adminAdjustPoints.js.map