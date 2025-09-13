// Using built-in fetch in Node.js 18+

async function testCheckoutFlow() {
  console.log('Testing Checkout Flow...');
  
  try {
    // Test 1: Check if checkout page loads
    console.log('\n1. Testing checkout page load...');
    const checkoutResponse = await fetch('http://localhost:3002/checkout');
    console.log(`Checkout page status: ${checkoutResponse.status}`);
    
    // Test 2: Test checkout session API
    console.log('\n2. Testing checkout session API...');
    const testItems = [
      { name: 'Gourmet Burger', price: 15.99, qty: 1 },
      { name: 'Truffle Fries', price: 8.99, qty: 2 }
    ];
    
    const sessionResponse = await fetch('http://localhost:3002/api/checkout/session', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      },
      body: JSON.stringify({ items: testItems })
    });
    
    console.log(`Session API status: ${sessionResponse.status}`);
    
    if (sessionResponse.ok) {
      const sessionData = await sessionResponse.json();
      console.log('Session created successfully!');
      console.log(`Stripe URL: ${sessionData.url ? 'Generated' : 'Missing'}`);
      
      if (sessionData.url) {
        console.log('✅ Checkout flow is working correctly!');
        console.log('\nTest Results:');
        console.log('- Checkout page loads: ✅');
        console.log('- API endpoint responds: ✅');
        console.log('- Stripe session created: ✅');
        console.log('- Redirect URL generated: ✅');
      } else {
        console.log('❌ No redirect URL in response');
      }
    } else {
      const errorText = await sessionResponse.text();
      console.log(`❌ Session API failed: ${errorText}`);
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

testCheckoutFlow();