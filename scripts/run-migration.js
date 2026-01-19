/**
 * Simple SQL Migration Runner
 * 
 * Run: node scripts/run-migration.js
 * 
 * This script executes the SQL migration using Supabase REST API
 */

const fs = require('fs')
const path = require('path')

// Load .env.local
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ Missing environment variables!')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

async function runMigration() {
  try {
    console.log('🚀 Running Research Studies Migration...\n')

    // Read SQL file
    const sqlPath = path.join(__dirname, 'create_research_studies_tables.sql')
    const sql = fs.readFileSync(sqlPath, 'utf-8')

    console.log('✅ SQL file loaded\n')
    console.log('📝 Executing SQL via Supabase API...\n')

    // Execute SQL using Supabase Management API
    // We'll use the REST API endpoint for executing SQL
    const projectRef = SUPABASE_URL.match(/https?:\/\/([^.]+)\.supabase\.co/)?.[1]
    
    if (!projectRef) {
      throw new Error('Invalid Supabase URL format')
    }

    // Use Supabase Management API to execute SQL
    // Note: This requires the SQL to be executed via a function or direct connection
    // Since direct SQL execution isn't available via REST API, we'll provide instructions
    
    console.log('⚠️  Direct SQL execution via API is not available.')
    console.log('\n💡 To execute the SQL, you have two options:\n')
    
    console.log('OPTION 1: Use Supabase SQL Editor (Recommended)')
    console.log('   1. Open: https://supabase.com/dashboard/project/' + projectRef + '/sql/new')
    console.log('   2. Copy the contents of: scripts/create_research_studies_tables.sql')
    console.log('   3. Paste into SQL Editor')
    console.log('   4. Click "Run"\n')
    
    console.log('OPTION 2: Use Browser Migration Page')
    console.log('   1. Start your dev server: npm run dev')
    console.log('   2. Open: http://localhost:3000/research/migrate')
    console.log('   3. Click "Run Migration" button\n')

    // Try to create a migration via API route if available
    try {
      console.log('🔄 Attempting to execute via API route...\n')
      
      const response = await fetch('http://localhost:3000/api/research/migrate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sql }),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('✅ Migration executed successfully!')
        console.log(JSON.stringify(result, null, 2))
        return
      } else {
        const error = await response.text()
        console.log('⚠️  API route not available or server not running')
        console.log('   Error:', error.substring(0, 100))
      }
    } catch (err) {
      console.log('⚠️  Could not connect to API route (server may not be running)')
    }

    console.log('\n📋 SQL Content (copy this to Supabase SQL Editor):')
    console.log('='.repeat(60))
    console.log(sql)
    console.log('='.repeat(60))

  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

runMigration()

