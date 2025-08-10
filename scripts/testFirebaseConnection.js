// Firebase Connection Test Script
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
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

async function testFirebaseConnection() {
  console.log('🔥 Testing Firebase Connection...');
  console.log('Project ID:', firebaseConfig.projectId);
  
  try {
    // Initialize Firebase
    const app = initializeApp(firebaseConfig);
    const db = getFirestore(app);
    const auth = getAuth(app);
    
    console.log('✅ Firebase initialized successfully');
    
    // Test Firestore connection
    console.log('\n📊 Testing Firestore connection...');
    
    // Check if collections exist and have data
    const collections = ['orders', 'users', 'menuDrops', 'userRewards', 'userRedemptions', 'pointsTransactions', 'rewardOffers'];
    
    for (const collectionName of collections) {
      try {
        const collectionRef = collection(db, collectionName);
        const snapshot = await getDocs(collectionRef);
        console.log(`📁 ${collectionName}: ${snapshot.size} documents`);
        
        if (snapshot.size > 0) {
          const firstDoc = snapshot.docs[0];
          console.log(`   Sample data:`, Object.keys(firstDoc.data()).slice(0, 5));
        }
      } catch (error) {
        console.log(`❌ Error accessing ${collectionName}:`, error.message);
      }
    }
    
    // Test write permission
    console.log('\n✍️  Testing write permissions...');
    try {
      const testDoc = doc(db, 'test', 'connection-test');
      await setDoc(testDoc, {
        timestamp: new Date(),
        test: true
      });
      console.log('✅ Write test successful');
    } catch (error) {
      console.log('❌ Write test failed:', error.message);
    }
    
    console.log('\n🎯 Firebase connection test completed!');
    
  } catch (error) {
    console.error('❌ Firebase connection failed:', error);
    console.error('Config check:');
    Object.keys(firebaseConfig).forEach(key => {
      console.log(`  ${key}: ${firebaseConfig[key] ? '✅ Set' : '❌ Missing'}`);
    });
  }
}

testFirebaseConnection().catch(console.error);