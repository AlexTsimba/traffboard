// Test the exact time/code scenario
const { authenticator } = require('otplib');

// Configure exactly like the app
authenticator.options = {
  window: 1,
  step: 30,
};

const secret = 'IJTTAU3QAYXWIX3W';
const serverTime = new Date('2025-07-05T08:10:51.836Z').getTime();
const userCode = '286549';
const expectedCode = '282363';

console.log('🔧 Testing exact time scenario:');
console.log('Secret:', secret);
console.log('Server time:', new Date(serverTime).toISOString());
console.log('Your code:', userCode);
console.log('Expected code:', expectedCode);

// Test with window tolerance
console.log('\n⏰ Testing TOTP verification with window:');
const baseTimestamp = Math.floor(serverTime / 1000);

const result1 = authenticator.verify({
  token: userCode,
  secret: secret,
});
console.log('Standard verify result:', result1);

// Test manual verification with different windows
console.log('\nTesting different time windows:');
for (let window = -3; window <= 3; window++) {
  const testTime = baseTimestamp + (window * 30);
  const token = authenticator.generate(secret, testTime);
  const testDate = new Date(testTime * 1000);
  
  console.log(`Window ${window}: ${token} (${testDate.toISOString().substr(11, 8)})`);
  
  if (token === userCode) {
    console.log(`  ✅ YOUR CODE MATCHES at window ${window}!`);
    const timeDiff = window * 30;
    console.log(`  Time difference: ${timeDiff} seconds`);
  }
}

// Test the otplib window configuration
console.log('\n🔧 Testing otplib window configuration:');
console.log('Current otplib options:', authenticator.options);

// Test verify with explicit window
const verifyWithWindow = authenticator.verify({
  token: userCode,
  secret: secret,
  window: 2, // Try with larger window
});
console.log('Verify with window=2:', verifyWithWindow);

// Test check if codes are systematically offset
console.log('\n📊 Code analysis:');
console.log('Your code:    ', userCode);
console.log('Expected code:', expectedCode);
const diff = parseInt(userCode) - parseInt(expectedCode);
console.log('Difference:   ', diff);
console.log('This suggests a potential time offset of ~', Math.abs(diff), 'units');
