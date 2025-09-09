const http = require('http');

const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/_env-dump',
  method: 'GET',
  headers: {
    'Accept': 'application/json',
    'User-Agent': 'Node.js Test Script'
  }
};

console.log('Making request to:', `http://${options.hostname}:${options.port}${options.path}`);

const req = http.request(options, (res) => {
  console.log(`\nStatus: ${res.statusCode}`);
  console.log(`Headers:`, res.headers);
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    console.log('\n=== Response Body ===');
    try {
      // Try to parse as JSON first
      const jsonData = JSON.parse(data);
      console.log(JSON.stringify(jsonData, null, 2));
    } catch (e) {
      // If not JSON, show first 500 chars
      console.log('Response is not JSON. First 500 characters:');
      console.log(data.substring(0, 500));
      console.log('\n... (truncated)');
    }
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.setTimeout(5000, () => {
  console.error('Request timeout');
  req.destroy();
});

req.end();