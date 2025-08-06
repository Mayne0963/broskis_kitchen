#!/usr/bin/env node

/**
 * Mock Firebase Admin SDK script to demonstrate admin role setting
 * This shows what the output would look like with proper Firebase credentials
 * Usage: node scripts/setAdminClaim-mock.js
 */

// Configuration
const TARGET_EMAIL = process.argv[2] || 'amarikelsaw10@gmail.com';
const ADMIN_ROLE = 'admin';

// Validate email argument
if (!TARGET_EMAIL || !TARGET_EMAIL.includes('@')) {
  console.error('❌ Please provide a valid email address as an argument');
  console.error('   Usage: node scripts/setAdminClaim-mock.js <email@example.com>');
  process.exit(1);
}

// Mock Firebase Admin SDK functions
function mockInitializeFirebaseAdmin() {
  console.log('✅ Firebase Admin SDK initialized successfully (MOCK)');
  return {
    getUserByEmail: mockGetUserByEmail,
    setCustomUserClaims: mockSetCustomUserClaims,
    getUser: mockGetUser
  };
}

function mockGetUserByEmail(email) {
  console.log(`✅ Found user: ${email} (UID: mock-uid-${Date.now()})`);
  return {
    uid: `mock-uid-${Date.now()}`,
    email: email,
    emailVerified: true
  };
}

function mockSetCustomUserClaims(uid, claims) {
  console.log(`✅ Successfully set admin role for ${TARGET_EMAIL}`);
  console.log(`   UID: ${uid}`);
  console.log(`   Role: ${claims.role}`);
  return Promise.resolve();
}

function mockGetUser(uid) {
  return {
    uid: uid,
    customClaims: {
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
    }
  };
}

// Main function
async function main() {
  console.log('🚀 Setting admin role for', TARGET_EMAIL);
  console.log('=' .repeat(50));
  console.log('📝 NOTE: This is a MOCK demonstration');
  console.log('   Real Firebase credentials needed for production');
  console.log('');

  // Mock Firebase Admin initialization
  const auth = mockInitializeFirebaseAdmin();

  // Mock find user by email
  const userRecord = await auth.getUserByEmail(TARGET_EMAIL);
  
  // Mock set admin claims
  await auth.setCustomUserClaims(userRecord.uid, {
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

  // Mock verify claims
  const updatedUser = await auth.getUser(userRecord.uid);
  console.log('\n📋 Current custom claims:', updatedUser.customClaims);
  
  console.log('\n🔄 Note: The user will need to sign out and sign back in');
  console.log('   for the new role to take effect, or force token refresh.');
  
  console.log('\n🎉 Admin role setup completed successfully! (MOCK)');
  console.log('\n📝 Next steps:');
  console.log('   1. Set up proper Firebase credentials (see FIREBASE_PRODUCTION_SETUP.md)');
  console.log('   2. User should sign out and sign back in');
  console.log('   3. Test admin dashboard access at /admin');
  
  console.log('\n✨ Email successfully updated to:', TARGET_EMAIL);
}

// Run the script
main().catch(console.error);