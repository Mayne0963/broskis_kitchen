#!/usr/bin/env node

/**
 * Authentication Verification Script
 * Tests the four scenarios mentioned in the L-4C verification requirements
 */

import https from 'https';
import http from 'http';

const BASE_URL = 'http://localhost:3000';

// Test configuration
const TESTS = [
  {
      name: 'Profile with valid customer cookie',
      path: '/profile',
      cookie: 'session=valid_customer_token',
      expectedStatus: 200,
      expectedBehavior: 'Should show profile content without flash'
    },
    {
      name: 'Profile with invalid cookie',
      path: '/profile', 
      cookie: 'session=invalid_token',
      expectedStatus: 302,
      expectedLocation: '/login',
      expectedBehavior: 'Should redirect to login immediately'
    },
    {
      name: 'Admin with customer cookie',
      path: '/admin',
      cookie: 'session=valid_customer_token_with_customer_role',
      expectedStatus: 302,
      expectedLocation: '/login',
      expectedBehavior: 'Should redirect to login (admin required)'
    },
    {
      name: 'Admin with admin cookie',
      path: '/admin',
      cookie: 'session=valid_admin_token',
      expectedStatus: 200,
      expectedBehavior: 'Should allow access to admin dashboard'
    },
  {
    name: 'Admin with no cookie',
    path: '/admin',
    cookie: '',
    expectedStatus: 302,
    expectedLocation: '/login',
    expectedBehavior: 'Should redirect to login immediately'
  }
];

// Helper function to make HTTP requests
function makeRequest(options) {
  return new Promise((resolve, reject) => {
    const protocol = options.protocol === 'https:' ? https : http;
    
    const req = protocol.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    
    req.on('error', reject);
    req.end();
  });
}

// Generate test JWT tokens for different roles
function generateTestToken(role = 'customer', valid = true) {
  if (!valid) {
    return 'invalid.token.here';
  }
  
  const header = { alg: 'HS256', typ: 'JWT' };
  const payload = {
    uid: `test-${role}-user`,
    email: `test-${role}@example.com`,
    email_verified: true,
    role: role,
    exp: Math.floor(Date.now() / 1000) + (60 * 60), // 1 hour from now
    iat: Math.floor(Date.now() / 1000)
  };
  
  // Base64url encode (simplified for testing)
  const encodedHeader = Buffer.from(JSON.stringify(header)).toString('base64url');
  const encodedPayload = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = 'test-signature'; // Simplified for testing
  
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

// Run a single test
async function runTest(test) {
  console.log(`\n🧪 Testing: ${test.name}`);
  console.log(`   Path: ${test.path}`);
  console.log(`   Expected: ${test.expectedBehavior}`);
  
  // Prepare cookie based on test requirements
  let cookie = '';
  if (test.cookie) {
    if (test.cookie.includes('valid_customer_token_with_customer_role')) {
      cookie = `session=${generateTestToken('customer', true)}`;
    } else if (test.cookie.includes('valid_admin_token')) {
      cookie = `session=${generateTestToken('admin', true)}`;
    } else if (test.cookie.includes('valid_customer_token')) {
      cookie = `session=${generateTestToken('customer', true)}`;
    } else if (test.cookie.includes('invalid_token')) {
      cookie = `session=${generateTestToken('customer', false)}`;
    } else {
      cookie = test.cookie;
    }
  }
  
  const options = {
    hostname: 'localhost',
    port: 3000,
    path: test.path,
    method: 'GET',
    headers: {
      'User-Agent': 'Auth-Verification-Script/1.0',
      ...(cookie && { 'Cookie': cookie })
    }
  };
  
  try {
    const response = await makeRequest(options);
    
    console.log(`   Status: ${response.statusCode} (expected: ${test.expectedStatus})`);
    
    // Check status code
    const statusMatch = response.statusCode === test.expectedStatus;
    
    // Check redirect location if expected
    let locationMatch = true;
    if (test.expectedLocation) {
      const location = response.headers.location || '';
      locationMatch = location.includes(test.expectedLocation);
      console.log(`   Location: ${location} (expected to contain: ${test.expectedLocation})`);
    }
    
    // Check for flash content in profile pages with valid cookies
    let noFlashContent = true;
    
    if (test.path === '/profile' && response.statusCode === 200) {
      const hasFlashText = response.body.includes('Please log in');
      const hasRedirectText = response.body.includes('Redirecting to login');
      
      // For valid cookies: should not have flash text or redirect text
      if (test.cookie && !test.cookie.includes('invalid')) {
        noFlashContent = !hasFlashText && !hasRedirectText;
        console.log(`   Flash check: ${noFlashContent ? 'PASS' : 'FAIL'} (no premature login message)`);
      }
    }
    
    // Standard test evaluation - middleware now handles all redirects server-side
    const testPassed = statusMatch && locationMatch && noFlashContent;
    console.log(`   Result: ${testPassed ? '✅ PASS' : '❌ FAIL'}`);
    
    return {
      name: test.name,
      passed: testPassed,
      details: {
        statusMatch,
        locationMatch,
        noFlashContent,
        actualStatus: response.statusCode,
        actualLocation: response.headers.location
      }
    };
  } catch (error) {
    console.log(`   Result: ❌ FAIL (Error: ${error.message})`);
    return {
      name: test.name,
      passed: false,
      error: error.message
    };
  }
}

// Main test runner
async function runAllTests() {
  console.log('🚀 Starting Authentication Verification Tests');
  console.log(`📍 Testing against: ${BASE_URL}`);
  console.log('=' .repeat(60));
  
  const results = [];
  
  for (const test of TESTS) {
    const result = await runTest(test);
    results.push(result);
    
    // Small delay between tests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  
  // Summary
  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Summary:');
  
  const passed = results.filter(r => r.passed).length;
  const total = results.length;
  
  results.forEach(result => {
    const status = result.passed ? '✅' : '❌';
    console.log(`   ${status} ${result.name}`);
    if (!result.passed && result.error) {
      console.log(`      Error: ${result.error}`);
    }
  });
  
  console.log(`\n🎯 Overall: ${passed}/${total} tests passed`);
  
  if (passed === total) {
    console.log('🎉 All authentication tests passed!');
    process.exit(0);
  } else {
    console.log('⚠️  Some tests failed. Please review the implementation.');
    process.exit(1);
  }
}

// Check if server is running
async function checkServer() {
  try {
    await makeRequest({
      hostname: 'localhost',
      port: 3000,
      path: '/api/health',
      method: 'GET',
      timeout: 5000
    });
    return true;
  } catch (error) {
    return false;
  }
}

// Entry point
async function main() {
  console.log('🔍 Checking if development server is running...');
  
  const serverRunning = await checkServer();
  if (!serverRunning) {
    console.log('❌ Development server is not running on localhost:3000');
    console.log('   Please start the server with: npm run dev');
    process.exit(1);
  }
  
  console.log('✅ Server is running, proceeding with tests...');
  await runAllTests();
}

// Run the main function when script is executed directly
main().catch(console.error);