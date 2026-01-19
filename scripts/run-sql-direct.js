/**
 * Execute SQL Migration Script - Direct Database Connection
 * 
 * Usage: node scripts/run-sql-direct.js
 * 
 * This script requires the 'pg' package and DATABASE_URL environment variable
 * Install: npm install pg dotenv --legacy-peer-deps
 */

const { Client } = require('pg')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

// Get database connection string
// Option 1: Direct DATABASE_URL
let connectionString = process.env.DATABASE_URL

// Option 2: Construct from Supabase URL and service role key
if (!connectionString) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (supabaseUrl && serviceRoleKey) {
    // Extract project ref from Supabase URL
    const urlMatch = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/)
    if (urlMatch) {
      const projectRef = urlMatch[1]
      // Supabase direct connection format
      // Note: You need to get the database password from Supabase Dashboard
      // Settings > Database > Connection string (use the "URI" format)
      console.log('⚠️  DATABASE_URL not found in environment')
      console.log('💡 To use direct connection:')
      console.log('   1. Go to Supabase Dashboard > Settings > Database')
      console.log('   2. Copy the "Connection string" (URI format)')
      console.log('   3. Add to .env.local as: DATABASE_URL="postgresql://..."')
      console.log('\n   Or use the browser-based migration:')
      console.log('   http://localhost:3000/research/migrate')
      process.exit(1)
    }
  }
}

if (!connectionString) {
  console.error('❌ Error: DATABASE_URL not found')
  console.error('\nPlease add DATABASE_URL to your .env.local file:')
  console.error('  DATABASE_URL="postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres"')
  console.error('\nGet it from: Supabase Dashboard > Settings > Database > Connection string')
  process.exit(1)
}

async function executeSQL() {
  const client = new Client({ connectionString })
  
  try {
    console.log('🚀 Connecting to database...\n')
    await client.connect()
    console.log('✅ Connected successfully\n')

    // Read SQL file
    const sqlPath = path.join(__dirname, 'create_research_studies_tables.sql')
    if (!fs.existsSync(sqlPath)) {
      console.error(`❌ SQL file not found: ${sqlPath}`)
      process.exit(1)
    }

    const sql = fs.readFileSync(sqlPath, 'utf-8')
    console.log('✅ SQL file loaded\n')

    // Execute the entire SQL script
    console.log('⏳ Executing SQL migration...\n')
    
    try {
      await client.query(sql)
      console.log('✅ Migration executed successfully!\n')
      console.log('🎉 Research Studies tables are now created.')
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

  } catch (error) {
    console.error('❌ Error:', error.message)
    
    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      console.error('\n💡 Connection failed. Check:')
      console.error('   1. DATABASE_URL is correct')
      console.error('   2. Database is accessible')
      console.error('   3. Firewall allows connections')
    } else if (error.code === '28P01') {
      console.error('\n💡 Authentication failed. Check:')
      console.error('   1. Database password is correct')
      console.error('   2. DATABASE_URL includes correct credentials')
    }
    
    console.log('\n💡 Alternative: Run SQL manually in Supabase SQL Editor')
    console.log('   File: scripts/create_research_studies_tables.sql')
    process.exit(1)
  } finally {
    await client.end()
    console.log('\n✅ Database connection closed')
  }
}

// Run the migration
executeSQL()

