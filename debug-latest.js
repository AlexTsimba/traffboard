// Test the exact scenario from your latest attempt
const { authenticator } = require('otplib');

const exactSecret = 'IJTTAU3QAYXWIX3W';
const yourCode = '796997';
const serverTime = new Date('2025-07-05T08:07:15.545Z').getTime();

console.log('🔧 Testing exact scenario:');
console.log('Secret:', exactSecret);
console.log('Your code:', yourCode);
console.log('Server time:', new Date(serverTime).toISOString());

// Test at the exact server time
const expectedToken = authenticator.generate(exactSecret, Math.floor(serverTime / 1000));
console.log('Expected at server time:', expectedToken);

// Test current time
const currentToken = authenticator.generate(exactSecret);
console.log('Current token:', currentToken);

// Test if your code would be valid at any time window (±5 minutes)
console.log('\n⏰ Testing time windows (±5 minutes):');
const baseTime = Math.floor(serverTime / 1000);

for (let offset = -10; offset <= 10; offset++) {
  const testTime = baseTime + (offset * 30); // 30-second windows
  const testToken = authenticator.generate(exactSecret, testTime);
  const testDate = new Date(testTime * 1000);
  
  if (testToken === yourCode) {
    console.log(`✅ MATCH at offset ${offset}: ${testToken} (${testDate.toISOString()})`);
    const timeDiff = (testTime - baseTime);
    console.log(`   Time difference: ${timeDiff} seconds (${timeDiff/60} minutes)`);
  }
}

// Test if this might be a Base32 encoding issue
console.log('\n🔧 Testing Base32 variations:');
const variations = [
  exactSecret,
  exactSecret.replace(/[IL]/g, '1').replace(/[O]/g, '0'), // Common confusion
  exactSecret.replace(/[1]/g, 'I').replace(/[0]/g, 'O'), // Reverse confusion
];

variations.forEach((secret, index) => {
  try {
    const token = authenticator.generate(secret);
    console.log(`Variation ${index} (${secret}): ${token}`);
    if (token === yourCode) {
      console.log('  ✅ MATCH with this variation!');
    }
  } catch (error) {
    console.log(`Variation ${index}: ERROR - ${error.message}`);
  }
});

console.log('\n📱 Debug your authenticator app:');
console.log('1. Check that the account name shows: TraffBoard (test@traffboard.com)');
console.log('2. Verify the code is 6 digits and changes every 30 seconds');
console.log('3. Make sure your device time is synchronized');
console.log('4. The secret should be:', exactSecret);
