// Seed script for reward catalog
// Run this script to populate the rewardCatalog collection with initial data

import { config } from 'dotenv';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';
import { RewardCatalog } from '../types/rewards';

// Load environment variables
config({ path: '.env.local' });

// Initialize Firebase with environment variables
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

// Initialize Firebase Admin SDK
if (!getApps().length) {
  console.log('Environment variables check:');
  console.log('FIREBASE_ADMIN_PROJECT_ID:', process.env.FIREBASE_ADMIN_PROJECT_ID);
  console.log('FIREBASE_ADMIN_CLIENT_EMAIL:', process.env.FIREBASE_ADMIN_CLIENT_EMAIL);
  console.log('FIREBASE_ADMIN_PRIVATE_KEY exists:', !!process.env.FIREBASE_ADMIN_PRIVATE_KEY);
  console.log('FIREBASE_ADMIN_PRIVATE_KEY length:', process.env.FIREBASE_ADMIN_PRIVATE_KEY?.length);
  
  const serviceAccount = {
    type: 'service_account',
    project_id: process.env.FIREBASE_ADMIN_PROJECT_ID || 'broskis-kitchen-44d2d',
    private_key_id: 'dea25276e152403f5002d239c3982c665e07238a',
    private_key: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    client_email: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
    client_id: '101963513278200236002',
    auth_uri: 'https://accounts.google.com/o/oauth2/auth',
    token_uri: 'https://oauth2.googleapis.com/token',
    auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
    client_x509_cert_url: `https://www.googleapis.com/robot/v1/metadata/x509/${process.env.FIREBASE_ADMIN_CLIENT_EMAIL}`
  };

  console.log('Service account private_key exists:', !!serviceAccount.private_key);
  
  initializeApp({
    credential: cert(serviceAccount as any),
    projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || 'broskis-kitchen-44d2d'
  });
}

const db = getFirestore();

console.log('Using production Firestore');

// Initial reward catalog data based on architecture document
const initialRewards: Omit<RewardCatalog, 'createdAt' | 'updatedAt'>[] = [
  {
    id: 'freeside100',
    name: 'Free Side',
    description: 'Get any side item free with your order',
    type: 'fixed_item',
    pointsCost: 100,
    maxCogsValue: 2.00,
    category: 'food',
    isActive: true,
    sortOrder: 1
  },
  {
    id: 'freedessert150',
    name: 'Free Dessert',
    description: 'Get any dessert item free with your order',
    type: 'fixed_item',
    pointsCost: 150,
    maxCogsValue: 4.00,
    category: 'food',
    isActive: true,
    sortOrder: 2
  },
  {
    id: 'discount10300',
    name: '10% Off Order',
    description: 'Get 10% off your entire food order',
    type: 'percentage_discount',
    pointsCost: 300,
    maxCogsValue: 0,
    discountPercent: 10,
    category: 'food',
    isActive: true,
    sortOrder: 3
  },
  {
    id: 'hat400',
    name: 'Broskis Hat',
    description: 'Official Broskis branded baseball cap',
    type: 'merchandise',
    pointsCost: 400,
    maxCogsValue: 8.00,
    category: 'merchandise',
    isActive: true,
    sortOrder: 4
  },
  {
    id: 'freeburger500',
    name: 'Free Burger',
    description: 'Get any burger free with your order',
    type: 'fixed_item',
    pointsCost: 500,
    maxCogsValue: 6.00,
    category: 'food',
    isActive: true,
    sortOrder: 5
  },
  {
    id: 'shirt600',
    name: 'Broskis T-Shirt',
    description: 'Official Broskis branded t-shirt',
    type: 'merchandise',
    pointsCost: 600,
    maxCogsValue: 12.00,
    category: 'merchandise',
    isActive: true,
    sortOrder: 6
  },
  {
    id: 'discount20700',
    name: '20% Off Order',
    description: 'Get 20% off your entire food order',
    type: 'percentage_discount',
    pointsCost: 700,
    maxCogsValue: 0,
    discountPercent: 20,
    category: 'food',
    isActive: true,
    sortOrder: 7
  },
  {
    id: 'cookbook1000',
    name: 'Broskis Cookbook',
    description: 'Official Broskis recipe cookbook',
    type: 'merchandise',
    pointsCost: 1000,
    maxCogsValue: 20.00,
    category: 'merchandise',
    isActive: true,
    sortOrder: 8
  }
];

export async function seedRewardCatalog(): Promise<void> {
  try {
    console.log('Starting reward catalog seeding...');
    
    const now = Timestamp.now();
    
    // Test with just one simple reward first
    const testReward = {
      id: 'test123',
      name: 'Test Reward',
      description: 'A test reward',
      type: 'fixed_item' as const,
      pointsCost: 100,
      maxCogsValue: 2.0,
      category: 'food' as const,
      isActive: true,
      sortOrder: 1,
      createdAt: now,
      updatedAt: now
    };
    
    try {
      const rewardDoc = db.collection('rewardCatalog').doc(testReward.id);
      console.log('Attempting to write test reward:', JSON.stringify(testReward, null, 2));
      
      await rewardDoc.set(testReward);
      console.log(`✓ Added test reward successfully`);
      
      // If test succeeds, add the rest
      for (const reward of initialRewards) {
        try {
          const rewardDoc = db.collection('rewardCatalog').doc(reward.id);
          const rewardData = {
            ...reward,
            createdAt: now,
            updatedAt: now
          };
          
          await rewardDoc.set(rewardData);
          console.log(`✓ Added reward: ${reward.name} (${reward.id})`);
        } catch (rewardError) {
          console.error(`✗ Failed to add reward ${reward.name}:`, rewardError);
        }
      }
      
    } catch (testError) {
      console.error('✗ Failed to add test reward:', testError);
      throw testError;
    }
    
    console.log(`Finished seeding rewards to catalog`);
    
  } catch (error) {
    console.error('Error seeding reward catalog:', error);
    throw error;
  }
}

// Run the seeding function
seedRewardCatalog()
  .then(() => {
    console.log('Reward catalog seeding completed successfully');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Error seeding reward catalog:', error);
    process.exit(1);
  });

export { initialRewards };