// Simple integration test script
const fs = require('fs');
const https = require('https');
const http = require('http');

// Load environment variables from .env.local
try {
  const envFile = fs.readFileSync('.env.local', 'utf8');
  const envVars = envFile.split('\n').filter(line => line.includes('='));
  envVars.forEach(line => {
    const [key, ...valueParts] = line.split('=');
    const value = valueParts.join('=').replace(/^["']|["']$/g, '');
    if (key && value) {
      process.env[key] = value;
    }
  });
} catch (error) {
  console.log('Warning: Could not load .env.local file');
}

// Test if the development server is running
function testDevServer() {
  return new Promise((resolve, reject) => {
    const req = http.get('http://localhost:3000', (res) => {
      console.log('✅ Development server is running');
      console.log(`Status: ${res.statusCode}`);
      resolve(true);
    });
    
    req.on('error', (err) => {
      console.log('❌ Development server is not accessible:', err.message);
      reject(err);
    });
    
    req.setTimeout(5000, () => {
      console.log('❌ Development server request timed out');
      req.destroy();
      reject(new Error('Timeout'));
    });
  });
}

// Test environment variables
function testEnvironmentVariables() {
  console.log('\n🔍 Checking Environment Variables:');
  
  const requiredVars = [
    'STRIPE_SECRET_KEY',
    'FIREBASE_PROJECT_ID',
    'SENDGRID_API_KEY',
    'TWILIO_ACCOUNT_SID',
    'OTW_API_KEY'
  ];
  
  let allPresent = true;
  
  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      console.log(`✅ ${varName}: Present`);
    } else {
      console.log(`❌ ${varName}: Missing`);
      allPresent = false;
    }
  });
  
  return allPresent;
}

// Main test function
async function runIntegrationTests() {
  console.log('🚀 Starting Integration Tests\n');
  
  try {
    // Test 1: Environment Variables
    const envVarsOk = testEnvironmentVariables();
    
    // Test 2: Development Server
    await testDevServer();
    
    console.log('\n📊 Test Summary:');
    console.log(`Environment Variables: ${envVarsOk ? '✅ PASS' : '❌ FAIL'}`);
    console.log('Development Server: ✅ PASS');
    
    if (envVarsOk) {
      console.log('\n🎉 All basic integration tests passed!');
      console.log('\n📝 Next Steps:');
      console.log('1. Test order creation through the UI');
      console.log('2. Verify payment processing');
      console.log('3. Check email/SMS notifications');
      console.log('4. Test delivery integration');
    } else {
      console.log('\n⚠️  Some environment variables are missing.');
      console.log('Please check your .env.local file.');
    }
    
  } catch (error) {
    console.log('\n❌ Integration tests failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
runIntegrationTests();