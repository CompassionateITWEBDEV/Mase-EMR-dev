/**
 * Execute Research Studies Migration
 * Run with: node scripts/run-migration.mjs
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import 'dotenv/config'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Error: Missing environment variables')
  console.error('Make sure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function executeMigration() {
  try {
    console.log('🚀 Starting Research Studies Migration...\n')

    // Read SQL file
    const sqlPath = join(__dirname, 'create_research_studies_tables.sql')
    const sql = readFileSync(sqlPath, 'utf-8')

    console.log('📝 SQL file loaded successfully\n')
    console.log('⚠️  Note: Supabase JS client cannot execute raw SQL directly.')
    console.log('Please use one of these methods:\n')
    console.log('METHOD 1: Supabase Dashboard (Easiest)')
    console.log('  1. Go to: https://supabase.com/dashboard')
    console.log('  2. Select your project')
    console.log('  3. Click "SQL Editor" in left sidebar')
    console.log('  4. Click "New Query"')
    console.log('  5. Copy the SQL from: scripts/create_research_studies_tables.sql')
    console.log('  6. Paste and click "Run"\n')

    console.log('METHOD 2: Use the Migration Page')
    console.log('  1. Start your dev server: npm run dev')
    console.log('  2. Go to: http://localhost:3000/research/migrate')
    console.log('  3. Click "Copy SQL to Clipboard"')
    console.log('  4. Paste in Supabase SQL Editor\n')

    // Try to verify tables exist
    console.log('🔍 Checking if tables already exist...\n')
    const { data: studiesCheck, error: studiesError } = await supabase
      .from('research_studies')
      .select('id')
      .limit(1)

    if (!studiesError) {
      console.log('✅ research_studies table already exists!')
      console.log('   Migration may have already been run.\n')
    } else {
      console.log('❌ research_studies table does not exist')
      console.log('   Please run the migration using Method 1 or 2 above.\n')
    }

    console.log('✅ Script completed. Please follow the instructions above to run the migration.')

  } catch (error) {
    console.error('❌ Error:', error.message)
    console.log('\n💡 Please run the SQL manually in Supabase SQL Editor')
  }
}

executeMigration()

