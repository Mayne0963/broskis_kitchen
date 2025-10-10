require('dotenv').config();
const admin = require('firebase-admin');

// Initialize Firebase Admin SDK
if (!process.env.FIREBASE_SERVICE_ACCOUNT) {
  console.error('❌ FIREBASE_SERVICE_ACCOUNT environment variable not found');
  process.exit(1);
}

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
admin.initializeApp({ 
  credential: admin.credential.cert(serviceAccount),
  projectId: 'broskis-kitchen-44d2d'
});

const db = admin.firestore();

async function testPointRedemption() {
  console.log('🧪 Testing Point Redemption (1000 points)...\n');
  
  const testEmail = `redeem-test-user-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  let testUserId = null;
  let redemptionId = null;
  
  try {
    // Step 1: Create test user with sufficient points
    console.log('📝 Creating test user with 1500 points...');
    const userRecord = await admin.auth().createUser({
      email: testEmail,
      password: testPassword,
      displayName: 'Redeem Test User'
    });
    testUserId = userRecord.uid;
    console.log(`✅ User created with UID: ${testUserId}`);
    
    // Set initial user data with 1500 points (enough for 1000 point redemption)
    const userRef = db.collection('users').doc(testUserId);
    await userRef.set({
      email: testEmail,
      displayName: 'Redeem Test User',
      totalPoints: 1500,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('✅ Initial user data set (1500 points)');
    
    // Step 2: Perform point redemption (1000 points)
    console.log('\n🎁 Performing point redemption (1000 points)...');
    
    const redemptionAmount = 1000;
    const rewardType = 'test_reward';
    const rewardDescription = 'Test reward - $10 off next order';
    
    const batch = db.batch();
    
    // Create redemption document
    const redemptionRef = db.collection('redemptions').doc();
    redemptionId = redemptionRef.id;
    
    batch.set(redemptionRef, {
      userId: testUserId,
      userEmail: testEmail,
      pointsRedeemed: redemptionAmount,
      rewardType: rewardType,
      rewardDescription: rewardDescription,
      status: 'issued',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      metadata: {
        source: 'test_script',
        testRedemption: true
      }
    });
    
    // Update user's total points (subtract redeemed points)
    batch.update(userRef, {
      totalPoints: admin.firestore.FieldValue.increment(-redemptionAmount),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Create rewards ledger entry for the redemption
    const ledgerRef = db.collection('rewards_ledger').doc();
    batch.set(ledgerRef, {
      userId: testUserId,
      type: 'redemption',
      points: -redemptionAmount, // Negative for redemption
      description: `Redeemed: ${rewardDescription}`,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      metadata: {
        source: 'test_script',
        redemptionId: redemptionId,
        rewardType: rewardType
      }
    });
    
    await batch.commit();
    console.log('✅ Point redemption processed successfully');
    
    // Step 3: Verify redemption document
    console.log('\n🔍 Verifying redemption document...');
    const redemptionDoc = await redemptionRef.get();
    if (!redemptionDoc.exists) {
      throw new Error('Redemption document not found');
    }
    
    const redemptionData = redemptionDoc.data();
    console.log(`✅ Redemption document created with status: ${redemptionData.status}`);
    console.log(`✅ Points redeemed: ${redemptionData.pointsRedeemed}`);
    console.log(`✅ Reward: ${redemptionData.rewardDescription}`);
    
    if (redemptionData.status !== 'issued') {
      throw new Error(`Expected status 'issued', got '${redemptionData.status}'`);
    }
    
    if (redemptionData.pointsRedeemed !== redemptionAmount) {
      throw new Error(`Expected ${redemptionAmount} points redeemed, got ${redemptionData.pointsRedeemed}`);
    }
    
    // Step 4: Verify user's updated points
    console.log('\n💰 Verifying user\'s remaining points...');
    const updatedUserDoc = await userRef.get();
    if (!updatedUserDoc.exists) {
      throw new Error('User document not found after redemption');
    }
    
    const updatedUserData = updatedUserDoc.data();
    const expectedRemaining = 1500 - redemptionAmount; // 500 points
    console.log(`✅ User now has ${updatedUserData.totalPoints} points remaining`);
    
    if (updatedUserData.totalPoints !== expectedRemaining) {
      throw new Error(`Expected ${expectedRemaining} points remaining, got ${updatedUserData.totalPoints}`);
    }
    
    // Step 5: Verify rewards ledger entry
    console.log('\n📊 Verifying redemption in rewards ledger...');
    const ledgerQuery = await db.collection('rewards_ledger')
      .where('userId', '==', testUserId)
      .where('type', '==', 'redemption')
      .get();
    
    if (ledgerQuery.empty) {
      throw new Error('Redemption ledger entry not found');
    }
    
    const ledgerData = ledgerQuery.docs[0].data();
    console.log(`✅ Ledger entry found with ${Math.abs(ledgerData.points)} points redeemed`);
    
    if (ledgerData.points !== -redemptionAmount) {
      throw new Error(`Expected -${redemptionAmount} points in ledger, got ${ledgerData.points}`);
    }
    
    // Step 6: Verify redemption can be queried by user
    console.log('\n🔎 Verifying redemption query by user...');
    const userRedemptions = await db.collection('redemptions')
      .where('userId', '==', testUserId)
      .where('status', '==', 'issued')
      .get();
    
    if (userRedemptions.empty) {
      throw new Error('No issued redemptions found for user');
    }
    
    console.log(`✅ Found ${userRedemptions.size} issued redemption(s) for user`);
    
    console.log('\n🎉 POINT REDEMPTION TEST PASSED!');
    console.log('✅ Redemption document created with status "issued"');
    console.log('✅ User points deducted correctly');
    console.log('✅ Redemption recorded in ledger');
    console.log('✅ Redemption queryable by user');
    console.log(`✅ Redemption ID: ${redemptionId}`);
    
    return {
      success: true,
      userId: testUserId,
      email: testEmail,
      redemptionId: redemptionId,
      pointsRedeemed: redemptionAmount,
      remainingPoints: updatedUserData.totalPoints,
      status: redemptionData.status
    };
    
  } catch (error) {
    console.error('\n❌ POINT REDEMPTION TEST FAILED!');
    console.error('Error:', error.message);
    return {
      success: false,
      error: error.message,
      userId: testUserId,
      redemptionId: redemptionId
    };
  } finally {
    // Cleanup: Delete test user and data
    if (testUserId) {
      try {
        console.log('\n🧹 Cleaning up test user...');
        await admin.auth().deleteUser(testUserId);
        await db.collection('users').doc(testUserId).delete();
        
        // Delete redemption document
        if (redemptionId) {
          await db.collection('redemptions').doc(redemptionId).delete();
        }
        
        // Delete all ledger entries for this user
        const ledgerQuery = await db.collection('rewards_ledger')
          .where('userId', '==', testUserId)
          .get();
        
        const deletePromises = ledgerQuery.docs.map(doc => doc.ref.delete());
        await Promise.all(deletePromises);
        
        console.log('✅ Test user and data cleaned up');
      } catch (cleanupError) {
        console.error('⚠️ Cleanup error:', cleanupError.message);
      }
    }
  }
}

// Run the test
testPointRedemption()
  .then(result => {
    console.log('\n📋 Test Result:', result);
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });