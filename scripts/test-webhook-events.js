#!/usr/bin/env node

/**
 * Test script to verify webhook functionality
 * Tests the webhook endpoint directly with sample events
 */

import fetch from 'node-fetch';

// Test webhook endpoint URL (bypasses signature validation)
const WEBHOOK_URL = 'http://localhost:3000/api/test-webhook';

// Sample Stripe events
const checkoutSessionEvent = {
  id: 'evt_test_webhook',
  object: 'event',
  type: 'checkout.session.completed',
  data: {
    object: {
      id: 'cs_test_123456789',
      object: 'checkout.session',
      amount_total: 2999,
      currency: 'usd',
      customer_details: {
        email: 'test@example.com'
      },
      metadata: {
        userId: 'user_123'
      },
      client_reference_id: null
    }
  }
};

const paymentIntentEvent = {
  id: 'evt_test_webhook_2',
  object: 'event',
  type: 'payment_intent.succeeded',
  data: {
    object: {
      id: 'pi_test_123456789',
      object: 'payment_intent',
      amount: 2999,
      currency: 'usd'
    }
  }
};

async function testWebhookEndpoint(event, eventName) {
  console.log(`\n🧪 Testing ${eventName} webhook...`);
  
  try {
    const payload = JSON.stringify(event);
    
    const response = await fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: payload
    });
    
    const responseText = await response.text();
    
    if (response.ok) {
      console.log(`✅ ${eventName} webhook processed successfully`);
      console.log('📄 Response:', responseText);
    } else {
      console.log(`❌ ${eventName} webhook failed:`, response.status, responseText);
    }
    
  } catch (error) {
    console.error(`❌ Error testing ${eventName} webhook:`, error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting webhook endpoint tests...');
  console.log('📍 Testing endpoint:', WEBHOOK_URL);
  
  // Test if server is running
  try {
    const healthCheck = await fetch('http://localhost:3000/api/health').catch(() => null);
    if (!healthCheck) {
      console.log('⚠️  Development server may not be running on localhost:3000');
      console.log('   Please start the server with: npm run dev');
      return;
    }
  } catch (e) {
    // Continue with tests anyway
  }
  
  await testWebhookEndpoint(checkoutSessionEvent, 'checkout.session.completed');
  await testWebhookEndpoint(paymentIntentEvent, 'payment_intent.succeeded');
  
  console.log('\n✨ All webhook tests completed!');
  console.log('💡 Check your Firestore console to verify documents were created.');
}

// Run the tests
runTests().catch(console.error);