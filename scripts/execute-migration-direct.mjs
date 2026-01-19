/**
 * Direct SQL Execution Script
 * This attempts to execute the SQL via Supabase REST API
 */

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Get environment variables from process.env (should be set in .env.local)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Error: Missing Supabase credentials')
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

async function executeSQL() {
  try {
    console.log('🚀 Executing Research Studies Migration...\n')

    // Read SQL file
    const sqlPath = join(__dirname, 'create_research_studies_tables.sql')
    const sql = readFileSync(sqlPath, 'utf-8')

    console.log('📝 SQL file loaded\n')
    console.log('⚠️  Supabase JS client cannot execute raw SQL directly.')
    console.log('The SQL needs to be run in Supabase SQL Editor.\n')
    console.log('📋 SQL Content (copy this):\n')
    console.log('='.repeat(60))
    console.log(sql)
    console.log('='.repeat(60))
    console.log('\n💡 Instructions:')
    console.log('1. Copy the SQL above')
    console.log('2. Go to: https://supabase.com/dashboard')
    console.log('3. Select your project > SQL Editor > New Query')
    console.log('4. Paste and click "Run"\n')

    // Try to check if tables exist
    try {
      const response = await fetch(`${supabaseUrl}/rest/v1/research_studies?select=id&limit=1`, {
        headers: {
          apikey: serviceRoleKey,
          Authorization: `Bearer ${serviceRoleKey}`,
        },
      })

      if (response.ok) {
        console.log('✅ research_studies table already exists!')
      } else if (response.status === 404 || response.status === 406) {
        console.log('❌ research_studies table does not exist - migration needed')
      }
    } catch (err) {
      // Table doesn't exist, which is expected
      console.log('ℹ️  Cannot verify table existence (this is OK)')
    }

  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

executeSQL()

