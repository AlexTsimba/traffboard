// Test the latest attempt with explicit window
const { authenticator } = require('otplib');

const secret = 'EQSBSRQTMZSDG3LF';
const userCode = '304913';
const serverTime = new Date('2025-07-05T08:15:38.880Z');

console.log('🔧 Testing latest scenario with explicit window:');
console.log('Secret:', secret);
console.log('Your code:', userCode);
console.log('Server time:', serverTime.toISOString());

// Test without window (current behavior)
const isValid1 = authenticator.verify({
  token: userCode,
  secret: secret,
});
console.log('Verify without window:', isValid1);

// Test with explicit window=1 (what I just fixed)
const isValid2 = authenticator.verify({
  token: userCode,
  secret: secret,
  window: 1,
});
console.log('Verify with window=1:', isValid2);

// Test with larger window
const isValid3 = authenticator.verify({
  token: userCode,
  secret: secret,
  window: 2,
});
console.log('Verify with window=2:', isValid3);

// Test what the expected token should be
const expectedToken = authenticator.generate(secret, Math.floor(serverTime.getTime() / 1000));
console.log('Expected token at server time:', expectedToken);

// Test current token
const currentToken = authenticator.generate(secret);
console.log('Current token:', currentToken);

console.log('\n⏰ Testing time windows around server time:');
const baseTimestamp = Math.floor(serverTime.getTime() / 1000);

for (let offset = -3; offset <= 3; offset++) {
  const testTime = baseTimestamp + (offset * 30);
  const token = authenticator.generate(secret, testTime);
  const testDate = new Date(testTime * 1000);
  
  console.log(`Window ${offset}: ${token} (${testDate.toISOString().substr(11, 8)})`);
  
  if (token === userCode) {
    console.log(`  ✅ YOUR CODE MATCHES at window ${offset}!`);
  }
}
