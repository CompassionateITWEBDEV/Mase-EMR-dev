/**
 * Execute Fidelity Calculation Migration Directly Using Database Connection
 * 
 * Run: node scripts/execute-fidelity-migration.js
 * 
 * This script reads DATABASE_URL from .env and executes the fidelity calculation
 * update SQL directly to the database, updating the trigger function.
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
      return true
    }
  }
  return false
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
  
  if (supabaseUrl) {
    const match = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/)
    if (match) {
      const projectRef = match[1]
      console.log('📋 Found Supabase project:', projectRef)
      console.log('💡 To use direct connection, add DATABASE_URL to .env')
      console.log(`   Format: postgresql://postgres:[PASSWORD]@db.${projectRef}.supabase.co:5432/postgres`)
      console.log('   Get password from: Supabase Dashboard > Settings > Database\n')
    }
  }
}

async function executeSQL() {
  const sqlPath = path.join(__dirname, 'update_fidelity_calculation.sql')
  
  if (!fs.existsSync(sqlPath)) {
    console.error(`❌ SQL file not found: ${sqlPath}`)
    process.exit(1)
  }

  const sql = fs.readFileSync(sqlPath, 'utf-8')

  console.log('🚀 Fidelity Calculation Migration\n')
  console.log('='.repeat(70))
  console.log('📝 This migration updates the fidelity score trigger to use')
  console.log('   the new weighted formula:')
  console.log('   • Latest Assessment: 50% weight')
  console.log('   • Historical Average: 30% weight')
  console.log('   • Trend Bonus: ±10 points')
  console.log('   • Consistency Bonus: 0-10 points')
  console.log('='.repeat(70))
  console.log('')

  // Try to use pg library
  let Client
  try {
    const pg = require('pg')
    Client = pg.Client
    console.log('✅ pg library found\n')
  } catch (err) {
    console.error('❌ pg library not installed\n')
    console.error('💡 Install it with: npm install pg --legacy-peer-deps\n')
    
    // Show SQL for manual execution
    console.log('='.repeat(70))
    console.log('📋 SQL CONTENT (for manual execution in Supabase Dashboard):')
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
    
    // Show SQL for manual execution
    console.log('='.repeat(70))
    console.log('📋 SQL CONTENT (for manual execution in Supabase Dashboard):')
    console.log('='.repeat(70))
    console.log(sql)
    console.log('='.repeat(70))
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
    password: decodeURIComponent(url.password || ''),
    ssl: {
      rejectUnauthorized: false // Allow self-signed certificates for Supabase
    }
  }
  
  const client = new Client(clientConfig)

  try {
    console.log('🔄 Connecting to database...')
    await client.connect()
    console.log('✅ Connected successfully!\n')

    console.log('⏳ Executing fidelity migration SQL...\n')
    
    try {
      // Execute the entire SQL script
      await client.query(sql)
      console.log('✅ Migration executed successfully!\n')
      console.log('🎉 Fidelity calculation trigger has been updated!\n')
      console.log('📊 Changes applied:')
      console.log('   ✓ Dropped old trigger_update_fidelity_score trigger')
      console.log('   ✓ Created new update_ebp_fidelity_score() function')
      console.log('   ✓ Created new trigger with weighted formula')
      console.log('   ✓ Added function documentation comment\n')
      console.log('✨ Future fidelity assessments will now use the weighted formula!')
      console.log('')
      console.log('📋 Next Steps:')
      console.log('   1. To recalculate existing EBP scores, run:')
      console.log('      curl -X POST http://localhost:3000/api/evidence-based-practices/migrate-fidelity')
      console.log('   2. Or add new assessments to see the formula in action')
      console.log('')
      
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
      console.error('   1. DATABASE_URL is correct in .env')
      console.error('   2. Database server is accessible')
      console.error('   3. Network connection is active\n')
    } else if (err.code === '28P01') {
      console.error('❌ Authentication failed:', err.message)
      console.error('\n💡 Check:')
      console.error('   1. Database password is correct')
      console.error('   2. DATABASE_URL includes correct credentials\n')
    } else if (err.code === '3D000') {
      console.error('❌ Database not found:', err.message)
      console.error('\n💡 Check database name in connection string\n')
    } else {
      console.error('❌ Error:', err.message)
      if (err.code) {
        console.error('   Error Code:', err.code)
      }
    }
    
    // Show SQL for manual execution as fallback
    console.log('\n' + '='.repeat(70))
    console.log('📋 SQL CONTENT (for manual execution in Supabase Dashboard):')
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
console.log('')
console.log('╔════════════════════════════════════════════════════════════════════╗')
console.log('║          FIDELITY CALCULATION TRIGGER MIGRATION                     ║')
console.log('╚════════════════════════════════════════════════════════════════════╝')
console.log('')

executeSQL().catch((error) => {
  console.error('\n❌ Fatal error:', error.message)
  process.exit(1)
})

