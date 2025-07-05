// Test default otplib configuration
const { authenticator } = require('otplib');

console.log('🔧 Default otplib configuration:');
console.log(authenticator.options);

const secret = 'IJTTAU3QAYXWIX3W';
const userCode = '286549';

// Test without any configuration changes
console.log('\n⏰ Testing with default settings:');
const token = authenticator.generate(secret);
console.log('Current token:', token);

const isValid = authenticator.verify({
  token: userCode,
  secret: secret,
});
console.log('Is your code valid with defaults?', isValid);

// Now configure like the app should be
authenticator.options = {
  ...authenticator.options,
  window: 1,
  step: 30,
};

console.log('\n🔧 After setting window=1, step=30:');
console.log(authenticator.options);

const token2 = authenticator.generate(secret);
console.log('Current token:', token2);

const isValid2 = authenticator.verify({
  token: userCode,
  secret: secret,
});
console.log('Is your code valid now?', isValid2);
