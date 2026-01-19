/**
 * Check Database Connection Configuration
 * 
 * Run: node scripts/check-db-connection.js
 * 
 * This script checks your .env.local and helps you set up DATABASE_URL
 */

const fs = require('fs')
const path = require('path')

// Load environment variables from .env or .env.local
function loadEnv() {
  // Try .env first, then .env.local
  const envPaths = [
    path.join(__dirname, '..', '.env'),
    path.join(__dirname, '..', '.env.local')
  ]
  
  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      const content = fs.readFileSync(envPath, 'utf-8')
      content.split('\n').forEach(line => {
        const trimmed = line.trim()
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...values] = trimmed.split('=')
          if (key && values.length) {
            const value = values.join('=').replace(/^["']|["']$/g, '')
            process.env[key.trim()] = value.trim()
          }
        }
      })
      console.log(`✅ Loaded environment from: ${path.basename(envPath)}\n`)
      break
    }
  }
}

loadEnv()

console.log('🔍 Checking Database Connection Configuration...\n')
console.log('='.repeat(70))

// Check for various connection string formats
const connectionVars = {
  'DATABASE_URL': process.env.DATABASE_URL,
  'SUPABASE_DB_URL': process.env.SUPABASE_DB_URL,
  'POSTGRES_URL': process.env.POSTGRES_URL,
  'POSTGRES_CONNECTION_STRING': process.env.POSTGRES_CONNECTION_STRING,
  'SUPABASE_DIRECT_URL': process.env.SUPABASE_DIRECT_URL,
}

let foundConnection = false

console.log('📋 Checking for connection strings:')
for (const [key, value] of Object.entries(connectionVars)) {
  if (value) {
    console.log(`   ✅ ${key}: Found`)
    // Mask password
    const masked = value.replace(/:[^:@]+@/, ':****@')
    console.log(`      ${masked}`)
    foundConnection = true
  } else {
    console.log(`   ❌ ${key}: Not found`)
  }
}

console.log('')

// Check for Supabase configuration
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('📋 Checking Supabase configuration:')
if (supabaseUrl) {
  console.log(`   ✅ NEXT_PUBLIC_SUPABASE_URL: Found`)
  console.log(`      ${supabaseUrl}`)
  
  const match = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/)
  if (match) {
    const projectRef = match[1]
    console.log(`   📦 Project Reference: ${projectRef}`)
  }
} else {
  console.log(`   ❌ NEXT_PUBLIC_SUPABASE_URL: Not found`)
}

if (serviceKey) {
  console.log(`   ✅ SUPABASE_SERVICE_ROLE_KEY: Found (${serviceKey.substring(0, 20)}...)`)
} else {
  console.log(`   ❌ SUPABASE_SERVICE_ROLE_KEY: Not found`)
}

console.log('')

if (foundConnection) {
  console.log('✅ Database connection string found!')
  console.log('   You can now run: node scripts/execute-migration-direct.js\n')
} else {
  console.log('❌ No database connection string found\n')
  
  if (supabaseUrl) {
    const match = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/)
    if (match) {
      const projectRef = match[1]
      console.log('💡 To get your DATABASE_URL:\n')
      console.log('   Option 1: From Supabase Dashboard')
      console.log('   1. Go to: https://supabase.com/dashboard/project/' + projectRef + '/settings/database')
      console.log('   2. Scroll to "Connection string"')
      console.log('   3. Copy the "URI" format')
      console.log('   4. Add to .env.local as: DATABASE_URL="postgresql://..."\n')
      
      console.log('   Option 2: Construct from Supabase URL')
      console.log('   Format: postgresql://postgres:[PASSWORD]@db.' + projectRef + '.supabase.co:5432/postgres')
      console.log('   You need the database password from Supabase Dashboard\n')
      
      console.log('   Option 3: Use Connection Pooling (Recommended)')
      console.log('   Format: postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres')
      console.log('   Get this from: Settings > Database > Connection Pooling\n')
    }
  } else {
    console.log('💡 Add DATABASE_URL to your .env file:')
    console.log('   DATABASE_URL="postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/[DATABASE]"\n')
  }
  
  console.log('='.repeat(70))
  console.log('📝 After adding DATABASE_URL, run:')
  console.log('   node scripts/execute-migration-direct.js\n')
}

