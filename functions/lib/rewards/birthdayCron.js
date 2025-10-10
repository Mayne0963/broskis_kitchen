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
exports.birthdayCron = void 0;
const functions = __importStar(require("firebase-functions"));
const admin = __importStar(require("firebase-admin"));
const utils_1 = require("./utils");
const BIRTHDAY_BONUS_POINTS = 100;
exports.birthdayCron = functions.pubsub.schedule('0 9 * * *') // Run daily at 9 AM
    .timeZone('America/New_York')
    .onRun(async (context) => {
    try {
        const db = admin.firestore();
        const today = new Date();
        const todayString = `${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
        console.log(`Running birthday cron for date: ${todayString}`);
        // Query users with birthdays today
        const usersSnapshot = await db.collection('rewardsProfiles')
            .where('birthday', '==', todayString)
            .get();
        if (usersSnapshot.empty) {
            console.log('No users with birthdays today');
            return null;
        }
        const birthdayUsers = usersSnapshot.docs;
        console.log(`Found ${birthdayUsers.length} users with birthdays today`);
        const results = [];
        for (const userDoc of birthdayUsers) {
            try {
                const profile = userDoc.data();
                const userId = userDoc.id;
                // Check if birthday bonus was already given this year
                const currentYear = today.getFullYear();
                const lastBirthdayBonus = profile.lastBirthdayBonus;
                if (lastBirthdayBonus && new Date(lastBirthdayBonus).getFullYear() === currentYear) {
                    console.log(`Birthday bonus already given this year for user ${userId}`);
                    continue;
                }
                // Calculate new values
                const newPoints = profile.points + BIRTHDAY_BONUS_POINTS;
                const newLifetimePoints = profile.lifetimePoints + BIRTHDAY_BONUS_POINTS;
                const newTier = (0, utils_1.calculateTier)(newLifetimePoints);
                const tierChanged = newTier !== profile.tier;
                // Update profile
                await (0, utils_1.updateRewardsProfile)(userId, {
                    points: newPoints,
                    lifetimePoints: newLifetimePoints,
                    tier: newTier,
                    lastBirthdayBonus: Date.now()
                });
                // Create transaction record
                const transaction = {
                    uid: userId,
                    delta: BIRTHDAY_BONUS_POINTS,
                    type: 'birthday_bonus',
                    description: `Happy Birthday! Bonus points awarded`,
                    metadata: {
                        birthdayDate: todayString,
                        year: currentYear,
                        tierChanged
                    },
                    createdAt: Date.now()
                };
                const transactionId = await (0, utils_1.createRewardsTransaction)(transaction);
                // Log tier change if applicable
                if (tierChanged) {
                    console.log(`Birthday bonus caused user ${userId} tier change from ${profile.tier} to ${newTier}`);
                    await (0, utils_1.createRewardsTransaction)({
                        uid: userId,
                        delta: 0,
                        type: 'birthday_bonus',
                        description: `Tier upgraded to ${newTier} (birthday bonus)`,
                        metadata: {
                            tierChange: { from: profile.tier, to: newTier },
                            birthdayBonus: true
                        },
                        createdAt: Date.now()
                    });
                }
                // Optional: Send birthday email/notification
                const userEmail = await (0, utils_1.getUserEmail)(userId);
                if (userEmail) {
                    // Here you could integrate with email service
                    console.log(`Birthday bonus awarded to ${userEmail}: ${BIRTHDAY_BONUS_POINTS} points`);
                }
                results.push({
                    userId,
                    email: userEmail,
                    pointsAwarded: BIRTHDAY_BONUS_POINTS,
                    newBalance: newPoints,
                    tierChanged,
                    newTier,
                    transactionId
                });
            }
            catch (userError) {
                console.error(`Error processing birthday bonus for user ${userDoc.id}:`, userError);
                results.push({
                    userId: userDoc.id,
                    error: (userError === null || userError === void 0 ? void 0 : userError.message) || 'Unknown error'
                });
            }
        }
        console.log(`Birthday cron completed. Processed ${results.length} users`);
        // Log summary to admin logs
        await db.collection('adminLogs').add({
            action: 'birthday_cron',
            date: todayString,
            usersProcessed: results.length,
            totalPointsAwarded: results.filter(r => !r.error).length * BIRTHDAY_BONUS_POINTS,
            results,
            timestamp: Date.now()
        });
        return {
            success: true,
            date: todayString,
            usersProcessed: results.length,
            results
        };
    }
    catch (error) {
        console.error('Error in birthday cron:', error);
        // Log error to admin logs
        const db = admin.firestore();
        await db.collection('adminLogs').add({
            action: 'birthday_cron_error',
            error: (error === null || error === void 0 ? void 0 : error.message) || 'Unknown error',
            timestamp: Date.now()
        });
        throw error;
    }
});
//# sourceMappingURL=birthdayCron.js.map