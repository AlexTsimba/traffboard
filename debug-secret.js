// Test the exact secret from your setup
const { authenticator } = require('otplib');

// Configure the same way as the app
authenticator.options = {
  window: 1, // Allow ±30 seconds tolerance
  step: 30, // 30-second window
};

const exactSecret = 'NRYDWR25C5UGSYIY';
console.log('🔧 Testing exact secret:', exactSecret);

// Generate current token
const currentToken = authenticator.generate(exactSecret);
console.log('Current token should be:', currentToken);

// Test the provided code
const providedCode = '362045';
const isValid = authenticator.verify({
  token: providedCode,
  secret: exactSecret,
});

console.log('Is provided code valid?', isValid);

// Test with different time windows
console.log('\n🕐 Testing different time windows:');
const now = Math.floor(Date.now() / 1000);

for (let offset = -3; offset <= 3; offset++) {
  const testTime = now + (offset * 30); // 30-second windows
  const testToken = authenticator.generate(exactSecret, testTime);
  const testDate = new Date(testTime * 1000);
  console.log(`Window ${offset}: ${testToken} (${testDate.toISOString()})`);
  
  if (testToken === providedCode) {
    console.log('  ✅ MATCH! This is the correct window');
  }
}

// Also test if the secret needs padding
console.log('\n🔧 Testing secret variations:');
const variations = [
  exactSecret,
  exactSecret + '====', // Base32 padding
  exactSecret + '===',
  exactSecret + '==',
  exactSecret + '=',
];

variations.forEach((secret, index) => {
  try {
    const token = authenticator.generate(secret);
    console.log(`Variation ${index} (${secret}): ${token}`);
    if (token === providedCode) {
      console.log('  ✅ MATCH with this variation!');
    }
  } catch (error) {
    console.log(`Variation ${index}: ERROR - ${error.message}`);
  }
});
