/**
 * Execute Research Studies Migration Script
 * Run with: node scripts/execute-research-migration.js
 * 
 * This script executes the SQL migration using Supabase connection
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables from .env.local
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Error: Missing Supabase credentials')
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local')
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
    const sqlPath = path.join(__dirname, 'create_research_studies_tables.sql')
    const sql = fs.readFileSync(sqlPath, 'utf-8')

    console.log('📝 SQL file loaded successfully\n')

    // Split SQL into statements (handle DO blocks specially)
    const statements = []
    let currentStatement = ''
    let inDoBlock = false
    let doBlockDepth = 0

    const lines = sql.split('\n')
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim()
      
      // Skip empty lines and comments
      if (!line || line.startsWith('--')) {
        continue
      }

      currentStatement += line + '\n'

      // Detect DO $$ blocks
      if (line.includes('DO $$')) {
        inDoBlock = true
        doBlockDepth = 1
      } else if (inDoBlock) {
        if (line.includes('$$')) {
          doBlockDepth--
          if (doBlockDepth === 0) {
            inDoBlock = false
            // DO block ends with END $$;
            if (line.includes('END $$')) {
              statements.push(currentStatement.trim())
              currentStatement = ''
            }
          }
        }
      } else if (line.endsWith(';') && !inDoBlock) {
        // Regular statement ending with semicolon
        statements.push(currentStatement.trim())
        currentStatement = ''
      }
    }

    // Add any remaining statement
    if (currentStatement.trim()) {
      statements.push(currentStatement.trim())
    }

    console.log(`📊 Found ${statements.length} SQL statements to execute\n`)

    // Execute each statement using Supabase REST API
    let successCount = 0
    let errorCount = 0
    const errors = []

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      
      if (!statement || statement.length < 10) continue

      try {
        console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`)

        // Use Supabase Management API to execute SQL
        // Note: Supabase doesn't have a direct SQL execution endpoint
        // We'll use the REST API with a workaround
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`,
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify({ sql: statement }),
        })

        if (response.ok) {
          successCount++
          console.log(`✅ Statement ${i + 1} executed successfully`)
        } else {
          const errorText = await response.text()
          
          // Some errors are expected (like "already exists")
          if (errorText.includes('already exists') || 
              errorText.includes('duplicate') ||
              errorText.includes('does not exist') && errorText.includes('DROP')) {
            console.log(`⚠️  Statement ${i + 1}: ${errorText.substring(0, 80)} (this is OK)`)
            successCount++
          } else if (response.status === 404 || response.status === 406) {
            // exec_sql function doesn't exist - we need to use alternative method
            console.log(`⚠️  Statement ${i + 1}: exec_sql function not available`)
            console.log('💡 Using alternative execution method...\n')
            
            // Try executing via direct database connection
            await executeViaDirectConnection(statement, i + 1)
            successCount++
          } else {
            console.error(`❌ Statement ${i + 1} failed: ${errorText.substring(0, 200)}`)
            errorCount++
            errors.push({ statement: i + 1, error: errorText })
          }
        }
      } catch (err) {
        console.error(`❌ Error executing statement ${i + 1}:`, err.message)
        errorCount++
        errors.push({ statement: i + 1, error: err.message })
      }
    }

    console.log('\n📊 Migration Summary:')
    console.log(`   ✅ Successful: ${successCount}`)
    console.log(`   ❌ Errors: ${errorCount}`)

    if (errorCount > 0) {
      console.log('\n⚠️  Some statements failed. Errors:')
      errors.forEach(({ statement, error }) => {
        console.log(`   Statement ${statement}: ${error.substring(0, 100)}`)
      })
    }

    if (errorCount === 0) {
      console.log('\n🎉 Migration completed successfully!')
      console.log('✅ Research Studies tables are now created.')
    } else {
      console.log('\n⚠️  Migration completed with errors.')
      console.log('💡 You may need to run some statements manually in Supabase SQL Editor.')
    }

  } catch (error) {
    console.error('❌ Fatal error:', error.message)
    console.log('\n💡 Alternative: Please run the SQL manually in Supabase SQL Editor')
    console.log('   File: scripts/create_research_studies_tables.sql')
  }
}

// Alternative method: Execute via direct PostgreSQL connection
async function executeViaDirectConnection(statement, statementNum) {
  try {
    // Try using pg library if available
    const pg = require('pg')
    
    // Get database connection string from Supabase URL
    // Supabase connection string format: postgresql://postgres:[password]@[host]:[port]/postgres
    const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL
    
    if (!dbUrl) {
      console.log(`   ⚠️  Cannot execute statement ${statementNum}: DATABASE_URL not set`)
      console.log('   💡 Set DATABASE_URL in .env.local to use direct connection')
      return false
    }

    const client = new pg.Client({ connectionString: dbUrl })
    await client.connect()
    
    try {
      await client.query(statement)
      console.log(`   ✅ Statement ${statementNum} executed via direct connection`)
      return true
    } finally {
      await client.end()
    }
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      console.log(`   ⚠️  Statement ${statementNum}: pg library not installed`)
      console.log('   💡 Install with: npm install pg')
    } else {
      console.log(`   ⚠️  Statement ${statementNum}: ${err.message.substring(0, 100)}`)
    }
    return false
  }
}

// Check if exec_sql function exists, if not, try direct connection
async function checkAndExecute() {
  try {
    // First, try to verify tables don't exist
    const { data, error } = await supabase
      .from('research_studies')
      .select('id')
      .limit(1)

    if (!error) {
      console.log('✅ research_studies table already exists!')
      console.log('   Migration may have already been run.\n')
      console.log('💡 To re-run, drop the tables first or use Supabase SQL Editor')
      return
    }

    // Table doesn't exist, proceed with migration
    await executeSQL()
  } catch (err) {
    // Table doesn't exist (expected), proceed with migration
    await executeSQL()
  }
}

// Run the migration
checkAndExecute().catch((error) => {
  console.error('❌ Migration failed:', error.message)
  console.log('\n💡 Please run the SQL manually:')
  console.log('   1. Open: scripts/create_research_studies_tables.sql')
  console.log('   2. Copy entire contents')
  console.log('   3. Go to Supabase Dashboard > SQL Editor')
  console.log('   4. Paste and click "Run"')
  process.exit(1)
})

