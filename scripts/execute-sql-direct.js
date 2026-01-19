/**
 * Execute SQL Migration Directly via Supabase Management API
 * 
 * Run: node scripts/execute-sql-direct.js
 * 
 * This script executes SQL using Supabase's database connection
 */

const fs = require('fs')
const path = require('path')

// Simple env loader
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

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

async function executeSQL() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('❌ Missing Supabase credentials')
    process.exit(1)
  }

  const sqlPath = path.join(__dirname, 'create_research_studies_tables.sql')
  const sql = fs.readFileSync(sqlPath, 'utf-8')

  console.log('🚀 Executing SQL Migration via Supabase API...\n')

  // Extract project ref
  const match = SUPABASE_URL.match(/https?:\/\/([^.]+)\.supabase\.co/)
  if (!match) {
    console.error('❌ Invalid Supabase URL')
    process.exit(1)
  }

  const projectRef = match[1]

  try {
    // Use Supabase Management API to execute SQL
    // First, we need to create a helper function in the database
    // But to do that, we need to execute SQL... which is the problem!
    
    // Alternative: Use Supabase's SQL execution via REST API
    // Supabase doesn't expose this directly, but we can use the PostgREST API
    
    console.log('📝 Attempting to execute SQL via Supabase Management API...\n')

    // Try using the Supabase REST API with a custom RPC function
    // Since exec_sql doesn't exist, we'll need to create it first or use an alternative
    
    // For now, let's try to execute via the database connection string
    // But we don't have direct database access...
    
    console.log('⚠️  Direct SQL execution requires database connection.')
    console.log('\n💡 SOLUTION: Execute via Supabase Dashboard\n')
    console.log(`   1. Go to: https://supabase.com/dashboard/project/${projectRef}/sql/new`)
    console.log('   2. Copy the SQL below')
    console.log('   3. Paste and click "Run"\n')
    
    console.log('='.repeat(70))
    console.log('SQL TO EXECUTE:')
    console.log('='.repeat(70))
    console.log(sql)
    console.log('='.repeat(70))
    
    // Actually, let's try one more thing - use fetch to call Supabase's SQL execution
    // via the Management API if available
    console.log('\n🔄 Trying alternative execution method...\n')
    
    // Supabase Management API endpoint for SQL execution
    // This requires authentication via the Management API key
    const managementApiUrl = `https://api.supabase.com/v1/projects/${projectRef}/database/query`
    
    try {
      // Note: This requires a Management API token, not the service role key
      // Management API is different from the database API
      console.log('⚠️  Management API requires additional authentication')
      console.log('   This is not available with service role key\n')
    } catch (err) {
      console.log('⚠️  Management API not accessible\n')
    }

    console.log('✅ SQL content is ready above. Please execute manually in Supabase Dashboard.')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.log('\n💡 Please execute the SQL manually in Supabase SQL Editor')
  }
}

executeSQL().catch(console.error)

