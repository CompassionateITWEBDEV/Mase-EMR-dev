/**
 * Script to execute research_studies table creation
 * Run with: node scripts/run-research-studies-migration.js
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Error: Missing Supabase environment variables');
  console.error('Please ensure NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

async function runMigration() {
  try {
    console.log('🚀 Starting Research Studies migration...\n');

    // Read the SQL file
    const sqlPath = path.join(__dirname, 'create_research_studies_tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Split SQL into individual statements (semicolon separated)
    // Remove comments and empty lines
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

    // Execute each statement
    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // Skip empty statements
      if (!statement || statement.length < 10) continue;

      try {
        // Use RPC to execute raw SQL (if available) or use query builder
        // Note: Supabase JS client doesn't support raw SQL execution directly
        // We'll need to use the REST API or Supabase CLI
        
        console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
        
        // For now, we'll use the REST API approach
        const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': serviceRoleKey,
            'Authorization': `Bearer ${serviceRoleKey}`,
          },
          body: JSON.stringify({ sql: statement }),
        });

        if (response.ok) {
          successCount++;
          console.log(`✅ Statement ${i + 1} executed successfully`);
        } else {
          const error = await response.text();
          // Some errors are expected (like "already exists")
          if (error.includes('already exists') || error.includes('duplicate')) {
            console.log(`⚠️  Statement ${i + 1}: ${error.substring(0, 100)} (this is OK)`);
            successCount++;
          } else {
            console.error(`❌ Statement ${i + 1} failed: ${error.substring(0, 200)}`);
            errorCount++;
          }
        }
      } catch (err) {
        console.error(`❌ Error executing statement ${i + 1}:`, err.message);
        errorCount++;
      }
    }

    console.log('\n📊 Migration Summary:');
    console.log(`   ✅ Successful: ${successCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);

    if (errorCount === 0) {
      console.log('\n🎉 Migration completed successfully!');
      console.log('✅ Research Studies tables are now created.');
    } else {
      console.log('\n⚠️  Migration completed with some errors.');
      console.log('Some statements may have failed. Check the output above for details.');
    }

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
    process.exit(1);
  }
}

// Alternative: Use Supabase Management API
async function runMigrationViaRPC() {
  try {
    console.log('🚀 Starting Research Studies migration via Supabase...\n');

    // Read the SQL file
    const sqlPath = path.join(__dirname, 'create_research_studies_tables.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // Execute via Supabase REST API using exec_sql function
    // Note: This requires a custom function in Supabase
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      console.error('❌ Error:', error.message);
      console.log('\n💡 Alternative: Please run the SQL script manually in Supabase SQL Editor');
      console.log('   1. Go to Supabase Dashboard > SQL Editor');
      console.log('   2. Copy contents of scripts/create_research_studies_tables.sql');
      console.log('   3. Paste and click "Run"');
      process.exit(1);
    }

    console.log('✅ Migration completed successfully!');
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n💡 Please run the SQL script manually in Supabase SQL Editor');
    process.exit(1);
  }
}

// Since Supabase JS client doesn't support raw SQL execution,
// we'll provide instructions instead
console.log('📋 Research Studies Migration Script');
console.log('=====================================\n');
console.log('⚠️  Note: Supabase JS client cannot execute raw SQL directly.');
console.log('Please use one of these methods:\n');
console.log('Method 1: Supabase Dashboard (Recommended)');
console.log('  1. Go to https://supabase.com/dashboard');
console.log('  2. Select your project');
console.log('  3. Click "SQL Editor" in left sidebar');
console.log('  4. Click "New Query"');
console.log('  5. Copy the entire contents of: scripts/create_research_studies_tables.sql');
console.log('  6. Paste into the SQL editor');
console.log('  7. Click "Run" (or press Ctrl+Enter / Cmd+Enter)\n');
console.log('Method 2: Supabase CLI');
console.log('  If you have Supabase CLI installed:');
console.log('  supabase db push scripts/create_research_studies_tables.sql\n');
console.log('Method 3: psql (PostgreSQL client)');
console.log('  psql -h <your-db-host> -U postgres -d postgres -f scripts/create_research_studies_tables.sql\n');

// Try to execute if exec_sql function exists
runMigrationViaRPC().catch(() => {
  console.log('\n✅ Script completed. Please use Method 1 above to execute the SQL.');
});

