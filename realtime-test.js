// Real-time TOTP verification tool
const { authenticator } = require('otplib');

const secret = 'IJTTAU3QAYXWIX3W'; // Your latest secret

console.log('🔧 Real-time TOTP Testing Tool');
console.log('================================');
console.log('Secret:', secret);
console.log('Current time:', new Date().toISOString());
console.log('');

function testCode() {
  const currentToken = authenticator.generate(secret);
  const now = new Date();
  const secondsInWindow = now.getSeconds() % 30;
  const timeRemaining = 30 - secondsInWindow;
  
  console.log(`⏰ Current token: ${currentToken} (expires in ${timeRemaining}s)`);
  
  // Test if any provided code would be valid
  const testCodes = ['796997', '068267', '894569']; // Your previous codes
  testCodes.forEach(code => {
    const isValid = authenticator.verify({ token: code, secret });
    console.log(`   Testing ${code}: ${isValid ? '✅ VALID' : '❌ Invalid'}`);
  });
  
  console.log('');
}

// Run immediately
testCode();

// Run every 5 seconds to see the progression
const interval = setInterval(testCode, 5000);

console.log('🎯 Instructions:');
console.log('1. Add this secret to your authenticator app manually: ' + secret);
console.log('2. Watch the current token above');
console.log('3. When your app shows the same token, enter it in the 2FA setup');
console.log('4. Press Ctrl+C to stop this tool');
console.log('');

// Stop after 2 minutes
setTimeout(() => {
  clearInterval(interval);
  console.log('Tool stopped. Try the verification now!');
  process.exit(0);
}, 120000);
