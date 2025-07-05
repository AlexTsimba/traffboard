// Test TOTP generation and verification
const { authenticator } = require('otplib');

console.log('🔧 Testing TOTP Configuration...\n');

// Test with the exact same configuration as the app
authenticator.options = {
  window: 1, // Allow ±30 seconds tolerance
  step: 30, // 30-second window
};

console.log('Current TOTP options:', authenticator.options);

// Generate a test secret
const testSecret = 'MIVD2OQLMQRGU5ZSMFRHE2DKPB4SA5CN'; // Example secret similar to yours

console.log('Test secret:', testSecret);

// Generate current token
const currentToken = authenticator.generate(testSecret);
console.log('Generated token:', currentToken);

// Test verification
const isValid = authenticator.verify({
  token: currentToken,
  secret: testSecret,
});

console.log('Verification result:', isValid);

// Test with your exact secret format
console.log('\n🔍 Testing with your secret format...');
const yourSecret = 'MIVD2OQLMQ'; // First part you showed
console.log('Your secret (partial):', yourSecret);

try {
  const yourToken = authenticator.generate(yourSecret + 'RGUXXXXXXXXXXXXXXXXX'); // Padding to make valid length
  console.log('Your token would be:', yourToken);
} catch (error) {
  console.log('❌ Error generating with your secret:', error.message);
}

console.log('\n⏰ Time info:');
console.log('Current time:', new Date().toISOString());
console.log('Current timestamp:', Math.floor(Date.now() / 1000));
console.log('Current 30-second window:', Math.floor(Date.now() / 30000));
