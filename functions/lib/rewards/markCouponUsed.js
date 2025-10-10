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
exports.validateRedemptionCode = exports.markCouponUsed = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const utils_1 = require("./utils");
exports.markCouponUsed = functions.https.onCall(async (data, context) => {
    try {
        // Validate authentication (admin or system)
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
        }
        const { redemptionCode, orderId, metadata } = data;
        // Validate input
        if (!redemptionCode || typeof redemptionCode !== 'string') {
            throw new functions.https.HttpsError('invalid-argument', 'Invalid redemption code');
        }
        // Rate limiting: 20 requests per minute (for high-volume restaurant usage)
        const rateLimitKey = `markCouponUsed:${context.auth.uid}`;
        if (!(0, utils_1.checkRateLimit)(rateLimitKey, 20, 60000)) {
            throw new functions.https.HttpsError('resource-exhausted', 'Rate limit exceeded');
        }
        const db = admin.firestore();
        // Find the redemption record
        const redemptionQuery = await db.collection('userRedemptions')
            .where('redemptionCode', '==', redemptionCode.toUpperCase())
            .limit(1)
            .get();
        if (redemptionQuery.empty) {
            throw new functions.https.HttpsError('not-found', 'Redemption code not found');
        }
        const redemptionDoc = redemptionQuery.docs[0];
        const redemption = redemptionDoc.data();
        // Check if already used
        if (redemption.status === 'used') {
            throw new functions.https.HttpsError('failed-precondition', 'Redemption code already used');
        }
        // Check if expired
        if (redemption.expiresAt && Date.now() > redemption.expiresAt) {
            throw new functions.https.HttpsError('failed-precondition', 'Redemption code expired');
        }
        // Mark as used
        await redemptionDoc.ref.update({
            status: 'used',
            usedAt: Date.now(),
            orderId,
            usedBy: context.auth.uid,
            metadata: Object.assign(Object.assign({}, redemption.metadata), metadata)
        });
        // Log the usage
        await db.collection('adminLogs').add({
            action: 'coupon_used',
            redemptionCode,
            redemptionId: redemptionDoc.id,
            userId: redemption.userId,
            rewardId: redemption.rewardId,
            rewardName: redemption.rewardName,
            pointsRedeemed: redemption.pointsRedeemed,
            orderId,
            usedBy: context.auth.uid,
            timestamp: Date.now()
        });
        console.log(`Redemption code ${redemptionCode} marked as used for order ${orderId || 'N/A'}`);
        return {
            success: true,
            redemptionId: redemptionDoc.id,
            userId: redemption.userId,
            rewardName: redemption.rewardName,
            pointsRedeemed: redemption.pointsRedeemed,
            usedAt: Date.now()
        };
    }
    catch (error) {
        console.error('Error in markCouponUsed:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Internal server error');
    }
});
exports.validateRedemptionCode = functions.https.onCall(async (data, context) => {
    try {
        // Validate authentication
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
        }
        const { redemptionCode } = data;
        // Validate input
        if (!redemptionCode || typeof redemptionCode !== 'string') {
            throw new functions.https.HttpsError('invalid-argument', 'Invalid redemption code');
        }
        // Rate limiting: 30 validations per minute
        const rateLimitKey = `validateRedemption:${context.auth.uid}`;
        if (!(0, utils_1.checkRateLimit)(rateLimitKey, 30, 60000)) {
            throw new functions.https.HttpsError('resource-exhausted', 'Rate limit exceeded');
        }
        const db = admin.firestore();
        // Find the redemption record
        const redemptionQuery = await db.collection('userRedemptions')
            .where('redemptionCode', '==', redemptionCode.toUpperCase())
            .limit(1)
            .get();
        if (redemptionQuery.empty) {
            return {
                valid: false,
                reason: 'not_found',
                message: 'Redemption code not found'
            };
        }
        const redemption = redemptionQuery.docs[0].data();
        // Check if already used
        if (redemption.status === 'used') {
            return {
                valid: false,
                reason: 'already_used',
                message: 'Redemption code already used',
                usedAt: redemption.usedAt
            };
        }
        // Check if expired
        if (redemption.expiresAt && Date.now() > redemption.expiresAt) {
            return {
                valid: false,
                reason: 'expired',
                message: 'Redemption code expired',
                expiresAt: redemption.expiresAt
            };
        }
        // Valid redemption
        return {
            valid: true,
            redemption: {
                id: redemptionQuery.docs[0].id,
                userId: redemption.userId,
                rewardId: redemption.rewardId,
                rewardName: redemption.rewardName,
                pointsRedeemed: redemption.pointsRedeemed,
                createdAt: redemption.createdAt,
                expiresAt: redemption.expiresAt
            }
        };
    }
    catch (error) {
        console.error('Error in validateRedemptionCode:', error);
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        throw new functions.https.HttpsError('internal', 'Internal server error');
    }
});
//# sourceMappingURL=markCouponUsed.js.map