#!/usr/bin/env node

/**
 * Script to check Firebase custom claims for a user
 * Usage: node check-admin-claims.js <email>
 */

const admin = require('firebase-admin');
const path = require('path');

// Load environment variables from .env.local
require('dotenv').config({ path: path.join(__dirname, '.env.local') });

// Initialize Firebase Admin
const serviceAccount = {
  projectId: process.env.FIREBASE_ADMIN_PROJECT_ID || process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL || process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: (process.env.FIREBASE_ADMIN_PRIVATE_KEY || process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
};

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

async function checkUserClaims(email) {
  try {
    // Get user by email
    const user = await admin.auth().getUserByEmail(email);
    
    console.log('\n=== User Information ===');
    console.log('UID:', user.uid);
    console.log('Email:', user.email);
    console.log('Email Verified:', user.emailVerified);
    console.log('Display Name:', user.displayName || '(not set)');
    
    console.log('\n=== Custom Claims ===');
    if (user.customClaims) {
      console.log(JSON.stringify(user.customClaims, null, 2));
      
      // Check admin status
      const isAdmin = user.customClaims.admin === true || user.customClaims.role === 'admin';
      console.log('\n=== Admin Status ===');
      console.log('Is Admin:', isAdmin);
      console.log('  - claims.admin:', user.customClaims.admin);
      console.log('  - claims.role:', user.customClaims.role);
    } else {
      console.log('No custom claims set');
      console.log('\n=== Admin Status ===');
      console.log('Is Admin: false (no claims)');
    }
    
    console.log('\n=== Recommendations ===');
    if (!user.customClaims || (!user.customClaims.admin && user.customClaims.role !== 'admin')) {
      console.log('❌ User is NOT an admin');
      console.log('To make this user an admin, run:');
      console.log(`   node setAdmin.js ${user.uid}`);
    } else {
      console.log('✅ User has admin claims');
      console.log('If admin pages still show "Access Denied":');
      console.log('1. User needs to log out and log back in');
      console.log('2. Or refresh their session cookie');
      console.log('3. Session cookie may have old claims from before admin was granted');
    }
    
  } catch (error) {
    console.error('Error checking user:', error.message);
    if (error.code === 'auth/user-not-found') {
      console.log(`No user found with email: ${email}`);
    }
  }
}

// Get email from command line
const email = process.argv[2];

if (!email) {
  console.log('Usage: node check-admin-claims.js <email>');
  console.log('Example: node check-admin-claims.js user@example.com');
  process.exit(1);
}

checkUserClaims(email)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
