import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import {
  updateRewardsProfile,
  createRewardsTransaction,
  calculateTier,
  getUserEmail,
  PointsTransaction
} from './utils';

const BIRTHDAY_BONUS_POINTS = 100;

export const birthdayCron = functions.pubsub.schedule('0 9 * * *') // Run daily at 9 AM
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
          const newTier = calculateTier(newLifetimePoints);
          const tierChanged = newTier !== profile.tier;

          // Update profile
          await updateRewardsProfile(userId, {
            points: newPoints,
            lifetimePoints: newLifetimePoints,
            tier: newTier,
            lastBirthdayBonus: Date.now()
          });

          // Create transaction record
          const transaction: PointsTransaction = {
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

          const transactionId = await createRewardsTransaction(transaction);

          // Log tier change if applicable
          if (tierChanged) {
            console.log(`Birthday bonus caused user ${userId} tier change from ${profile.tier} to ${newTier}`);
            
            await createRewardsTransaction({
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
          const userEmail = await getUserEmail(userId);
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

        } catch (userError: any) {
          console.error(`Error processing birthday bonus for user ${userDoc.id}:`, userError);
          results.push({
            userId: userDoc.id,
            error: userError?.message || 'Unknown error'
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

    } catch (error: any) {
      console.error('Error in birthday cron:', error);
      
      // Log error to admin logs
      const db = admin.firestore();
      await db.collection('adminLogs').add({
        action: 'birthday_cron_error',
        error: error?.message || 'Unknown error',
        timestamp: Date.now()
      });

      throw error;
    }
  });