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
exports.elevateUserToAdmin = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const utils_1 = require("../rewards/utils");
// Secure callable function to elevate a user's privileges to admin
exports.elevateUserToAdmin = functions
    .region('us-central1')
    .runWith({ enforceAppCheck: true, timeoutSeconds: 60, memory: '256MB' })
    .https.onCall(async (data, context) => {
    try {
        // Authentication required
        if (!context.auth) {
            throw new functions.https.HttpsError('unauthenticated', 'Authentication required');
        }
        const requesterUid = context.auth.uid;
        const requesterClaims = context.auth.token;
        const isRequesterAdmin = (requesterClaims === null || requesterClaims === void 0 ? void 0 : requesterClaims.admin) === true || (requesterClaims === null || requesterClaims === void 0 ? void 0 : requesterClaims.role) === 'admin';
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
        const allowed = (0, utils_1.checkRateLimit)(`elevate:${requesterUid}`, 5, 60 * 1000);
        if (!allowed) {
            throw new functions.https.HttpsError('resource-exhausted', 'Rate limit exceeded, try again later');
        }
        // Ensure target user exists
        const exists = await (0, utils_1.userExists)(targetUid);
        if (!exists) {
            throw new functions.https.HttpsError('not-found', 'Target user not found');
        }
        // Read existing claims and merge with admin role
        const user = await admin.auth().getUser(targetUid);
        const existingClaims = user.customClaims || {};
        const updatedClaims = Object.assign(Object.assign({}, existingClaims), { admin: true, role: 'admin' });
        await admin.auth().setCustomUserClaims(targetUid, updatedClaims);
        // Audit log
        const db = admin.firestore();
        await db.collection('adminLogs').add({
            type: 'elevateUserToAdmin',
            targetUid,
            requesterUid,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            requesterClaims: { admin: (requesterClaims === null || requesterClaims === void 0 ? void 0 : requesterClaims.admin) === true, role: (requesterClaims === null || requesterClaims === void 0 ? void 0 : requesterClaims.role) || null },
        });
        functions.logger.info('Admin elevation completed', { targetUid, requesterUid });
        return { success: true, targetUid, updatedClaims, message: 'User elevated to admin' };
    }
    catch (error) {
        // Map errors to HttpsError if not already one
        if (error instanceof functions.https.HttpsError) {
            throw error;
        }
        functions.logger.error('Admin elevation failed', { error: (error === null || error === void 0 ? void 0 : error.message) || error });
        throw new functions.https.HttpsError('internal', 'Unexpected error during admin elevation');
    }
});
//# sourceMappingURL=elevateUser.js.map