/**
 * Execute SQL Migration - Auto-execute if server is running
 * 
 * Command: node scripts/execute-migration.js
 * 
 * This script will:
 * 1. Try to execute via API route (if server is running)
 * 2. Otherwise, display SQL for manual execution
 */

const fs = require('fs')
const path = require('path')

const sqlPath = path.join(__dirname, 'create_research_studies_tables.sql')
const sql = fs.readFileSync(sqlPath, 'utf-8')

async function executeMigration() {
  console.log('🚀 Research Studies SQL Migration\n')

  // Try to execute via API route
  try {
    console.log('🔄 Attempting to execute via API route...\n')
    
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000)

    const response = await fetch('http://localhost:3000/api/research/migrate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sql }),
      signal: controller.signal,
    })

    clearTimeout(timeout)

    if (response.ok) {
      const result = await response.json()
      console.log('✅ Migration executed successfully!\n')
      console.log(`   ${result.message}`)
      console.log(`   ✅ Successful: ${result.successful}`)
      console.log(`   ❌ Errors: ${result.errors}`)
      
      if (result.errors > 0 && result.results) {
        console.log('\n⚠️  Errors encountered:')
        result.results
          .filter(r => r.status === 'error')
          .forEach(r => console.log(`   Statement ${r.statement}: ${r.message}`))
      }
      
      console.log('\n🎉 Migration complete! Research Studies tables are now created.')
      return
    } else {
      const error = await response.text()
      console.log('⚠️  API returned error:', error.substring(0, 150))
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      console.log('⚠️  Dev server not running (timeout after 3 seconds)')
    } else {
      console.log('⚠️  Could not connect to API:', err.message)
    }
    console.log('\n💡 To execute via API:')
    console.log('   1. Start dev server: npm run dev')
    console.log('   2. Run this script again: node scripts/execute-migration.js\n')
  }

  // Fallback: Display SQL for manual execution
  console.log('📋 MANUAL EXECUTION METHOD:\n')
  console.log('Copy the SQL below and paste into Supabase SQL Editor:\n')
  console.log('='.repeat(70))
  console.log(sql)
  console.log('='.repeat(70))
  console.log('\n✅ SQL content displayed above.')
}

executeMigration().catch((error) => {
  console.error('❌ Error:', error.message)
  process.exit(1)
})

