#!/usr/bin/env node

// Simple script to add a test order to Firestore
import admin from 'firebase-admin';

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    })
  });
}

const db = admin.firestore();

async function addTestOrder() {
  try {
    const testOrder = {
      status: 'preparing',
      userId: 'test-user-123',
      userEmail: 'test@example.com',
      userName: 'Test User',
      total: 2499, // $24.99
      items: [
        {
          id: 'item-1',
          name: 'Broski Burger',
          price: 1599,
          quantity: 1,
          customizations: ['Extra cheese', 'No onions']
        },
        {
          id: 'item-2', 
          name: 'Loaded Fries',
          price: 900,
          quantity: 1,
          customizations: []
        }
      ],
      deliveryAddress: {
        street: '123 Test Street',
        city: 'Test City',
        state: 'TC',
        zipCode: '12345',
        country: 'USA'
      },
      createdAt: admin.firestore.Timestamp.now(),
      updatedAt: admin.firestore.Timestamp.now()
    };

    const docRef = await db.collection('orders').add(testOrder);
    console.log('Test order added with ID:', docRef.id);
    
    // Add a second order with different status
    const testOrder2 = {
      ...testOrder,
      status: 'ready',
      userId: 'test-user-456',
      userEmail: 'test2@example.com',
      userName: 'Test User 2',
      total: 1899,
      items: [
        {
          id: 'item-3',
          name: 'Chicken Wings',
          price: 1299,
          quantity: 1,
          customizations: ['Spicy sauce']
        },
        {
          id: 'item-4',
          name: 'Soda',
          price: 600,
          quantity: 1,
          customizations: []
        }
      ]
    };
    
    const docRef2 = await db.collection('orders').add(testOrder2);
    console.log('Second test order added with ID:', docRef2.id);
    
    process.exit(0);
  } catch (error) {
    console.error('Error adding test order:', error);
    process.exit(1);
  }
}

addTestOrder();