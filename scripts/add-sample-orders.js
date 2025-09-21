import admin from 'firebase-admin';
import { Timestamp } from 'firebase-admin/firestore';

// Initialize Firebase Admin (using existing service account)
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: 'broskis-kitchen-44d2d'
  });
}

const db = admin.firestore();

const sampleOrders = [
  {
    status: 'pending',
    userEmail: 'john@example.com',
    userName: 'John Doe',
    totalCents: 2499,
    items: [
      {
        name: 'Grilled Chicken Sandwich',
        qty: 1,
        priceCents: 1299,
        options: ['Extra Cheese', 'No Pickles']
      },
      {
        name: 'French Fries',
        qty: 1,
        priceCents: 599,
        options: []
      },
      {
        name: 'Coca Cola',
        qty: 1,
        priceCents: 299,
        options: ['Large']
      }
    ],
    address: {
      street: '123 Main St',
      city: 'Anytown',
      state: 'CA',
      zip: '12345'
    },
    createdAt: Timestamp.now()
  },
  {
    status: 'preparing',
    userEmail: 'jane@example.com',
    userName: 'Jane Smith',
    totalCents: 1899,
    items: [
      {
        name: 'Caesar Salad',
        qty: 1,
        priceCents: 1099,
        options: ['Extra Croutons']
      },
      {
        name: 'Iced Tea',
        qty: 1,
        priceCents: 299,
        options: ['Sweet']
      }
    ],
    address: {
      street: '456 Oak Ave',
      city: 'Somewhere',
      state: 'NY',
      zip: '67890'
    },
    createdAt: Timestamp.fromDate(new Date(Date.now() - 30 * 60 * 1000)) // 30 minutes ago
  },
  {
    status: 'ready',
    userEmail: 'bob@example.com',
    userName: 'Bob Johnson',
    totalCents: 3299,
    items: [
      {
        name: 'BBQ Burger',
        qty: 1,
        priceCents: 1599,
        options: ['Medium Rare', 'Extra BBQ Sauce']
      },
      {
        name: 'Onion Rings',
        qty: 1,
        priceCents: 699,
        options: []
      },
      {
        name: 'Milkshake',
        qty: 1,
        priceCents: 599,
        options: ['Vanilla']
      }
    ],
    address: {
      street: '789 Pine St',
      city: 'Elsewhere',
      state: 'TX',
      zip: '54321'
    },
    createdAt: Timestamp.fromDate(new Date(Date.now() - 60 * 60 * 1000)) // 1 hour ago
  },
  {
    status: 'out_for_delivery',
    userEmail: 'alice@example.com',
    userName: 'Alice Brown',
    totalCents: 2199,
    items: [
      {
        name: 'Fish Tacos',
        qty: 2,
        priceCents: 899,
        options: ['Spicy Sauce']
      },
      {
        name: 'Chips & Guac',
        qty: 1,
        priceCents: 599,
        options: []
      }
    ],
    address: {
      street: '321 Elm Dr',
      city: 'Nowhere',
      state: 'FL',
      zip: '98765'
    },
    createdAt: Timestamp.fromDate(new Date(Date.now() - 90 * 60 * 1000)) // 1.5 hours ago
  },
  {
    status: 'completed',
    userEmail: 'charlie@example.com',
    userName: 'Charlie Wilson',
    totalCents: 1599,
    items: [
      {
        name: 'Veggie Wrap',
        qty: 1,
        priceCents: 999,
        options: ['Hummus', 'No Cheese']
      },
      {
        name: 'Fresh Juice',
        qty: 1,
        priceCents: 399,
        options: ['Orange']
      }
    ],
    address: {
      street: '654 Maple Ln',
      city: 'Anywhere',
      state: 'WA',
      zip: '13579'
    },
    createdAt: Timestamp.fromDate(new Date(Date.now() - 2 * 60 * 60 * 1000)) // 2 hours ago
  }
];

async function addSampleOrders() {
  try {
    console.log('Adding sample orders...');
    
    for (let i = 0; i < sampleOrders.length; i++) {
      const order = sampleOrders[i];
      const docRef = await db.collection('orders').add(order);
      console.log(`Added order ${i + 1}/5 with ID: ${docRef.id}`);
    }
    
    console.log('✅ All sample orders added successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error adding sample orders:', error);
    process.exit(1);
  }
}

addSampleOrders();