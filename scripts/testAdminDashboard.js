// Test Admin Dashboard Real-time Data
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, onSnapshot } from 'firebase/firestore';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testAdminDashboardData() {
  console.log('🔍 Testing Admin Dashboard Data Access...');
  
  try {
    // Test menuDrops collection (should be accessible)
    console.log('\n📋 Testing menuDrops collection...');
    const menuDropsSnapshot = await getDocs(collection(db, 'menuDrops'));
    console.log(`✅ menuDrops: ${menuDropsSnapshot.size} documents found`);
    
    if (menuDropsSnapshot.size > 0) {
      menuDropsSnapshot.forEach(doc => {
        const data = doc.data();
        console.log(`  - ${data.name}: ${data.status} (${data.soldQuantity}/${data.totalQuantity})`);
      });
    }
    
    // Test real-time listener for menuDrops
    console.log('\n🔄 Testing real-time listener for menuDrops...');
    let listenerCount = 0;
    const unsubscribe = onSnapshot(collection(db, 'menuDrops'), (snapshot) => {
      listenerCount++;
      console.log(`📡 Real-time update #${listenerCount}: ${snapshot.size} menuDrops`);
      
      if (listenerCount >= 2) {
        unsubscribe();
        console.log('✅ Real-time listener working correctly!');
        
        // Test other collections that might be accessible
        testOtherCollections();
      }
    });
    
    // Trigger a small change to test real-time updates
    setTimeout(() => {
      console.log('🔄 Triggering listener test...');
    }, 1000);
    
  } catch (error) {
    console.error('❌ Error testing admin dashboard data:', error);
  }
}

async function testOtherCollections() {
  console.log('\n🔍 Testing other collections...');
  
  const collections = ['orders', 'users', 'userRewards', 'pointsTransactions', 'rewardOffers', 'userRedemptions'];
  
  for (const collectionName of collections) {
    try {
      const snapshot = await getDocs(collection(db, collectionName));
      console.log(`✅ ${collectionName}: ${snapshot.size} documents`);
    } catch (error) {
      console.log(`❌ ${collectionName}: ${error.message}`);
    }
  }
  
  console.log('\n🎯 Admin dashboard data test completed!');
  process.exit(0);
}

testAdminDashboardData().catch(console.error);