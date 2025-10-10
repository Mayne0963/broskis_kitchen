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

async function testUserSignup() {
  console.log('🧪 Testing User Signup and Points Award...\n');
  
  const testEmail = `test-user-${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';
  let testUserId = null;
  
  try {
    // Step 1: Create test user
    console.log('📝 Creating test user...');
    const userRecord = await admin.auth().createUser({
      email: testEmail,
      password: testPassword,
      displayName: 'Test User'
    });
    testUserId = userRecord.uid;
    console.log(`✅ User created with UID: ${testUserId}`);
    
    // Step 2: Simulate signup bonus (100 points)
    console.log('\n💰 Adding signup bonus (+100 points)...');
    
    const batch = db.batch();
    
    // Create user document
    const userRef = db.collection('users').doc(testUserId);
    batch.set(userRef, {
      email: testEmail,
      displayName: 'Test User',
      totalPoints: 100,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });
    
    // Create rewards ledger entry
    const ledgerRef = db.collection('rewards_ledger').doc();
    batch.set(ledgerRef, {
      userId: testUserId,
      type: 'signup_bonus',
      points: 100,
      description: 'Welcome bonus for new user signup',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      metadata: {
        source: 'test_script',
        userEmail: testEmail
      }
    });
    
    await batch.commit();
    console.log('✅ Signup bonus applied successfully');
    
    // Step 3: Verify user document
    console.log('\n🔍 Verifying user document...');
    const userDoc = await userRef.get();
    if (!userDoc.exists) {
      throw new Error('User document not found');
    }
    
    const userData = userDoc.data();
    console.log(`✅ User document exists with ${userData.totalPoints} points`);
    
    if (userData.totalPoints !== 100) {
      throw new Error(`Expected 100 points, got ${userData.totalPoints}`);
    }
    
    // Step 4: Verify rewards ledger entry
    console.log('\n📊 Verifying rewards ledger...');
    const ledgerQuery = await db.collection('rewards_ledger')
      .where('userId', '==', testUserId)
      .where('type', '==', 'signup_bonus')
      .get();
    
    if (ledgerQuery.empty) {
      throw new Error('Rewards ledger entry not found');
    }
    
    const ledgerData = ledgerQuery.docs[0].data();
    console.log(`✅ Ledger entry found with ${ledgerData.points} points`);
    
    if (ledgerData.points !== 100) {
      throw new Error(`Expected 100 points in ledger, got ${ledgerData.points}`);
    }
    
    console.log('\n🎉 USER SIGNUP TEST PASSED!');
    console.log('✅ User created successfully');
    console.log('✅ 100 points awarded');
    console.log('✅ User document verified');
    console.log('✅ Rewards ledger entry verified');
    
    return {
      success: true,
      userId: testUserId,
      email: testEmail,
      points: userData.totalPoints
    };
    
  } catch (error) {
    console.error('\n❌ USER SIGNUP TEST FAILED!');
    console.error('Error:', error.message);
    return {
      success: false,
      error: error.message,
      userId: testUserId
    };
  } finally {
    // Cleanup: Delete test user
    if (testUserId) {
      try {
        console.log('\n🧹 Cleaning up test user...');
        await admin.auth().deleteUser(testUserId);
        await db.collection('users').doc(testUserId).delete();
        
        // Delete ledger entries
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
testUserSignup()
  .then(result => {
    console.log('\n📋 Test Result:', result);
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  });