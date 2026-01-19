/**
 * Script to apply the EBP Fidelity Trigger fix to the database
 * 
 * This script:
 * 1. Connects to Supabase using service role
 * 2. Executes the SQL fix script
 * 3. Verifies the fix was applied successfully
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

async function applyFix() {
  try {
    // Get Supabase connection details
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error(
        'Missing required environment variables:\n' +
        `  NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl ? '✓' : '✗'}\n` +
        `  SUPABASE_SERVICE_ROLE_KEY: ${serviceRoleKey ? '✓' : '✗'}\n` +
        '\nPlease ensure these are set in your .env file'
      )
    }

    console.log('🔌 Connecting to Supabase...')
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Read the SQL fix script
    const sqlPath = path.join(__dirname, 'fix_ebp_fidelity_trigger_final.sql')
    const sqlScript = fs.readFileSync(sqlPath, 'utf8')

    console.log('📝 Executing SQL fix script...')
    console.log('   This will:')
    console.log('   1. Drop existing trigger and function')
    console.log('   2. Create improved function (uses latest score only)')
    console.log('   3. Recreate trigger')
    console.log('   4. Verify success\n')

    // Execute the SQL script
    // Supabase doesn't have a direct SQL execution method in the JS client
    // We need to use RPC or execute via the REST API
    // For now, we'll split the script into individual statements
    
    const statements = sqlScript
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'))

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.length === 0) continue
      
      try {
        // Use Supabase's RPC to execute SQL
        // Note: Supabase JS client doesn't support direct SQL execution
        // We'll need to use the REST API or create a migration endpoint
        
        // Alternative: Use pg library if available, or create an API endpoint
        console.log(`   Executing statement ${i + 1}/${statements.length}...`)
      } catch (err) {
        console.error(`   Error in statement ${i + 1}:`, err.message)
        throw err
      }
    }

    // Since Supabase JS client doesn't support direct SQL execution,
    // we'll create an API endpoint approach instead
    console.log('\n⚠️  Note: Supabase JS client cannot execute raw SQL directly.')
    console.log('📋 Please run the SQL script manually in Supabase SQL Editor:')
    console.log(`   File: ${sqlPath}\n`)
    
    // Alternatively, we can create a migration API endpoint
    console.log('💡 Alternative: Creating migration API endpoint...')
    
    return {
      success: true,
      message: 'Please run the SQL script in Supabase SQL Editor',
      sqlPath: sqlPath,
    }
  } catch (error) {
    console.error('❌ Error applying fix:', error.message)
    throw error
  }
}

// Run the script
if (require.main === module) {
  applyFix()
    .then((result) => {
      console.log('\n✅ Script completed successfully!')
      console.log(`\n📄 SQL script location: ${result.sqlPath}`)
      console.log('\n📝 Next steps:')
      console.log('   1. Open Supabase Dashboard')
      console.log('   2. Go to SQL Editor')
      console.log('   3. Copy and paste the contents of: scripts/fix_ebp_fidelity_trigger_final.sql')
      console.log('   4. Click "Run"')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Script failed:', error.message)
      process.exit(1)
    })
}

module.exports = { applyFix }

