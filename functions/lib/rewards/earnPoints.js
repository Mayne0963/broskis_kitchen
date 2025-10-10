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
exports.earnPoints = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const utils_1 = require("./utils");
exports.earnPoints = functions.https.onCall(async (data, context) => {
    try {
        // Validate authentication
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
        }
        const { userId, points, orderId, description = 'Points earned', metadata } = data;
        // Validate input
        if (!userId || !(0, utils_1.validatePointsAmount)(points)) {
            throw new functions.https.HttpsError('invalid-argument', 'Invalid userId or points amount');
        }
        // Rate limiting: 10 requests per minute per user
        const rateLimitKey = `earnPoints:${userId}`;
        if (!(0, utils_1.checkRateLimit)(rateLimitKey, 10, 60000)) {
            throw new functions.https.HttpsError('resource-exhausted', 'Rate limit exceeded');
        }
        // Check for duplicate order processing
        if (orderId) {
            const db = admin.firestore();
            const existingTransaction = await db.collection('rewardsTransactions')
                .where('orderId', '==', orderId)
                .where('type', '==', 'earned')
                .limit(1)
                .get();
            if (!existingTransaction.empty) {
                return {
                    success: true,
                    duplicate: true,
                    message: 'Points already awarded for this order'
                };
            }
        }
        // Get or create user profile
        const { profile } = await (0, utils_1.getOrCreateRewardsProfile)(userId);
        // Calculate new values
        const newPoints = profile.points + points;
        const newLifetimePoints = profile.lifetimePoints + points;
        const newTier = (0, utils_1.calculateTier)(newLifetimePoints);
        const tierChanged = newTier !== profile.tier;
        // Update profile
        await (0, utils_1.updateRewardsProfile)(userId, {
            points: newPoints,
            lifetimePoints: newLifetimePoints,
            tier: newTier
        });
        // Create transaction record
        const transaction = {
            uid: userId,
            delta: points,
            type: 'earned',
            description,
            orderId,
            metadata,
            createdAt: Date.now()
        };
        const transactionId = await (0, utils_1.createRewardsTransaction)(transaction);
        // Log tier change if applicable
        if (tierChanged) {
            console.log(`User ${userId} tier changed from ${profile.tier} to ${newTier}`);
            // Create tier change transaction
            await (0, utils_1.createRewardsTransaction)({
                uid: userId,
                delta: 0,
                type: 'earned',
                description: `Tier upgraded to ${newTier}`,
                metadata: { tierChange: { from: profile.tier, to: newTier } },
                createdAt: Date.now()
            });
        }
        return {
            success: true,
            transactionId,
            newBalance: newPoints,
            newLifetimePoints,
            newTier,
            tierChanged,
            pointsAwarded: points
        };
    }
    catch (error) {
        console.error('Error in earnPoints:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Internal server error');
    }
});
//# sourceMappingURL=earnPoints.js.map