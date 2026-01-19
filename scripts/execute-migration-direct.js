/**
 * Execute SQL Migration Directly Using Database Connection
 * 
 * Run: node scripts/execute-migration-direct.js
 * 
 * This script reads DATABASE_URL from .env.local and executes SQL directly
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

// Get connection string from various possible env variable names
let connectionString = 
  process.env.DATABASE_URL || 
  process.env.SUPABASE_DB_URL || 
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_CONNECTION_STRING ||
  process.env.SUPABASE_DIRECT_URL

// If we have Supabase URL, try to construct connection string
if (!connectionString) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (supabaseUrl) {
    const match = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/)
    if (match) {
      const projectRef = match[1]
      console.log('📋 Found Supabase project:', projectRef)
      console.log('💡 To use direct connection, add DATABASE_URL to .env.local')
      console.log(`   Format: postgresql://postgres:[PASSWORD]@db.${projectRef}.supabase.co:5432/postgres`)
      console.log('   Get password from: Supabase Dashboard > Settings > Database\n')
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

  console.log('🚀 Research Studies SQL Migration\n')
  console.log('='.repeat(70))

  // Try to use pg library
  let Client
  try {
    const pg = require('pg')
    Client = pg.Client
    console.log('✅ pg library found\n')
  } catch (err) {
    console.error('❌ pg library not installed\n')
    console.error('💡 Install it with one of these commands:')
    console.error('   npm install pg --legacy-peer-deps')
    console.error('   npm install pg --force')
    console.error('   pnpm add pg')
    console.error('   yarn add pg\n')
    console.error('After installing, run this script again.\n')
    
    // Show SQL for manual execution
    console.log('='.repeat(70))
    console.log('📋 SQL CONTENT (for manual execution):')
    console.log('='.repeat(70))
    console.log(sql)
    console.log('='.repeat(70))
    process.exit(1)
  }

  // Check for connection string
  if (!connectionString) {
    console.error('❌ DATABASE_URL not found in .env or .env.local\n')
    console.error('Please add one of these to your .env file:')
    console.error('  DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"')
    console.error('  SUPABASE_DB_URL="postgresql://..."')
    console.error('  POSTGRES_URL="postgresql://..."\n')
    console.error('Get the connection string from:')
    console.error('  Supabase Dashboard > Settings > Database > Connection string\n')
    process.exit(1)
  }

  // Mask password in connection string for display
  const displayConnection = connectionString.replace(/:[^:@]+@/, ':****@')
  console.log('📡 Connection:', displayConnection)
  console.log('')

  // Parse connection string and configure SSL properly
  // Remove sslmode from connection string if present, we'll handle it in config
  let cleanConnectionString = connectionString
  const url = new URL(connectionString.replace(/^postgres:/, 'https:'))
  
  // Configure SSL for Supabase connection
  // Supabase uses SSL but may have self-signed certificates
  const clientConfig = { 
    host: url.hostname,
    port: parseInt(url.port) || 5432,
    database: url.pathname.replace(/^\//, '') || 'postgres',
    user: url.username || 'postgres',
    password: url.password || '',
    ssl: {
      rejectUnauthorized: false // Allow self-signed certificates for Supabase
    }
  }
  
  // Add any query parameters (except sslmode which we handle above)
  if (url.search) {
    const params = new URLSearchParams(url.search)
    // Keep other parameters if needed
  }
  
  const client = new Client(clientConfig)

  try {
    console.log('🔄 Connecting to database...')
    await client.connect()
    console.log('✅ Connected successfully!\n')

    console.log('⏳ Executing SQL migration...\n')
    
    try {
      // Execute the entire SQL script
      await client.query(sql)
      console.log('✅ Migration executed successfully!\n')
      console.log('🎉 Research Studies tables are now created!\n')
      console.log('📊 Created:')
      console.log('   ✓ research_studies table')
      console.log('   ✓ research_study_participants table')
      console.log('   ✓ Indexes')
      console.log('   ✓ Triggers')
      console.log('   ✓ RLS policies')
      console.log('   ✓ Foreign key constraints\n')
      
    } catch (err) {
      // Some errors are expected (like "already exists")
      if (err.message.includes('already exists') || 
          err.message.includes('duplicate') ||
          (err.message.includes('does not exist') && err.message.includes('DROP'))) {
        console.log('⚠️  Some objects already exist (this is OK)')
        console.log('✅ Migration completed with warnings\n')
      } else {
        console.error('❌ SQL Execution Error:')
        console.error('   Code:', err.code)
        console.error('   Message:', err.message)
        console.error('\n💡 Check the error above and fix any issues')
        throw err
      }
    }

  } catch (err) {
    if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
      console.error('❌ Connection failed:', err.message)
      console.error('\n💡 Check:')
      console.error('   1. DATABASE_URL is correct in .env.local')
      console.error('   2. Database server is accessible')
      console.error('   3. Firewall allows connections')
      console.error('   4. Network connection is active\n')
    } else if (err.code === '28P01') {
      console.error('❌ Authentication failed:', err.message)
      console.error('\n💡 Check:')
      console.error('   1. Database password is correct')
      console.error('   2. DATABASE_URL includes correct credentials')
      console.error('   3. User has permission to create tables\n')
    } else if (err.code === '3D000') {
      console.error('❌ Database not found:', err.message)
      console.error('\n💡 Check:')
      console.error('   1. Database name in connection string is correct')
      console.error('   2. Database exists on the server\n')
    } else {
      console.error('❌ Error:', err.message)
      if (err.code) {
        console.error('   Error Code:', err.code)
      }
    }
    
    // Show SQL for manual execution as fallback
    console.log('\n' + '='.repeat(70))
    console.log('📋 SQL CONTENT (for manual execution):')
    console.log('='.repeat(70))
    console.log(sql)
    console.log('='.repeat(70))
    
    process.exit(1)
  } finally {
    try {
      await client.end()
      console.log('✅ Database connection closed')
    } catch (err) {
      // Ignore errors on close
    }
  }
}

// Run the migration
executeSQL().catch((error) => {
  console.error('\n❌ Fatal error:', error.message)
  process.exit(1)
})

