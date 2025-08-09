// Firebase Data Population Script
import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, Timestamp } from 'firebase/firestore';
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

// Sample data generators
function generateUsers() {
  const users = [];
  const names = ['John Smith', 'Sarah Johnson', 'Mike Davis', 'Emily Brown', 'David Wilson', 'Lisa Garcia', 'Chris Martinez', 'Amanda Taylor'];
  const cities = [['New York', 'NY'], ['Los Angeles', 'CA'], ['Chicago', 'IL'], ['Houston', 'TX'], ['Phoenix', 'AZ']];
  
  for (let i = 0; i < 8; i++) {
    const [city, state] = cities[i % cities.length];
    users.push({
      id: `user_${i + 1}`,
      name: names[i],
      email: names[i].toLowerCase().replace(' ', '.') + '@broskis.com',
      createdAt: Timestamp.fromDate(new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)),
      city,
      state,
      role: i === 0 ? 'admin' : 'user'
    });
  }
  return users;
}

function generateOrders(users) {
  const orders = [];
  const statuses = ['completed', 'pending', 'preparing', 'ready', 'delivered'];
  const items = [
    { name: 'Broski Burger', price: 15.99 },
    { name: 'Loaded Fries', price: 8.99 },
    { name: 'Chicken Wings', price: 12.99 },
    { name: 'BBQ Sandwich', price: 13.99 },
    { name: 'Craft Beer', price: 6.99 }
  ];
  
  for (let i = 0; i < 25; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const orderItems = [];
    const numItems = Math.floor(Math.random() * 3) + 1;
    
    for (let j = 0; j < numItems; j++) {
      const item = items[Math.floor(Math.random() * items.length)];
      const quantity = Math.floor(Math.random() * 3) + 1;
      orderItems.push({
        ...item,
        quantity,
        total: item.price * quantity
      });
    }
    
    const total = orderItems.reduce((sum, item) => sum + item.total, 0);
    
    orders.push({
      id: `order_${i + 1}`,
      userId: user.id,
      items: orderItems,
      total: Math.round(total * 100) / 100,
      status: statuses[Math.floor(Math.random() * statuses.length)],
      createdAt: Timestamp.fromDate(new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)),
      updatedAt: Timestamp.fromDate(new Date())
    });
  }
  return orders;
}

function generateMenuDrops() {
  return [
    {
      id: 'drop_1',
      name: 'Weekend BBQ Special',
      status: 'active',
      startTime: Timestamp.fromDate(new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)),
      endTime: Timestamp.fromDate(new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)),
      totalQuantity: 100,
      soldQuantity: 67,
      revenue: 1340.33
    },
    {
      id: 'drop_2',
      name: 'Craft Beer Collection',
      status: 'active',
      startTime: Timestamp.fromDate(new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)),
      endTime: Timestamp.fromDate(new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)),
      totalQuantity: 50,
      soldQuantity: 23,
      revenue: 459.77
    },
    {
      id: 'drop_3',
      name: 'Holiday Feast Menu',
      status: 'scheduled',
      startTime: Timestamp.fromDate(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)),
      endTime: Timestamp.fromDate(new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)),
      totalQuantity: 200,
      soldQuantity: 0,
      revenue: 0
    }
  ];
}

function generateUserRewards(users) {
  return users.map(user => ({
    id: user.id,
    points: Math.floor(Math.random() * 1000) + 100,
    tier: ['bronze', 'silver', 'gold', 'platinum'][Math.floor(Math.random() * 4)],
    totalEarned: Math.floor(Math.random() * 2000) + 500,
    totalRedeemed: Math.floor(Math.random() * 500) + 100,
    lastUpdated: Timestamp.fromDate(new Date())
  }));
}

function generatePointsTransactions(users) {
  const transactions = [];
  const types = ['earned', 'redeemed'];
  const reasons = {
    earned: ['Order completed', 'Referral bonus', 'Birthday bonus', 'Review bonus'],
    redeemed: ['Free appetizer', 'Free delivery', '20% discount', 'Free drink']
  };
  
  for (let i = 0; i < 50; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const type = types[Math.floor(Math.random() * types.length)];
    const reason = reasons[type][Math.floor(Math.random() * reasons[type].length)];
    
    transactions.push({
      id: `transaction_${i + 1}`,
      userId: user.id,
      type,
      points: Math.floor(Math.random() * 200) + 10,
      reason,
      createdAt: Timestamp.fromDate(new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000))
    });
  }
  return transactions;
}

function generateRewardOffers() {
  return [
    {
      id: 'offer_1',
      name: 'Free Appetizer',
      description: 'Get a free appetizer with any main course',
      pointsCost: 500,
      isActive: true,
      category: 'food',
      createdAt: Timestamp.fromDate(new Date(Date.now() - 10 * 24 * 60 * 60 * 1000))
    },
    {
      id: 'offer_2',
      name: 'Free Delivery',
      description: 'Free delivery on your next order',
      pointsCost: 300,
      isActive: true,
      category: 'delivery',
      createdAt: Timestamp.fromDate(new Date(Date.now() - 5 * 24 * 60 * 60 * 1000))
    },
    {
      id: 'offer_3',
      name: '20% Off Next Order',
      description: 'Get 20% off your next order (max $10)',
      pointsCost: 750,
      isActive: true,
      category: 'discount',
      createdAt: Timestamp.fromDate(new Date(Date.now() - 3 * 24 * 60 * 60 * 1000))
    },
    {
      id: 'offer_4',
      name: 'Free Drink',
      description: 'Free soft drink or beer with any order',
      pointsCost: 200,
      isActive: true,
      category: 'beverage',
      createdAt: Timestamp.fromDate(new Date(Date.now() - 1 * 24 * 60 * 60 * 1000))
    },
    {
      id: 'offer_5',
      name: 'VIP Experience',
      description: 'Skip the line and get priority service',
      pointsCost: 1000,
      isActive: false,
      category: 'experience',
      createdAt: Timestamp.fromDate(new Date(Date.now() - 15 * 24 * 60 * 60 * 1000))
    }
  ];
}

function generateUserRedemptions(users, offers) {
  const redemptions = [];
  
  for (let i = 0; i < 30; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const offer = offers[Math.floor(Math.random() * offers.length)];
    
    redemptions.push({
      id: `redemption_${i + 1}`,
      userId: user.id,
      offerId: offer.id,
      offerName: offer.name,
      pointsUsed: offer.pointsCost,
      status: ['pending', 'completed', 'expired'][Math.floor(Math.random() * 3)],
      redeemedAt: Timestamp.fromDate(new Date(Date.now() - Math.random() * 15 * 24 * 60 * 60 * 1000)),
      expiresAt: Timestamp.fromDate(new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
    });
  }
  return redemptions;
}

async function populateCollection(collectionName, data) {
  console.log(`📝 Populating ${collectionName} collection with ${data.length} documents...`);
  
  for (const item of data) {
    try {
      await setDoc(doc(db, collectionName, item.id), item);
      console.log(`  ✅ Added ${item.id}`);
    } catch (error) {
      console.log(`  ❌ Failed to add ${item.id}:`, error.message);
    }
  }
}

async function populateFirebaseData() {
  console.log('🚀 Starting Firebase data population...');
  
  try {
    // Generate all data
    const users = generateUsers();
    const orders = generateOrders(users);
    const menuDrops = generateMenuDrops();
    const userRewards = generateUserRewards(users);
    const pointsTransactions = generatePointsTransactions(users);
    const rewardOffers = generateRewardOffers();
    const userRedemptions = generateUserRedemptions(users, rewardOffers);
    
    // Populate collections
    await populateCollection('users', users);
    await populateCollection('orders', orders);
    await populateCollection('menuDrops', menuDrops);
    await populateCollection('userRewards', userRewards);
    await populateCollection('pointsTransactions', pointsTransactions);
    await populateCollection('rewardOffers', rewardOffers);
    await populateCollection('userRedemptions', userRedemptions);
    
    console.log('\n🎉 Firebase data population completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`  Users: ${users.length}`);
    console.log(`  Orders: ${orders.length}`);
    console.log(`  Menu Drops: ${menuDrops.length}`);
    console.log(`  User Rewards: ${userRewards.length}`);
    console.log(`  Points Transactions: ${pointsTransactions.length}`);
    console.log(`  Reward Offers: ${rewardOffers.length}`);
    console.log(`  User Redemptions: ${userRedemptions.length}`);
    
  } catch (error) {
    console.error('❌ Error populating Firebase data:', error);
  }
}

populateFirebaseData().catch(console.error);