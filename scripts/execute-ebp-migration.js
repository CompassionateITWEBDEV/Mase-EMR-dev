/**
 * Execute Evidence-Based Practices SQL Migration
 * 
 * This script executes the create_evidence_based_practices_tables.sql file
 * directly against your Supabase database.
 * 
 * Usage:
 *   node scripts/execute-ebp-migration.js
 * 
 * Requirements:
 *   - DATABASE_URL or SUPABASE_DB_URL in .env.local
 *   - pg library installed: npm install pg
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
  console.error('❌ DATABASE_URL not found in .env.local\n')
  console.error('Please add one of these to your .env.local file:')
  console.error('  DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"')
  console.error('  SUPABASE_DB_URL="postgresql://..."')
  console.error('  POSTGRES_URL="postgresql://..."\n')
  console.error('Get the connection string from:')
  console.error('  Supabase Dashboard > Settings > Database > Connection string\n')
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
const sqlPath = path.join(__dirname, 'create_evidence_based_practices_tables.sql')
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
    
    console.log('🚀 Executing SQL migration...\n')
    console.log('='.repeat(70))
    
    // Execute the entire SQL script
    const result = await client.query(sql)
    
    console.log('='.repeat(70))
    console.log('✅ Migration executed successfully!\n')
    console.log('📊 Result:', result.command || 'Completed')
    
    // Verify tables were created
    console.log('\n🔍 Verifying tables...\n')
    const tables = [
      'evidence_based_practices',
      'ebp_fidelity_assessments',
      'ebp_staff_assignments',
      'ebp_patient_delivery',
      'ebp_outcomes'
    ]
    
    for (const table of tables) {
      const checkResult = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = $1
        )
      `, [table])
      
      if (checkResult.rows[0].exists) {
        console.log(`  ✅ ${table} - EXISTS`)
      } else {
        console.log(`  ❌ ${table} - NOT FOUND`)
      }
    }
    
    console.log('\n🎉 Evidence-Based Practices migration completed!')
    console.log('   You can now refresh your application.\n')
    
  } catch (error) {
    console.error('\n❌ Migration failed!\n')
    console.error('Error:', error.message)
    
    // Check for common errors
    if (error.message.includes('already exists')) {
      console.log('\n⚠️  Some objects already exist. This is usually okay.')
      console.log('   The migration will skip existing objects.\n')
    } else if (error.message.includes('permission denied')) {
      console.log('\n⚠️  Permission denied. Check your database credentials.')
    } else if (error.message.includes('connection')) {
      console.log('\n⚠️  Connection error. Check your DATABASE_URL.')
    } else {
      console.log('\n💡 If you see errors, you can:')
      console.log('   1. Copy the SQL from: scripts/create_evidence_based_practices_tables.sql')
      console.log('   2. Run it manually in Supabase SQL Editor')
      console.log('   3. Some errors (like "already exists") are safe to ignore\n')
    }
    
    process.exit(1)
  } finally {
    await client.end()
    console.log('🔌 Database connection closed\n')
  }
}

// Run the migration
executeSQL().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})

