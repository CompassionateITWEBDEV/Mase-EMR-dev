/**
 * Execute SQL Migration Script
 * 
 * Usage: node scripts/run-sql-migration.js
 * 
 * This script executes the SQL migration using Supabase connection
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Error: Missing Supabase credentials')
  console.error('Required environment variables:')
  console.error('  - NEXT_PUBLIC_SUPABASE_URL')
  console.error('  - SUPABASE_SERVICE_ROLE_KEY')
  console.error('\nPlease check your .env.local file')
  process.exit(1)
}

async function executeSQL() {
  try {
    console.log('🚀 Starting SQL Migration...\n')

    // Read SQL file
    const sqlPath = path.join(__dirname, 'create_research_studies_tables.sql')
    if (!fs.existsSync(sqlPath)) {
      console.error(`❌ SQL file not found: ${sqlPath}`)
      process.exit(1)
    }

    const sql = fs.readFileSync(sqlPath, 'utf-8')
    console.log('✅ SQL file loaded\n')

    // Create Supabase client with service role
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Split SQL into individual statements
    // Handle DO blocks and regular statements
    const statements = []
    let currentStatement = ''
    let inDoBlock = false
    let doBlockDepth = 0

    const lines = sql.split('\n')
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i]
      const trimmed = line.trim()
      
      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith('--')) {
        continue
      }

      currentStatement += line + '\n'

      // Detect DO $$ blocks
      if (trimmed.includes('DO $$')) {
        inDoBlock = true
        doBlockDepth = 1
      } else if (inDoBlock) {
        // Count $$ markers
        const dollarCount = (trimmed.match(/\$\$/g) || []).length
        if (dollarCount > 0) {
          doBlockDepth -= dollarCount
          if (doBlockDepth <= 0) {
            inDoBlock = false
            if (trimmed.includes('END $$') || trimmed.includes('END$$')) {
              statements.push(currentStatement.trim())
              currentStatement = ''
            }
          }
        }
      } else if (trimmed.endsWith(';') && !inDoBlock) {
        // Regular statement ending with semicolon
        statements.push(currentStatement.trim())
        currentStatement = ''
      }
    }

    // Add any remaining statement
    if (currentStatement.trim()) {
      statements.push(currentStatement.trim())
    }

    console.log(`📊 Found ${statements.length} SQL statements\n`)

    // Execute using Supabase REST API
    // We'll use the REST API to execute SQL via a workaround
    let successCount = 0
    let errorCount = 0
    const errors = []

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      
      if (!statement || statement.length < 10) {
        continue
      }

      try {
        console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`)

        // Use Supabase REST API to execute SQL
        // Note: Supabase doesn't expose direct SQL execution, so we use a workaround
        // by calling the database via HTTP with the service role key
        
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`,
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({ query: statement }),
        })

        if (response.ok) {
          successCount++
          console.log(`   ✅ Success`)
        } else {
          // Try alternative: execute via direct query
          const errorText = await response.text()
          
          // Some errors are expected (like "already exists")
          if (errorText.includes('already exists') || 
              errorText.includes('duplicate') ||
              (errorText.includes('does not exist') && errorText.includes('DROP'))) {
            console.log(`   ⚠️  Expected warning (OK)`)
            successCount++
          } else if (response.status === 404 || response.status === 406) {
            // exec_sql function doesn't exist - use alternative method
            console.log(`   ⚠️  Using alternative execution method...`)
            
            // Execute via Supabase client using raw query
            // This requires creating a function first, or using pg library
            const result = await executeViaSupabaseClient(supabase, statement)
            if (result.success) {
              successCount++
              console.log(`   ✅ Success (alternative method)`)
            } else {
              errorCount++
              errors.push({ statement: i + 1, error: result.error })
              console.log(`   ❌ Failed: ${result.error}`)
            }
          } else {
            errorCount++
            errors.push({ statement: i + 1, error: errorText })
            console.log(`   ❌ Failed: ${errorText.substring(0, 100)}`)
          }
        }
      } catch (err) {
        // Try alternative execution method
        console.log(`   ⚠️  Trying alternative method...`)
        const result = await executeViaSupabaseClient(supabase, statement)
        if (result.success) {
          successCount++
          console.log(`   ✅ Success (alternative method)`)
        } else {
          errorCount++
          errors.push({ statement: i + 1, error: err.message })
          console.log(`   ❌ Failed: ${err.message}`)
        }
      }
    }

    console.log('\n' + '='.repeat(50))
    console.log('📊 Migration Summary:')
    console.log(`   ✅ Successful: ${successCount}`)
    console.log(`   ❌ Errors: ${errorCount}`)
    console.log('='.repeat(50))

    if (errorCount > 0) {
      console.log('\n⚠️  Some statements failed:')
      errors.forEach(({ statement, error }) => {
        console.log(`   Statement ${statement}: ${error.substring(0, 150)}`)
      })
      console.log('\n💡 You may need to run the SQL manually in Supabase SQL Editor')
    } else {
      console.log('\n🎉 Migration completed successfully!')
      console.log('✅ Research Studies tables are now created.')
    }

  } catch (error) {
    console.error('\n❌ Fatal error:', error.message)
    console.log('\n💡 Alternative: Run the SQL manually in Supabase SQL Editor')
    console.log('   File: scripts/create_research_studies_tables.sql')
    process.exit(1)
  }
}

// Alternative execution method using Supabase client
async function executeViaSupabaseClient(supabase, statement) {
  try {
    // Since Supabase JS client doesn't support raw SQL directly,
    // we need to use the REST API with a different approach
    
    // Try to execute via POST to the database
    // Extract project ref from URL
    const urlMatch = supabaseUrl.match(/https?:\/\/([^.]+)\.supabase\.co/)
    if (!urlMatch) {
      return { success: false, error: 'Invalid Supabase URL format' }
    }

    const projectRef = urlMatch[1]
    
    // Use Supabase Management API or direct database connection
    // For now, return error suggesting manual execution
    return {
      success: false,
      error: 'Direct SQL execution not available. Please use Supabase SQL Editor or install pg library.'
    }
  } catch (err) {
    return { success: false, error: err.message }
  }
}

// Run the migration
executeSQL().catch((error) => {
  console.error('❌ Migration failed:', error.message)
  console.log('\n💡 Please run the SQL manually:')
  console.log('   1. Open: scripts/create_research_studies_tables.sql')
  console.log('   2. Copy entire contents')
  console.log('   3. Go to Supabase Dashboard > SQL Editor')
  console.log('   4. Paste and click "Run"')
  process.exit(1)
})

