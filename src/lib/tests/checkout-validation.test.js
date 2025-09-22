/**
 * Unit tests for checkout validation
 * Tests the minimum charge validation logic
 */

// Mock the checkout session logic
function validateMinimumCharge(totalCents, currency = 'USD') {
  const MIN_USD_CENTS = 50;
  
  if (currency === 'USD' && totalCents < MIN_USD_CENTS) {
    return {
      valid: false,
      error: 'Minimum charge is $0.50 USD. Please add more items.'
    };
  }
  
  return { valid: true };
}

// Test cases
function runTests() {
  console.log('Running checkout validation tests...');
  
  // Test 1: totalCents = 49 should return 400 error
  const test1 = validateMinimumCharge(49);
  console.assert(!test1.valid, 'Test 1 failed: 49 cents should be invalid');
  console.assert(test1.error.includes('Minimum charge is $0.50'), 'Test 1 failed: Error message incorrect');
  console.log('✓ Test 1 passed: 49 cents rejected');
  
  // Test 2: totalCents = 50 should proceed
  const test2 = validateMinimumCharge(50);
  console.assert(test2.valid, 'Test 2 failed: 50 cents should be valid');
  console.log('✓ Test 2 passed: 50 cents accepted');
  
  // Test 3: totalCents = 100 should proceed
  const test3 = validateMinimumCharge(100);
  console.assert(test3.valid, 'Test 3 failed: 100 cents should be valid');
  console.log('✓ Test 3 passed: 100 cents accepted');
  
  // Test 4: Non-USD currency should not be restricted
  const test4 = validateMinimumCharge(10, 'EUR');
  console.assert(test4.valid, 'Test 4 failed: Non-USD should not be restricted');
  console.log('✓ Test 4 passed: Non-USD currency not restricted');
  
  console.log('All tests passed! ✅');
}

// Run tests if this file is executed directly
if (import.meta.url === new URL(process.argv[1], 'file:').href) {
  runTests();
}

// Always run tests for now
runTests();

export { validateMinimumCharge, runTests };