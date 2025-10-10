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

async function testAdminAdjustment() {
  console.log('🧪 Testing Admin Point Adjustment (+500 points)...\n');
  
  const testEmail = `admin-test-user-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  let testUserId = null;
  
  try {
    // Step 1: Create test user with initial points
    console.log('📝 Creating test user with initial points...');
    const userRecord = await admin.auth().createUser({
      email: testEmail,
      password: testPassword,
      displayName: 'Admin Test User'
    });
    testUserId = userRecord.uid;
    console.log(`✅ User created with UID: ${testUserId}`);
    
    // Set initial user data with 100 points
    const userRef = db.collection('users').doc(testUserId);
    await userRef.set({
      email: testEmail,
      displayName: 'Admin Test User',
      totalPoints: 100,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    console.log('✅ Initial user data set (100 points)');
    
    // Step 2: Perform admin adjustment (+500 points)
    console.log('\n💰 Performing admin adjustment (+500 points)...');
    
    const adjustmentAmount = 500;
    const adjustmentReason = 'Admin test adjustment - verification script';
    
    const batch = db.batch();
    
    // Update user's total points
    batch.update(userRef, {
      totalPoints: admin.firestore.FieldValue.increment(adjustmentAmount),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Create rewards ledger entry for the adjustment
    const ledgerRef = db.collection('rewards_ledger').doc();
    batch.set(ledgerRef, {
      userId: testUserId,
      type: 'admin_adjustment',
      points: adjustmentAmount,
      description: adjustmentReason,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      metadata: {
        source: 'admin_test_script',
        userEmail: testEmail,
        adjustedBy: 'system_admin'
      }
    });
    
    await batch.commit();
    console.log('✅ Admin adjustment applied successfully');
    
    // Step 3: Verify user's updated total points
    console.log('\n🔍 Verifying updated user points...');
    const updatedUserDoc = await userRef.get();
    if (!updatedUserDoc.exists) {
      throw new Error('User document not found after adjustment');
    }
    
    const updatedUserData = updatedUserDoc.data();
    const expectedTotal = 100 + adjustmentAmount; // 600 points
    console.log(`✅ User now has ${updatedUserData.totalPoints} points`);
    
    if (updatedUserData.totalPoints !== expectedTotal) {
      throw new Error(`Expected ${expectedTotal} points, got ${updatedUserData.totalPoints}`);
    }
    
    // Step 4: Verify rewards ledger entry
    console.log('\n📊 Verifying admin adjustment in rewards ledger...');
    const ledgerQuery = await db.collection('rewards_ledger')
      .where('userId', '==', testUserId)
      .where('type', '==', 'admin_adjustment')
      .get();
    
    if (ledgerQuery.empty) {
      throw new Error('Admin adjustment ledger entry not found');
    }
    
    const ledgerData = ledgerQuery.docs[0].data();
    console.log(`✅ Ledger entry found with ${ledgerData.points} points adjustment`);
    
    if (ledgerData.points !== adjustmentAmount) {
      throw new Error(`Expected ${adjustmentAmount} points in ledger, got ${ledgerData.points}`);
    }
    
    // Step 5: Verify total ledger balance matches user total
    console.log('\n🧮 Verifying ledger balance consistency...');
    const allLedgerEntries = await db.collection('rewards_ledger')
      .where('userId', '==', testUserId)
      .get();
    
    let totalLedgerPoints = 0;
    allLedgerEntries.docs.forEach(doc => {
      totalLedgerPoints += doc.data().points;
    });
    
    console.log(`✅ Total ledger points: ${totalLedgerPoints}`);
    console.log(`✅ User total points: ${updatedUserData.totalPoints}`);
    
    if (totalLedgerPoints !== updatedUserData.totalPoints) {
      throw new Error(`Ledger total (${totalLedgerPoints}) doesn't match user total (${updatedUserData.totalPoints})`);
    }
    
    console.log('\n🎉 ADMIN ADJUSTMENT TEST PASSED!');
    console.log('✅ User points updated correctly');
    console.log('✅ Admin adjustment recorded in ledger');
    console.log('✅ Ledger balance matches user total');
    console.log(`✅ Final balance: ${updatedUserData.totalPoints} points`);
    
    return {
      success: true,
      userId: testUserId,
      email: testEmail,
      initialPoints: 100,
      adjustmentAmount: adjustmentAmount,
      finalPoints: updatedUserData.totalPoints
    };
    
  } catch (error) {
    console.error('\n❌ ADMIN ADJUSTMENT TEST FAILED!');
    console.error('Error:', error.message);
    return {
      success: false,
      error: error.message,
      userId: testUserId
    };
  } finally {
    // Cleanup: Delete test user and data
    if (testUserId) {
      try {
        console.log('\n🧹 Cleaning up test user...');
        await admin.auth().deleteUser(testUserId);
        await db.collection('users').doc(testUserId).delete();
        
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
testAdminAdjustment()
  .then(result => {
    console.log('\n📋 Test Result:', result);
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  })