/**
 * Test script for /api/patients authentication
 * 
 * Usage:
 *   node scripts/test-api-auth.js
 *   COOKIES="cookie1=value1; cookie2=value2" node scripts/test-api-auth.js
 *   ACCESS_TOKEN="token" node scripts/test-api-auth.js
 * 
 * This script tests both authenticated and unauthenticated requests
 * 
 * Note: Requires Node.js 18+ with fetch API support
 */

const BASE_URL = process.env.API_URL || 'http://localhost:3000';

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testEndpoint(url, options = {}) {
  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    const data = await response.json();
    
    return {
      status: response.status,
      ok: response.ok,
      data,
      headers: Object.fromEntries(response.headers.entries()),
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      error: error.message,
    };
  }
}

async function testUnauthenticatedRequest() {
  log('\n=== Test 1: Unauthenticated Request ===', 'blue');
  log('Testing /api/patients without authentication...', 'yellow');
  
  const result = await testEndpoint(`${BASE_URL}/api/patients`);
  
  if (result.status === 401) {
    log('✓ PASS: Correctly returned 401 Unauthorized', 'green');
    log(`  Status: ${result.status}`, 'green');
    log(`  Response: ${JSON.stringify(result.data, null, 2)}`, 'green');
  } else if (result.status === 200 && process.env.NODE_ENV !== 'production') {
    log('⚠ WARNING: Request succeeded in development mode', 'yellow');
    log(`  Status: ${result.status}`, 'yellow');
    log(`  Patients returned: ${result.data?.patients?.length || 0}`, 'yellow');
    log('  Note: This is expected in development mode', 'yellow');
  } else {
    log('✗ FAIL: Unexpected response', 'red');
    log(`  Status: ${result.status}`, 'red');
    log(`  Response: ${JSON.stringify(result.data, null, 2)}`, 'red');
  }
  
  return result;
}

async function testAuthenticatedRequest(cookies) {
  log('\n=== Test 2: Authenticated Request with Cookies ===', 'blue');
  log('Testing /api/patients with authentication cookies...', 'yellow');
  
  if (!cookies || cookies.length === 0) {
    log('⚠ SKIP: No cookies provided', 'yellow');
    log('  To test authenticated requests:', 'yellow');
    log('  1. Log in through the browser', 'yellow');
    log('  2. Copy cookies from DevTools → Application → Cookies', 'yellow');
    log('  3. Pass cookies as environment variable: COOKIES="cookie1=value1; cookie2=value2"', 'yellow');
    return null;
  }
  
  const result = await testEndpoint(`${BASE_URL}/api/patients`, {
    headers: {
      'Cookie': cookies,
    },
  });
  
  if (result.status === 200) {
    log('✓ PASS: Successfully authenticated', 'green');
    log(`  Status: ${result.status}`, 'green');
    log(`  Patients returned: ${result.data?.patients?.length || 0}`, 'green');
    if (result.data?.patients?.length > 0) {
      log(`  First patient: ${result.data.patients[0].first_name} ${result.data.patients[0].last_name}`, 'green');
    }
  } else if (result.status === 401) {
    log('✗ FAIL: Authentication failed', 'red');
    log(`  Status: ${result.status}`, 'red');
    log(`  Response: ${JSON.stringify(result.data, null, 2)}`, 'red');
    log('  Check if cookies are valid and not expired', 'yellow');
  } else {
    log('✗ FAIL: Unexpected response', 'red');
    log(`  Status: ${result.status}`, 'red');
    log(`  Response: ${JSON.stringify(result.data, null, 2)}`, 'red');
  }
  
  return result;
}

async function testWithBearerToken(accessToken) {
  log('\n=== Test 3: Authenticated Request with Bearer Token ===', 'blue');
  log('Testing /api/patients with Authorization header...', 'yellow');
  
  if (!accessToken) {
    log('⚠ SKIP: No access token provided', 'yellow');
    log('  To get an access token:', 'yellow');
    log('  1. Log in through the browser', 'yellow');
    log('  2. Open browser console and run:', 'yellow');
    log('     const { data: { session } } = await supabase.auth.getSession();', 'yellow');
    log('     console.log(session.access_token);', 'yellow');
    log('  3. Pass token as: ACCESS_TOKEN="your-token"', 'yellow');
    return null;
  }
  
  const result = await testEndpoint(`${BASE_URL}/api/patients`, {
    headers: {
      'Authorization': `Bearer ${accessToken}`,
    },
    credentials: 'include',
  });
  
  if (result.status === 200) {
    log('✓ PASS: Successfully authenticated with Bearer token', 'green');
    log(`  Status: ${result.status}`, 'green');
    log(`  Patients returned: ${result.data?.patients?.length || 0}`, 'green');
  } else if (result.status === 401) {
    log('✗ FAIL: Bearer token authentication failed', 'red');
    log(`  Status: ${result.status}`, 'red');
    log(`  Response: ${JSON.stringify(result.data, null, 2)}`, 'red');
    log('  Note: The API uses cookie-based auth, Bearer tokens may not work', 'yellow');
  } else {
    log('✗ FAIL: Unexpected response', 'red');
    log(`  Status: ${result.status}`, 'red');
    log(`  Response: ${JSON.stringify(result.data, null, 2)}`, 'red');
  }
  
  return result;
}

async function runTests() {
  log('API Authentication Test Suite', 'blue');
  log('='.repeat(50), 'blue');
  log(`Testing endpoint: ${BASE_URL}/api/patients`, 'blue');
  log(`Environment: ${process.env.NODE_ENV || 'development'}`, 'blue');
  
  // Test 1: Unauthenticated request
  await testUnauthenticatedRequest();
  
  // Test 2: Authenticated request with cookies
  const cookies = process.env.COOKIES;
  await testAuthenticatedRequest(cookies);
  
  // Test 3: Authenticated request with Bearer token
  const accessToken = process.env.ACCESS_TOKEN;
  await testWithBearerToken(accessToken);
  
  log('\n=== Test Summary ===', 'blue');
  log('To test authenticated requests:', 'yellow');
  log('1. Log in through browser at http://localhost:3000/auth/login', 'yellow');
  log('2. Get cookies from DevTools → Application → Cookies', 'yellow');
  log('3. Run: COOKIES="your-cookies" node scripts/test-api-auth.js', 'yellow');
  log('\nFor more details, see test-api-auth.md', 'yellow');
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { testUnauthenticatedRequest, testAuthenticatedRequest, testWithBearerToken };
