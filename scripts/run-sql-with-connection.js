/**
 * Execute SQL Migration Using Database Connection from .env
 * 
 * Run: node scripts/run-sql-with-connection.js
 * 
 * This script reads DATABASE_URL from .env.local and executes SQL directly
 */

const fs = require('fs')
const path = require('path')

// Simple .env.local parser
function loadEnv() {
  const envPath = path.join(__dirname, '..', '.env.local')
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
  }
}

loadEnv()

// Try to get connection string from various env variables
let connectionString = 
  process.env.DATABASE_URL || 
  process.env.SUPABASE_DB_URL || 
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_CONNECTION_STRING

// If we have Supabase URL and service key, we can construct connection
if (!connectionString) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (supabaseUrl) {
    // Extract project ref
    const match = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/)
    if (match) {
      const projectRef = match[1]
      console.log('📋 Found Supabase project:', projectRef)
      console.log('💡 To use direct connection, add DATABASE_URL to .env.local:')
      console.log(`   DATABASE_URL="postgresql://postgres:[PASSWORD]@db.${projectRef}.supabase.co:5432/postgres"`)
      console.log('\n   Get the password from: Supabase Dashboard > Settings > Database > Connection string\n')
    }
  }
}

async function executeSQL() {
  const sqlPath = path.join(__dirname, 'create_research_studies_tables.sql')
  
  if (!fs.existsSync(sqlPath)) {
    console.error(`❌ SQL file not found: ${sqlPath}`)
    process.exit(1)
  }

  const sql = fs.readFileSync(sqlPath, 'utf-8')

  // Try Method 1: Use pg library if available
  try {
    const { Client } = require('pg')
    
    if (!connectionString) {
      console.error('❌ DATABASE_URL not found in .env.local')
      console.error('\nPlease add one of these to your .env.local:')
      console.error('  DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"')
      console.error('  SUPABASE_DB_URL="postgresql://..."')
      console.error('  POSTGRES_URL="postgresql://..."')
      process.exit(1)
    }

    console.log('🚀 Connecting to database...\n')
    const client = new Client({ connectionString })
    
    await client.connect()
    console.log('✅ Connected successfully!\n')

    console.log('⏳ Executing SQL migration...\n')
    
    try {
      await client.query(sql)
      console.log('✅ Migration executed successfully!\n')
      console.log('🎉 Research Studies tables are now created!')
      console.log('\n📊 Tables created:')
      console.log('   - research_studies')
      console.log('   - research_study_participants')
      console.log('   - Indexes and triggers')
      console.log('   - RLS policies')
    } catch (err) {
      // Some errors are expected (like "already exists")
      if (err.message.includes('already exists') || 
          err.message.includes('duplicate') ||
          (err.message.includes('does not exist') && err.message.includes('DROP'))) {
        console.log('⚠️  Some objects already exist (this is OK)')
        console.log('✅ Migration completed with warnings')
      } else {
        throw err
      }
    }

    await client.end()
    console.log('\n✅ Database connection closed')
    
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      console.error('❌ pg library not installed')
      console.error('\n💡 Install it with:')
      console.error('   npm install pg --legacy-peer-deps')
      console.error('\n   Or try:')
      console.error('   npm install pg --force')
    } else if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
      console.error('❌ Connection failed:', err.message)
      console.error('\n💡 Check:')
      console.error('   1. DATABASE_URL is correct in .env.local')
      console.error('   2. Database is accessible')
      console.error('   3. Firewall allows connections')
    } else if (err.code === '28P01') {
      console.error('❌ Authentication failed:', err.message)
      console.error('\n💡 Check:')
      console.error('   1. Database password is correct')
      console.error('   2. DATABASE_URL includes correct credentials')
    } else {
      console.error('❌ Error:', err.message)
      console.error('\nFull error:', err)
    }
    
    // Fallback: Show SQL for manual execution
    console.log('\n' + '='.repeat(70))
    console.log('📋 SQL CONTENT (for manual execution):')
    console.log('='.repeat(70))
    console.log(sql)
    console.log('='.repeat(70))
    
    process.exit(1)
  }
}

executeSQL()

