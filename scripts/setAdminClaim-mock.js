#!/usr/bin/env node

/**
 * Mock Firebase Admin SDK script for development
 * This simulates setting admin claims without requiring real Firebase credentials
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

// Configuration
const TARGET_EMAIL = 'lou@broski.com';
const ADMIN_ROLE = 'admin';

// Mock user data
const MOCK_USER = {
  uid: 'mock-uid-lou-broski',
  email: TARGET_EMAIL,
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

// Main function
async function main() {
  console.log('🚀 Setting admin role for', TARGET_EMAIL);
  console.log('=' .repeat(50));
  console.log('⚠️  DEVELOPMENT MODE: Using mock Firebase Admin SDK');
  console.log('');

  // Simulate Firebase Admin initialization
  console.log('✅ Firebase Admin SDK initialized successfully (mock)');
  
  // Simulate finding user
  console.log(`✅ Found user: ${MOCK_USER.email} (UID: ${MOCK_USER.uid})`);
  
  // Simulate setting custom claims
  console.log(`✅ Successfully set admin role for ${MOCK_USER.email}`);
  console.log(`   UID: ${MOCK_USER.uid}`);
  console.log(`   Role: ${ADMIN_ROLE}`);
  
  // Show mock claims
  console.log('\n📋 Current custom claims:', MOCK_USER.customClaims);
  
  console.log('\n🔄 Note: This is a mock implementation for development.');
  console.log('   In production, ensure real Firebase credentials are configured.');
  console.log('   The user will need to sign out and sign back in for changes to take effect.');
  
  console.log('\n🎉 Mock admin role setup completed successfully!');
  console.log('\n📝 Next steps:');
  console.log('   1. Test admin dashboard access with mock authentication');
  console.log('   2. Verify route guards are working correctly');
  console.log('   3. Configure real Firebase credentials for production');
  
  return true;
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});

// Run the script
main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('❌ Script failed:', error);
    process.exit(1);
  });

export { main, MOCK_USER };