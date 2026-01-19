/**
 * TypeScript script to execute research_studies migration
 * This uses the Supabase Management API to execute SQL
 * 
 * Run with: npx tsx scripts/execute-research-migration.ts
 * Or: node --loader ts-node/esm scripts/execute-research-migration.ts
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join } from 'path'

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Error: Missing Supabase environment variables')
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function executeSQL() {
  try {
    console.log('🚀 Executing Research Studies Migration...\n')

    // Read SQL file
    const sqlPath = join(__dirname, 'create_research_studies_tables.sql')
    const sql = readFileSync(sqlPath, 'utf-8')

    // Split into statements and execute
    const statements = sql
      .split(';')
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith('--'))

    console.log(`📝 Executing ${statements.length} SQL statements...\n`)

    // Execute via REST API
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (!statement || statement.length < 10) continue

      try {
        // Use fetch to call Supabase REST API directly
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: serviceRoleKey,
            Authorization: `Bearer ${serviceRoleKey}`,
          },
          body: JSON.stringify({ sql: statement }),
        })

        if (response.ok) {
          console.log(`✅ Statement ${i + 1}/${statements.length} executed`)
        } else {
          const errorText = await response.text()
          if (errorText.includes('already exists') || errorText.includes('duplicate')) {
            console.log(`⚠️  Statement ${i + 1}: Already exists (OK)`)
          } else {
            console.error(`❌ Statement ${i + 1} failed: ${errorText.substring(0, 100)}`)
          }
        }
      } catch (err) {
        console.error(`❌ Error on statement ${i + 1}:`, (err as Error).message)
      }
    }

    console.log('\n✅ Migration script execution attempted')
    console.log('💡 If errors occurred, please run the SQL manually in Supabase SQL Editor')
  } catch (error) {
    console.error('❌ Fatal error:', error)
    console.log('\n💡 Please run the SQL manually:')
    console.log('   1. Open Supabase Dashboard > SQL Editor')
    console.log('   2. Copy scripts/create_research_studies_tables.sql')
    console.log('   3. Paste and run')
  }
}

// Since Supabase doesn't expose raw SQL execution via JS client,
// provide clear instructions
console.log('📋 Research Studies Migration')
console.log('=============================\n')
console.log('⚠️  Direct SQL execution via JS client is not supported.')
console.log('Please use the Supabase Dashboard:\n')
console.log('1. Go to: https://supabase.com/dashboard')
console.log('2. Select your project')
console.log('3. Click "SQL Editor"')
console.log('4. Click "New Query"')
console.log('5. Copy entire file: scripts/create_research_studies_tables.sql')
console.log('6. Paste and click "Run"\n')

// Try alternative method
executeSQL().catch(() => {
  console.log('✅ Please use the manual method above.')
})

