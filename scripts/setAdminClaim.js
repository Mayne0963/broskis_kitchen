#!/usr/bin/env node

/**
 * Firebase Admin SDK script to set custom role claims
 * Usage: node scripts/setAdminClaim.js
 */

import { initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Configuration
const TARGET_EMAIL = process.argv[2] || 'lou@broski.com';
const ADMIN_ROLE = 'admin';

// Validate email argument
if (!TARGET_EMAIL || !TARGET_EMAIL.includes('@')) {
  console.error('❌ Please provide a valid email address as an argument');
  console.error('   Usage: node scripts/setAdminClaim.js <email@example.com>');
  process.exit(1);
}


// Initialize Firebase Admin SDK
function initializeFirebaseAdmin() {
  // Try to get service account from environment variable first
  const serviceAccountJson = process.env.FIREBASE_SERVICE_ACCOUNT;
  
  if (serviceAccountJson) {
    try {
      // Parse the service account JSON
      const serviceAccount = JSON.parse(serviceAccountJson);
      
      // Validate required fields
      if (!serviceAccount.private_key || !serviceAccount.client_email || !serviceAccount.project_id) {
        throw new Error('Service account JSON is missing required fields (private_key, client_email, project_id)');
      }
      
      // Fix common private key formatting issues
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }

      const app = initializeApp({
        credential: cert(serviceAccount)
      });
      
      console.log('✅ Firebase Admin SDK initialized successfully');
      return getAuth(app);
    } catch (parseError) {
      console.error('❌ Failed to parse FIREBASE_SERVICE_ACCOUNT JSON:', parseError.message);
      process.exit(1);
    }
  }
  
  // Fallback to individual environment variables
  const rawKey = process.env.FIREBASE_PRIVATE_KEY;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  if (!rawKey || !projectId || !clientEmail) {
    console.error('❌ Missing Firebase Admin SDK configuration:');
    console.error('   Either provide FIREBASE_SERVICE_ACCOUNT as JSON string, or:');
    console.error('   - FIREBASE_PRIVATE_KEY:', !!rawKey);
    console.error('   - FIREBASE_PROJECT_ID:', !!projectId);
    console.error('   - FIREBASE_CLIENT_EMAIL:', !!clientEmail);
    console.error('\nPlease check your .env.local file.');
    process.exit(1);
  }

  try {
    // Replace escaped newlines with actual newlines
    const privateKey = rawKey.replace(/\\n/g, '\n');

    const app = initializeApp({
      credential: cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });

    console.log('✅ Firebase Admin SDK initialized successfully');
    return getAuth(app);
  } catch (error) {
    console.error('❌ Failed to initialize Firebase Admin SDK:', error.message);
    process.exit(1);
  }
}

// Find user by email
async function findUserByEmail(auth, email) {
  try {
    const userRecord = await auth.getUserByEmail(email);
    console.log(`✅ Found user: ${userRecord.email} (UID: ${userRecord.uid})`);
    return userRecord;
  } catch (error) {
    if (error.code === 'auth/user-not-found') {
      console.error(`❌ User not found: ${email}`);
      console.error('   Make sure the user has signed up first.');
    } else {
      console.error('❌ Error finding user:', error.message);
    }
    return null;
  }
}

// Set custom claims
async function setAdminClaim(auth, uid, email) {
  try {
    // Set custom claims
    await auth.setCustomUserClaims(uid, {
      role: ADMIN_ROLE,
      admin: true,
      permissions: [
        'view_all_orders',
        'update_order_status',
        'view_analytics',
        'manage_menu',
        'manage_users',
        'view_admin_dashboard',
        'manage_rewards'
      ]
    });

    console.log(`✅ Successfully set admin role for ${email}`);
    console.log(`   UID: ${uid}`);
    console.log(`   Role: ${ADMIN_ROLE}`);
    
    // Verify the claims were set
    const userRecord = await auth.getUser(uid);
    console.log('\n📋 Current custom claims:', userRecord.customClaims);
    
    console.log('\n🔄 Note: The user will need to sign out and sign back in');
    console.log('   for the new role to take effect, or force token refresh.');
    
    return true;
  } catch (error) {
    console.error('❌ Error setting custom claims:', error.message);
    return false;
  }
}

// Main function
async function main() {
  console.log('🚀 Setting admin role for', TARGET_EMAIL);
  console.log('=' .repeat(50));

  // Initialize Firebase Admin
  const auth = initializeFirebaseAdmin();

  // Find user by email
  const userRecord = await findUserByEmail(auth, TARGET_EMAIL);
  if (!userRecord) {
    process.exit(1);
  }

  // Set admin claims
  const success = await setAdminClaim(auth, userRecord.uid, userRecord.email);
  
  if (success) {
    console.log('\n🎉 Admin role setup completed successfully!');
    console.log('\n📝 Next steps:');
    console.log('   1. User should sign out and sign back in');
    console.log('   2. Or implement token refresh in the app');
    console.log('   3. Test admin dashboard access');
    process.exit(0);
  } else {
    console.log('\n❌ Failed to set admin role');
    process.exit(1);
  }
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});

// Run the script
main();

export { main, setAdminClaim, findUserByEmail };