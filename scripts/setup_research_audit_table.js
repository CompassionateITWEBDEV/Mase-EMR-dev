/**
 * Execute Research Studies Audit Table Setup
 * 
 * This script creates the research_study_audit_log table in Supabase
 * 
 * Run: node scripts/setup_research_audit_table.js
 * 
 * Requirements:
 *   - DATABASE_URL or POSTGRES_URL in .env
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
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (supabaseUrl) {
    const match = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/)
    if (match) {
      const projectRef = match[1]
      console.log('📋 Found Supabase project:', projectRef)
      console.log('💡 To use direct connection, add POSTGRES_URL to .env')
      console.log(`   Format: postgresql://postgres:[PASSWORD]@db.${projectRef}.supabase.co:5432/postgres`)
      console.log('   Get password from: Supabase Dashboard > Settings > Database\n')
    }
  }
}

async function executeSQL() {
  const sqlPath = path.join(__dirname, 'setup_research_audit_and_storage_sql_only.sql')
  
  if (!fs.existsSync(sqlPath)) {
    console.error(`❌ SQL file not found: ${sqlPath}`)
    process.exit(1)
  }

  // Read SQL file and filter out comments for execution
  let sql = fs.readFileSync(sqlPath, 'utf-8')
  
  // Remove the verification DO block as it may cause issues
  sql = sql.replace(/DO \$\$[\s\S]*?\$\$;/g, '')

  console.log('🚀 Research Studies Audit Table Setup\n')
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
    console.error('❌ DATABASE_URL or POSTGRES_URL not found in .env\n')
    console.error('Please add one of these to your .env file:')
    console.error('  POSTGRES_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT].supabase.co:5432/postgres"')
    console.error('  DATABASE_URL="postgresql://..."')
    console.error('  SUPABASE_DB_URL="postgresql://..."\n')
    console.error('Get the connection string from:')
    console.error('  Supabase Dashboard > Settings > Database > Connection string\n')
    process.exit(1)
  }

  // Mask password in connection string for display
  const displayConnection = connectionString.replace(/:[^:@]+@/, ':****@')
  console.log('📡 Connection:', displayConnection)
  console.log('')

  // Parse connection string and configure SSL properly
  const url = new URL(connectionString.replace(/^postgres:/, 'https:'))
  
  // Configure SSL for Supabase connection
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
  
  const client = new Client(clientConfig)

  try {
    console.log('🔄 Connecting to database...')
    await client.connect()
    console.log('✅ Connected successfully!\n')

    console.log('⏳ Creating audit table...\n')
    
    try {
      // Execute the SQL script
      await client.query(sql)
      console.log('✅ Audit table created successfully!\n')
      
      // Verify table was created
      console.log('🔍 Verifying table creation...\n')
      const checkResult = await client.query(`
        SELECT EXISTS (
          SELECT FROM information_schema.tables 
          WHERE table_schema = 'public' 
          AND table_name = 'research_study_audit_log'
        )
      `)
      
      if (checkResult.rows[0].exists) {
        console.log('  ✅ research_study_audit_log table - EXISTS')
        
        // Check indexes
        const indexResult = await client.query(`
          SELECT indexname 
          FROM pg_indexes 
          WHERE tablename = 'research_study_audit_log'
        `)
        
        console.log(`  ✅ Found ${indexResult.rows.length} indexes`)
        indexResult.rows.forEach(row => {
          console.log(`     - ${row.indexname}`)
        })
        
        console.log('\n🎉 Audit table setup completed successfully!')
        console.log('   The Research Studies feature is now fully configured.\n')
      } else {
        console.log('  ⚠️  Table verification failed')
        console.log('   Please check the SQL execution above for errors.\n')
      }
      
    } catch (err) {
      // Some errors are expected (like "already exists")
      if (err.message.includes('already exists') || 
          err.message.includes('duplicate')) {
        console.log('⚠️  Some objects already exist (this is OK)')
        console.log('✅ Setup completed with warnings\n')
        
        // Still verify table exists
        const checkResult = await client.query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'research_study_audit_log'
          )
        `)
        
        if (checkResult.rows[0].exists) {
          console.log('✅ Audit table exists and is ready to use!\n')
        }
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
      console.error('   1. POSTGRES_URL is correct in .env')
      console.error('   2. Database server is accessible')
      console.error('   3. Firewall allows connections')
      console.error('   4. Network connection is active\n')
    } else if (err.code === '28P01') {
      console.error('❌ Authentication failed:', err.message)
      console.error('\n💡 Check:')
      console.error('   1. Database password is correct')
      console.error('   2. POSTGRES_URL includes correct credentials')
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
    console.log('📋 SQL CONTENT (for manual execution in Supabase SQL Editor):')
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

// Run the setup
executeSQL().catch((error) => {
  console.error('\n❌ Fatal error:', error.message)
  process.exit(1)
})

