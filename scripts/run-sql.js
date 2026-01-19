/**
 * Execute SQL Migration - Simple Terminal Command
 * 
 * Run: node scripts/run-sql.js
 * 
 * This script reads .env.local and executes the SQL migration
 */

const fs = require('fs')
const path = require('path')

// Simple .env.local parser (no dotenv dependency)
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

// Load environment variables
loadEnv()

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

async function executeSQL() {
  if (!SUPABASE_URL || !SERVICE_KEY) {
    console.error('❌ Missing Supabase credentials in .env.local')
    console.error('Required: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY')
    process.exit(1)
  }

  const sqlPath = path.join(__dirname, 'create_research_studies_tables.sql')
  
  if (!fs.existsSync(sqlPath)) {
    console.error(`❌ SQL file not found: ${sqlPath}`)
    process.exit(1)
  }

  const sql = fs.readFileSync(sqlPath, 'utf-8')

  console.log('🚀 Research Studies SQL Migration\n')
  console.log('='.repeat(70))

  // Extract project reference
  const match = SUPABASE_URL.match(/https?:\/\/([^.]+)\.supabase\.co/)
  if (!match) {
    console.error('❌ Invalid Supabase URL format')
    process.exit(1)
  }

  const projectRef = match[1]

  // Method 1: Try API route (if server is running)
  try {
    console.log('\n🔄 Attempting to execute via API route...')
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 2000)

    const response = await fetch('http://localhost:3000/api/research/migrate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sql }),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (response.ok) {
      const result = await response.json()
      console.log('✅ Migration executed successfully via API!')
      console.log(`   ${result.message}`)
      console.log(`   Successful: ${result.successful}, Errors: ${result.errors}`)
      return
    } else {
      const error = await response.text()
      console.log('⚠️  API returned error:', error.substring(0, 100))
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      console.log('⚠️  Server not running (timeout)')
    } else {
      console.log('⚠️  Server not accessible:', err.message)
    }
    console.log('   Using manual method instead...\n')
  }

  // Method 2: Provide instructions for manual execution
  console.log('\n📋 MANUAL EXECUTION INSTRUCTIONS:\n')
  console.log('Since direct SQL execution requires database access,')
  console.log('please run the SQL manually in Supabase SQL Editor:\n')
  console.log(`1. Open: https://supabase.com/dashboard/project/${projectRef}/sql/new`)
  console.log('2. Copy the SQL content below')
  console.log('3. Paste into the SQL Editor')
  console.log('4. Click "Run" button\n')
  console.log('='.repeat(70))
  console.log('SQL CONTENT TO COPY:')
  console.log('='.repeat(70))
  console.log(sql)
  console.log('='.repeat(70))
  console.log('\n✅ SQL content displayed above. Copy and paste into Supabase SQL Editor.')
}

executeSQL().catch((error) => {
  console.error('❌ Error:', error.message)
  process.exit(1)
})
