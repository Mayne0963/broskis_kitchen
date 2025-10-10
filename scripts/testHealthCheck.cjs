require('dotenv').config();
const https = require('https');
const http = require('http');

async function testHealthCheck() {
  console.log('🧪 Testing Firebase Functions Health Check...\n');
  
  const healthCheckUrl = 'https://us-central1-broskis-kitchen-44d2d.cloudfunctions.net/healthCheck';
  
  try {
    console.log(`🔍 Testing health check endpoint: ${healthCheckUrl}`);
    
    const response = await makeHttpRequest(healthCheckUrl);
    
    console.log(`✅ HTTP Status: ${response.statusCode}`);
    console.log(`✅ Response Headers:`, response.headers);
    
    if (response.data) {
      console.log(`✅ Response Body:`, response.data);
    }
    
    // Check if status code is 200 (success)
    if (response.statusCode === 200) {
      console.log('\n🎉 HEALTH CHECK TEST PASSED!');
      console.log('✅ Health check endpoint is accessible');
      console.log('✅ HTTP 200 response received');
      console.log('✅ Firebase Functions are operational');
      
      return {
        success: true,
        statusCode: response.statusCode,
        url: healthCheckUrl,
        responseTime: response.responseTime,
        data: response.data
      };
    } else {
      throw new Error(`Expected HTTP 200, got ${response.statusCode}`);
    }
    
  } catch (error) {
    console.error('\n❌ HEALTH CHECK TEST FAILED!');
    console.error('Error:', error.message);
    
    // Provide additional context for common errors
    if (error.code === 'ENOTFOUND') {
      console.error('💡 DNS resolution failed - check if the Firebase Functions URL is correct');
    } else if (error.code === 'ECONNREFUSED') {
      console.error('💡 Connection refused - Firebase Functions may be down');
    } else if (error.code === 'ETIMEDOUT') {
      console.error('💡 Request timed out - Firebase Functions may be slow to respond');
    } else if (error.message.includes('403')) {
      console.error('💡 403 Forbidden - Health check endpoint may require authentication');
    } else if (error.message.includes('404')) {
      console.error('💡 404 Not Found - Health check function may not be deployed');
    }
    
    return {
      success: false,
      error: error.message,
      errorCode: error.code,
      url: healthCheckUrl
    };
  }
}

function makeHttpRequest(url) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      timeout: 10000, // 10 second timeout
      headers: {
        'User-Agent': 'Broski-Health-Check-Test/1.0'
      }
    };
    
    const req = client.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const responseTime = Date.now() - startTime;
        
        let parsedData;
        try {
          parsedData = JSON.parse(data);
        } catch (e) {
          parsedData = data; // Keep as string if not JSON
        }
        
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data: parsedData,
          responseTime: responseTime
        });
      });
    });
    
    req.on('error', (error) => {
      reject(error);
    });
    
    req.on('timeout', () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
}

// Additional function to test multiple endpoints if needed
async function testMultipleEndpoints() {
  console.log('\n🔍 Testing additional Firebase Functions endpoints...\n');
  
  const endpoints = [
    'https://us-central1-broskis-kitchen-44d2d.cloudfunctions.net/healthCheck',
    // Add other public endpoints here if they exist
  ];
  
  const results = [];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`Testing: ${endpoint}`);
      const response = await makeHttpRequest(endpoint);
      console.log(`✅ ${endpoint}: HTTP ${response.statusCode} (${response.responseTime}ms)`);
      results.push({
        url: endpoint,
        success: true,
        statusCode: response.statusCode,
        responseTime: response.responseTime
      });
    } catch (error) {
      console.log(`❌ ${endpoint}: ${error.message}`);
      results.push({
        url: endpoint,
        success: false,
        error: error.message
      });
    }
  }
  
  return results;
}

// Run the test
if (require.main === module) {
  testHealthCheck()
    .then(result => {
      console.log('\n📋 Test Result:', result);
      
      // Optionally test multiple endpoints
      if (result.success) {
        return testMultipleEndpoints();
      }
      return null;
    })
    .then(multipleResults => {
      if (multipleResults) {
        console.log('\n📊 Multiple Endpoints Test Results:', multipleResults);
      }
      process.exit(0);
    })
    .catch(error => {
      console.error('💥 Unexpected error:', error);
      process.exit(1);
    });
}

module.exports = { testHealthCheck, testMultipleEndpoints };