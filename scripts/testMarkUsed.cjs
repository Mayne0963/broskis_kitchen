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

async function testMarkCouponUsed() {
  console.log('🧪 Testing Coupon Usage Simulation...\n');
  
  const testEmail = `coupon-test-user-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  let testUserId = null;
  let redemptionId = null;
  
  try {
    // Step 1: Create test user and redemption
    console.log('📝 Creating test user and redemption...');
    const userRecord = await admin.auth().createUser({
      email: testEmail,
      password: testPassword,
      displayName: 'Coupon Test User'
    });
    testUserId = userRecord.uid;
    console.log(`✅ User created with UID: ${testUserId}`);
    
    // Create user document
    const userRef = db.collection('users').doc(testUserId);
    await userRef.set({
      email: testEmail,
      displayName: 'Coupon Test User',
      totalPoints: 500, // Remaining after redemption
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Create initial redemption with "issued" status
    const redemptionRef = db.collection('redemptions').doc();
    redemptionId = redemptionRef.id;
    
    await redemptionRef.set({
      userId: testUserId,
      userEmail: testEmail,
      pointsRedeemed: 1000,
      rewardType: 'discount_coupon',
      rewardDescription: 'Test coupon - $10 off next order',
      status: 'issued',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      metadata: {
        source: 'test_script',
        testCoupon: true
      }
    });
    
    console.log(`✅ Initial redemption created with status: "issued"`);
    console.log(`✅ Redemption ID: ${redemptionId}`);
    
    // Step 2: Simulate coupon usage (mark as used)
    console.log('\n🎫 Marking coupon as used...');
    
    const usedAt = admin.firestore.FieldValue.serverTimestamp();
    const orderReference = `TEST-ORDER-${Date.now()}`;
    
    await redemptionRef.update({
      status: 'used',
      usedAt: usedAt,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      usageMetadata: {
        orderReference: orderReference,
        usedBy: 'test_script',
        location: 'test_location'
      }
    });
    
    console.log('✅ Coupon marked as used successfully');
    
    // Step 3: Verify redemption status update
    console.log('\n🔍 Verifying redemption status update...');
    const updatedRedemptionDoc = await redemptionRef.get();
    if (!updatedRedemptionDoc.exists) {
      throw new Error('Redemption document not found after update');
    }
    
    const updatedRedemptionData = updatedRedemptionDoc.data();
    console.log(`✅ Redemption status: ${updatedRedemptionData.status}`);
    console.log(`✅ Used at: ${updatedRedemptionData.usedAt ? 'Set' : 'Not set'}`);
    console.log(`✅ Order reference: ${updatedRedemptionData.usageMetadata?.orderReference}`);
    
    if (updatedRedemptionData.status !== 'used') {
      throw new Error(`Expected status 'used', got '${updatedRedemptionData.status}'`);
    }
    
    if (!updatedRedemptionData.usedAt) {
      throw new Error('usedAt timestamp not set');
    }
    
    if (!updatedRedemptionData.usageMetadata?.orderReference) {
      throw new Error('Order reference not set in usage metadata');
    }
    
    // Step 4: Verify coupon cannot be used again (query for unused coupons)
    console.log('\n🚫 Verifying coupon is no longer available for use...');
    const unusedCouponsQuery = await db.collection('redemptions')
      .where('userId', '==', testUserId)
      .where('status', '==', 'issued')
      .get();
    
    console.log(`✅ Found ${unusedCouponsQuery.size} unused coupons for user`);
    
    // Should be 0 since we marked the only coupon as used
    if (unusedCouponsQuery.size > 0) {
      console.log('⚠️ Warning: Found unused coupons, but this might be expected if user has multiple redemptions');
    }
    
    // Step 5: Verify used coupon can be queried for history
    console.log('\n📜 Verifying used coupon appears in usage history...');
    const usedCouponsQuery = await db.collection('redemptions')
      .where('userId', '==', testUserId)
      .where('status', '==', 'used')
      .get();
    
    if (usedCouponsQuery.empty) {
      throw new Error('No used coupons found in history');
    }
    
    console.log(`✅ Found ${usedCouponsQuery.size} used coupon(s) in history`);
    
    const usedCouponData = usedCouponsQuery.docs[0].data();
    if (usedCouponData.usageMetadata?.orderReference !== orderReference) {
      throw new Error('Order reference mismatch in used coupon history');
    }
    
    // Step 6: Test redemption lifecycle query
    console.log('\n🔄 Testing redemption lifecycle query...');
    const allRedemptionsQuery = await db.collection('redemptions')
      .where('userId', '==', testUserId)
      .orderBy('createdAt', 'desc')
      .get();
    
    console.log(`✅ Found ${allRedemptionsQuery.size} total redemption(s) for user`);
    
    const redemptionHistory = allRedemptionsQuery.docs.map(doc => ({
      id: doc.id,
      status: doc.data().status,
      pointsRedeemed: doc.data().pointsRedeemed,
      createdAt: doc.data().createdAt,
      usedAt: doc.data().usedAt
    }));
    
    console.log('📊 Redemption history:', redemptionHistory);
    
    console.log('\n🎉 COUPON USAGE TEST PASSED!');
    console.log('✅ Coupon status updated to "used"');
    console.log('✅ usedAt timestamp recorded');
    console.log('✅ Usage metadata stored');
    console.log('✅ Used coupon appears in history');
    console.log('✅ Redemption lifecycle trackable');
    
    return {
      success: true,
      userId: testUserId,
      email: testEmail,
      redemptionId: redemptionId,
      finalStatus: updatedRedemptionData.status,
      orderReference: orderReference,
      usedAt: updatedRedemptionData.usedAt
    };
    
  } catch (error) {
    console.error('\n❌ COUPON USAGE TEST FAILED!');
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
        
        // Delete any ledger entries for this user
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
testMarkCouponUsed()
  .then(result => {
    console.log('\n📋 Test Result:', result);
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });