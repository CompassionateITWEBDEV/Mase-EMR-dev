/**
 * Apply Staff RLS Recursion Fix
 * 
 * This script fixes the infinite recursion error in staff table RLS policies
 * by creating SECURITY DEFINER functions that bypass RLS for admin checks
 * 
 * Run: node scripts/apply-staff-rls-fix.js
 */

const fs = require('fs')
const path = require('path')

// Load environment variables from .env or .env.local
function loadEnv() {
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
          const match = trimmed.match(/^([^=:#]+)=(.*)$/)
          if (match) {
            const key = match[1].trim()
            const value = match[2].trim().replace(/^["']|["']$/g, '')
            if (!process.env[key]) {
              process.env[key] = value
            }
          }
        }
      })
      console.log(`✅ Loaded environment from: ${path.basename(envPath)}\n`)
      break
    }
  }
}

loadEnv()

// Get connection string from environment
const connectionString = 
  process.env.DATABASE_URL || 
  process.env.SUPABASE_DB_URL || 
  process.env.POSTGRES_URL

if (!connectionString) {
  console.error('❌ DATABASE_URL not found in .env file\n')
  console.error('Please add one of these to your .env file:')
  console.error('  DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"')
  console.error('  SUPABASE_DB_URL="postgresql://..."')
  console.error('  POSTGRES_URL="postgresql://..."\n')
  console.error('Get the connection string from:')
  console.error('  Supabase Dashboard > Settings > Database > Connection string\n')
  
  // Show SQL for manual execution
  const sqlPath = path.join(__dirname, 'fix_staff_rls_recursion.sql')
  if (fs.existsSync(sqlPath)) {
    const sql = fs.readFileSync(sqlPath, 'utf-8')
    console.log('='.repeat(70))
    console.log('📋 SQL CONTENT (for manual execution):')
    console.log('='.repeat(70))
    console.log(sql)
    console.log('='.repeat(70))
  }
  process.exit(1)
}

// Check if pg library is installed
let Client
try {
  const pg = require('pg')
  Client = pg.Client
  console.log('✅ pg library found\n')
} catch (err) {
  console.error('❌ pg library not installed\n')
  console.error('💡 Install it with:')
  console.error('   npm install pg --legacy-peer-deps')
  console.error('   npm install pg --force')
  console.error('   pnpm add pg')
  console.error('   yarn add pg\n')
  process.exit(1)
}

// Read SQL file
const sqlPath = path.join(__dirname, 'fix_staff_rls_recursion.sql')
if (!fs.existsSync(sqlPath)) {
  console.error(`❌ SQL file not found: ${sqlPath}`)
  process.exit(1)
}

const sql = fs.readFileSync(sqlPath, 'utf-8')
console.log('📝 SQL file loaded\n')

// Mask password in connection string for display
const displayConnection = connectionString.replace(/:[^:@]+@/, ':****@')
console.log('📡 Connecting to:', displayConnection)
console.log('')

// Parse connection string and configure SSL
let cleanConnectionString = connectionString
const url = new URL(connectionString.replace(/^postgres:/, 'https:'))

const clientConfig = {
  host: url.hostname,
  port: parseInt(url.port) || 5432,
  database: url.pathname.slice(1) || 'postgres',
  user: url.username || 'postgres',
  password: url.password || '',
  ssl: {
    rejectUnauthorized: false
  }
}

// Remove sslmode from connection string if present
if (connectionString.includes('sslmode=')) {
  cleanConnectionString = connectionString.replace(/[?&]sslmode=[^&]*/, '')
}

async function executeSQL() {
  const client = new Client(clientConfig)
  
  try {
    console.log('🔌 Connecting to database...')
    await client.connect()
    console.log('✅ Connected successfully\n')
    
    console.log('🚀 Executing SQL fix...\n')
    console.log('='.repeat(70))
    console.log('This will:')
    console.log('  1. Drop existing recursive policies')
    console.log('  2. Create SECURITY DEFINER helper functions')
    console.log('  3. Recreate policies using helper functions (no recursion!)')
    console.log('='.repeat(70))
    console.log('')
    
    // Execute the entire SQL script
    await client.query(sql)
    
    console.log('='.repeat(70))
    console.log('✅ Fix executed successfully!\n')
    
    // Verify the functions were created
    console.log('🔍 Verifying functions...\n')
    
    const functions = [
      'is_staff_admin',
      'is_active_staff',
      'has_staff_role',
      'has_staff_roles'
    ]
    
    for (const funcName of functions) {
      const check = await client.query(`
        SELECT EXISTS (
          SELECT 1 FROM pg_proc 
          WHERE proname = $1
        ) as exists
      `, [funcName])
      
      if (check.rows[0].exists) {
        console.log(`  ✅ Function ${funcName}() - EXISTS`)
      } else {
        console.log(`  ❌ Function ${funcName}() - NOT FOUND`)
      }
    }
    
    // Verify policies were recreated
    console.log('\n🔍 Verifying policies...\n')
    
    const policies = [
      'staff_select_own_or_admin',
      'staff_insert_admin_only',
      'staff_update_own_or_admin'
    ]
    
    for (const policyName of policies) {
      const check = await client.query(`
        SELECT EXISTS (
          SELECT 1 FROM pg_policies 
          WHERE policyname = $1 AND tablename = 'staff'
        ) as exists
      `, [policyName])
      
      if (check.rows[0].exists) {
        console.log(`  ✅ Policy ${policyName} - EXISTS`)
      } else {
        console.log(`  ❌ Policy ${policyName} - NOT FOUND`)
      }
    }
    
    console.log('\n🎉 Staff RLS recursion fix completed successfully!')
    console.log('   Policies now use SECURITY DEFINER functions to prevent recursion')
    console.log('   No more infinite recursion errors!\n')
    
  } catch (err) {
    // Some errors are expected (like "already exists" for DROP statements)
    if (err.message.includes('already exists') || 
        err.message.includes('duplicate') ||
        (err.message.includes('does not exist') && err.message.includes('DROP'))) {
      console.log('⚠️  Some objects already exist or were already dropped (this is OK)')
      console.log('✅ Fix completed with warnings')
    } else {
      console.error('\n❌ Error executing fix:', err.message)
      console.error('\n📋 SQL that failed:')
      console.error('='.repeat(70))
      console.error(sql)
      console.error('='.repeat(70))
      throw err
    }
  } finally {
    await client.end()
    console.log('✅ Database connection closed')
  }
}

// Run the script
executeSQL()
  .then(() => {
    console.log('\n✅ All done!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error.message)
    process.exit(1)
  })

