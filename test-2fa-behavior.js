#!/usr/bin/env node

/**
 * 2FA Behavior Test Suite
 * Tests to debug why 2FA is not being enforced after enable
 */

const { PrismaClient } = require('@prisma/client');

async function test1_checkDatabaseState() {
  console.log('\n🔍 TEST 1: Database State After 2FA Enable');
  console.log('=' .repeat(50));
  
  const prisma = new PrismaClient();
  
  try {
    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: 'admin@traffboard.com' },
      include: { twoFactor: true }
    });
    
    if (!user) {
      console.log('❌ User not found in database');
      return false;
    }
    
    console.log('👤 User found:');
    console.log(`   ID: ${user.id}`);
    console.log(`   Email: ${user.email}`);
    console.log(`   twoFactorEnabled: ${user.twoFactorEnabled}`);
    console.log(`   TwoFactor record exists: ${!!user.twoFactor}`);
    
    if (user.twoFactor) {
      console.log(`   TwoFactor ID: ${user.twoFactor.id}`);
      console.log(`   Has secret: ${!!user.twoFactor.secret}`);
      console.log(`   Has backupCodes: ${!!user.twoFactor.backupCodes}`);
    }
    
    const isConfiguredCorrectly = user.twoFactorEnabled && user.twoFactor && user.twoFactor.secret;
    console.log(`\n✅ 2FA properly configured in DB: ${isConfiguredCorrectly}`);
    
    return isConfiguredCorrectly;
    
  } catch (error) {
    console.error('❌ Database test failed:', error instanceof Error ? error.message : 'Unknown error');
    return false;
  } finally {
    await prisma.$disconnect();
  }
}

async function test2_checkSessionData() {
  console.log('\n🔍 TEST 2: Session Data After Login');
  console.log('=' .repeat(50));
  
  try {
    // Test session endpoint directly
    const response = await fetch('http://localhost:3000/api/auth/session', {
      method: 'GET',
      credentials: 'include'
    });
    
    console.log(`Session API status: ${response.status}`);
    
    if (!response.ok) {
      console.log('❌ No active session found');
      return false;
    }
    
    const sessionData = await response.json();
    console.log('📋 Session data:');
    console.log(`   User ID: ${sessionData.user?.id}`);
    console.log(`   User email: ${sessionData.user?.email}`);
    console.log(`   twoFactorEnabled: ${sessionData.user?.twoFactorEnabled}`);
    console.log(`   twoFactorVerified: ${sessionData.twoFactorVerified}`);
    console.log(`   Session ID: ${sessionData.id}`);
    
    const shouldRequire2FA = sessionData.user?.twoFactorEnabled && !sessionData.twoFactorVerified;
    console.log(`\n✅ Should require 2FA verification: ${shouldRequire2FA}`);
    
    return {
      hasSession: true,
      twoFactorEnabled: sessionData.user?.twoFactorEnabled,
      twoFactorVerified: sessionData.twoFactorVerified,
      shouldRequire2FA
    };
    
  } catch (error) {
    console.error('❌ Session test failed:', error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
}

async function test3_testMiddlewareBehavior() {
  console.log('\n🔍 TEST 3: Middleware Behavior Test');
  console.log('=' .repeat(50));
  
  try {
    // Test protected route that should trigger middleware
    const protectedRoutes = ['/dashboard', '/preferences', '/reports/conversions'];
    
    for (const route of protectedRoutes) {
      console.log(`\n🔗 Testing route: ${route}`);
      
      const response = await fetch(`http://localhost:3000${route}`, {
        method: 'GET',
        credentials: 'include',
        redirect: 'manual' // Don't follow redirects automatically
      });
      
      console.log(`   Status: ${response.status}`);
      console.log(`   Redirect location: ${response.headers.get('location') || 'None'}`);
      
      if (response.status === 302) {
        const location = response.headers.get('location');
        if (location?.includes('/auth/two-factor')) {
          console.log('✅ Correctly redirected to 2FA page');
        } else if (location?.includes('/login')) {
          console.log('⚠️  Redirected to login (no session)');
        } else {
          console.log(`❌ Unexpected redirect: ${location}`);
        }
      } else if (response.status === 200) {
        console.log('❌ Route accessible without 2FA verification');
      }
    }
    
  } catch (error) {
    console.error('❌ Middleware test failed:', error instanceof Error ? error.message : 'Unknown error');
    return false;
  }
}

async function test4_checkBetterAuthEndpoints() {
  console.log('\n🔍 TEST 4: Better Auth API Endpoints');
  console.log('=' .repeat(50));
  
  const endpoints = [
    { path: '/api/auth/session', method: 'GET' },
    { path: '/api/auth/two-factor/get-totp-uri', method: 'POST', body: { password: 'somepass' } },
    { path: '/api/auth/two-factor/verify-totp', method: 'POST', body: { code: '123456' } }
  ];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`\n🔗 Testing: ${endpoint.method} ${endpoint.path}`);
      
      const options = {
        method: endpoint.method,
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      };
      
      if (endpoint.body) {
        options.body = JSON.stringify(endpoint.body);
      }
      
      const response = await fetch(`http://localhost:3000${endpoint.path}`, options);
      
      console.log(`   Status: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`   Response keys: ${Object.keys(data).join(', ')}`);
      } else {
        const errorText = await response.text();
        console.log(`   Error: ${errorText.substring(0, 100)}`);
      }
      
    } catch (error) {
      console.error(`   ❌ Failed: ${error.message}`);
    }
  }
}

async function runAllTests() {
  console.log('🚀 Starting 2FA Behavior Test Suite');
  console.log('=' .repeat(60));
  
  const results = {
    database: await test1_checkDatabaseState(),
    session: await test2_checkSessionData(),
    middleware: await test3_testMiddlewareBehavior(),
    api: await test4_checkBetterAuthEndpoints()
  };
  
  console.log('\n📊 SUMMARY');
  console.log('=' .repeat(30));
  console.log(`Database configured: ${results.database}`);
  console.log(`Session has 2FA data: ${results.session ? results.session.hasSession : false}`);
  console.log(`Should require 2FA: ${results.session ? results.session.shouldRequire2FA : 'Unknown'}`);
  
  console.log('\n🎯 DIAGNOSIS:');
  if (!results.database) {
    console.log('❌ Problem: 2FA not properly saved to database');
  } else if (results.session && !results.session.shouldRequire2FA) {
    if (!results.session.twoFactorEnabled) {
      console.log('❌ Problem: Session shows twoFactorEnabled = false');
    } else if (results.session.twoFactorVerified) {
      console.log('❌ Problem: Session shows twoFactorVerified = true (should be false)');
    }
  } else {
    console.log('❓ Database and session look correct - middleware issue?');
  }
}

// Run if called directly
if (require.main === module) {
  runAllTests().catch(console.error);
}

module.exports = { runAllTests };