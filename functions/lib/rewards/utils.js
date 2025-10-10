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
exports.checkRateLimit = exports.isAdmin = exports.getUserEmail = exports.userExists = exports.validatePointsAmount = exports.generateReferralCode = exports.createRewardsTransaction = exports.updateRewardsProfile = exports.getOrCreateRewardsProfile = exports.calculateTier = exports.TIER_THRESHOLDS = void 0;
const admin = __importStar(require("firebase-admin"));
// Tier thresholds
exports.TIER_THRESHOLDS = {
    bronze: 0,
    silver: 500,
    gold: 1500,
    platinum: 3000
};
// Calculate user tier based on lifetime points
function calculateTier(lifetimePoints) {
    if (lifetimePoints >= exports.TIER_THRESHOLDS.platinum)
        return 'platinum';
    if (lifetimePoints >= exports.TIER_THRESHOLDS.gold)
        return 'gold';
    if (lifetimePoints >= exports.TIER_THRESHOLDS.silver)
        return 'silver';
    return 'bronze';
}
exports.calculateTier = calculateTier;
// Get or create rewards profile
async function getOrCreateRewardsProfile(uid) {
    const db = admin.firestore();
    const ref = db.collection('rewardsProfiles').doc(uid);
    const snap = await ref.get();
    if (snap.exists) {
        const data = snap.data();
        return { profile: data, created: false };
    }
    const now = Date.now();
    const profile = {
        uid,
        points: 0,
        lifetimePoints: 0,
        tier: 'bronze',
        createdAt: now,
        updatedAt: now,
    };
    await ref.set(profile);
    return { profile, created: true };
}
exports.getOrCreateRewardsProfile = getOrCreateRewardsProfile;
// Update rewards profile
async function updateRewardsProfile(uid, updates) {
    const db = admin.firestore();
    const ref = db.collection('rewardsProfiles').doc(uid);
    await ref.update(Object.assign(Object.assign({}, updates), { updatedAt: Date.now() }));
}
exports.updateRewardsProfile = updateRewardsProfile;
// Create rewards transaction
async function createRewardsTransaction(transaction) {
    const db = admin.firestore();
    const ref = await db.collection('rewardsTransactions').add(transaction);
    return ref.id;
}
exports.createRewardsTransaction = createRewardsTransaction;
// Generate unique referral code
function generateReferralCode(uid) {
    const timestamp = Date.now().toString(36);
    const randomPart = Math.random().toString(36).substring(2, 8);
    const uidPart = uid.substring(0, 4);
    return `${uidPart}${timestamp}${randomPart}`.toUpperCase();
}
exports.generateReferralCode = generateReferralCode;
// Validate points amount
function validatePointsAmount(points) {
    return Number.isInteger(points) && points > 0 && points <= 10000;
}
exports.validatePointsAmount = validatePointsAmount;
// Check if user exists
async function userExists(uid) {
    try {
        await admin.auth().getUser(uid);
        return true;
    }
    catch (error) {
        return false;
    }
}
exports.userExists = userExists;
// Get user email
async function getUserEmail(uid) {
    try {
        const user = await admin.auth().getUser(uid);
        return user.email || null;
    }
    catch (error) {
        return null;
    }
}
exports.getUserEmail = getUserEmail;
// Check if user is admin
async function isAdmin(uid) {
    var _a;
    try {
        const user = await admin.auth().getUser(uid);
        return ((_a = user.customClaims) === null || _a === void 0 ? void 0 : _a.admin) === true;
    }
    catch (error) {
        return false;
    }
}
exports.isAdmin = isAdmin;
// Rate limiting helper
const rateLimitMap = new Map();
function checkRateLimit(key, maxRequests, windowMs) {
    const now = Date.now();
    const record = rateLimitMap.get(key);
    if (!record || now > record.resetTime) {
        rateLimitMap.set(key, { count: 1, resetTime: now + windowMs });
        return true;
    }
    if (record.count >= maxRequests) {
        return false;
    }
    record.count++;
    return true;
}
exports.checkRateLimit = checkRateLimit;
//# sourceMappingURL=utils.js.map