// Test with your local time (01:17)
const { authenticator } = require('otplib');

const secret = 'EQSBSRQTMZSDG3LF';

// Your local time (01:17 - assuming today)
const yourTime = new Date();
yourTime.setHours(1, 17, 0, 0); // Set to 01:17

console.log('🕐 Time Analysis:');
console.log('Your local time: 01:17');
console.log('Server time from logs: 08:15:38');
console.log('Time difference: ~7 hours');

console.log('\n🔧 What your authenticator should show at 01:17:');
const yourExpectedCode = authenticator.generate(secret, Math.floor(yourTime.getTime() / 1000));
console.log('Expected code at your time:', yourExpectedCode);

console.log('\n🔧 What server expects at 08:15:');
const serverTime = new Date();
serverTime.setHours(8, 15, 0, 0);
const serverExpectedCode = authenticator.generate(secret, Math.floor(serverTime.getTime() / 1000));
console.log('Expected code at server time:', serverExpectedCode);

console.log('\n💡 Solutions:');
console.log('1. Sync your device time to the correct timezone');
console.log('2. Check if your server is in the wrong timezone');
console.log('3. Your device should show the current time as:', new Date().toISOString());

// Test different timezones
console.log('\n🌍 Testing different timezone offsets:');
const baseTime = new Date('2025-07-05T08:15:38.880Z'); // Server time
for (let offset = -12; offset <= 12; offset++) {
  const testTime = new Date(baseTime.getTime() + (offset * 60 * 60 * 1000));
  const code = authenticator.generate(secret, Math.floor(testTime.getTime() / 1000));
  console.log(`UTC${offset >= 0 ? '+' : ''}${offset}: ${code} (${testTime.toISOString().substr(11, 8)})`);
}
