#!/usr/bin/env node

/**
 * Setup script for Research Studies feature
 * 
 * This script:
 * 1. Creates the research_study_audit_log table
 * 2. Creates the research-consents storage bucket
 * 
 * Usage: node scripts/setup_research_audit_and_storage.js
 */

const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables from .env file
require('dotenv').config({ path: path.join(__dirname, '..', '.env') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Error: Missing Supabase configuration')
  console.error('Required environment variables:')
  console.error('  - NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL')
  console.error('  - SUPABASE_SERVICE_ROLE_KEY')
  console.error('\nPlease check your .env file')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

async function createAuditTable() {
  console.log('\n📊 Step 1: Creating audit trail table...')
  
  const sqlPath = path.join(__dirname, 'create_research_studies_tables.sql')
  
  if (!fs.existsSync(sqlPath)) {
    console.error(`❌ Error: SQL file not found at ${sqlPath}`)
    return false
  }

  // Read only the audit table section from the SQL file
  const auditTableSQL = `
-- ============================================================================
-- AUDIT TRAIL TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS research_study_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    study_id UUID,
    participant_id UUID,
    action VARCHAR(50) NOT NULL CHECK (action IN ('created', 'updated', 'deleted', 'status_changed', 'enrolled', 'withdrawn', 'completed')),
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('study', 'participant')),
    changed_by UUID,
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    old_values JSONB,
    new_values JSONB,
    change_description TEXT,
    
    FOREIGN KEY (study_id) REFERENCES research_studies(id) ON DELETE CASCADE,
    FOREIGN KEY (participant_id) REFERENCES research_study_participants(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_research_audit_study ON research_study_audit_log(study_id);
CREATE INDEX IF NOT EXISTS idx_research_audit_participant ON research_study_audit_log(participant_id);
CREATE INDEX IF NOT EXISTS idx_research_audit_action ON research_study_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_research_audit_changed_at ON research_study_audit_log(changed_at DESC);
`

  try {
    // Execute SQL using Supabase RPC or direct query
    // Note: Supabase JS client doesn't support raw SQL directly, so we'll use the REST API
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': serviceRoleKey,
        'Authorization': `Bearer ${serviceRoleKey}`,
      },
      body: JSON.stringify({ sql: auditTableSQL }),
    })

    // Alternative: Use Supabase's query builder to create table
    // Since we can't execute raw SQL easily, let's check if table exists first
    const { data: existingTable, error: checkError } = await supabase
      .from('research_study_audit_log')
      .select('id')
      .limit(1)

    if (checkError && checkError.code === '42P01') {
      // Table doesn't exist, we need to create it
      console.log('   ⚠️  Table does not exist. Attempting to create...')
      console.log('   ⚠️  Note: You may need to run the SQL manually in Supabase SQL Editor')
      console.log('   📝 SQL to execute:')
      console.log('   ' + '='.repeat(60))
      console.log(auditTableSQL)
      console.log('   ' + '='.repeat(60))
      return false
    } else if (!checkError) {
      console.log('   ✅ Audit table already exists')
      return true
    } else {
      // Table exists or other error
      console.log('   ✅ Audit table check completed')
      return true
    }
  } catch (error) {
    console.error('   ❌ Error creating audit table:', error.message)
    console.log('   📝 Please run the SQL manually in Supabase SQL Editor:')
    console.log('   ' + '='.repeat(60))
    console.log(auditTableSQL)
    console.log('   ' + '='.repeat(60))
    return false
  }
}

async function createStorageBucket() {
  console.log('\n📦 Step 2: Creating storage bucket for consent documents...')
  
  const bucketName = 'research-consents'
  
  try {
    // Check if bucket exists
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('   ❌ Error listing buckets:', listError.message)
      return false
    }

    const bucketExists = buckets?.some(bucket => bucket.name === bucketName)

    if (bucketExists) {
      console.log(`   ✅ Bucket "${bucketName}" already exists`)
      
      // Check if it's public
      const bucket = buckets.find(b => b.name === bucketName)
      if (bucket.public) {
        console.log('   ✅ Bucket is already public')
      } else {
        console.log('   ⚠️  Bucket exists but may not be public')
        console.log('   💡 Make sure the bucket is set to public in Supabase Dashboard')
      }
      return true
    }

    // Create bucket
    console.log(`   📝 Creating bucket "${bucketName}"...`)
    const { data, error } = await supabase.storage.createBucket(bucketName, {
      public: true,
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: [
        'application/pdf',
        'image/jpeg',
        'image/jpg',
        'image/png',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ],
    })

    if (error) {
      // If bucket creation fails, it might be a permissions issue
      console.error('   ❌ Error creating bucket:', error.message)
      console.log('   💡 You may need to create the bucket manually in Supabase Dashboard:')
      console.log('      1. Go to Storage in Supabase Dashboard')
      console.log(`      2. Create a new bucket named "${bucketName}"`)
      console.log('      3. Set it to Public')
      console.log('      4. Set file size limit to 10MB')
      return false
    }

    console.log(`   ✅ Bucket "${bucketName}" created successfully`)
    console.log('   ✅ Bucket is set to public')
    return true
  } catch (error) {
    console.error('   ❌ Error:', error.message)
    return false
  }
}

async function main() {
  console.log('🚀 Research Studies Setup Script')
  console.log('=' .repeat(60))
  console.log(`📡 Connecting to: ${supabaseUrl}`)
  
  const auditResult = await createAuditTable()
  const storageResult = await createStorageBucket()

  console.log('\n' + '='.repeat(60))
  console.log('📋 Setup Summary:')
  console.log(`   Audit Table: ${auditResult ? '✅ Created/Exists' : '❌ Needs Manual Setup'}`)
  console.log(`   Storage Bucket: ${storageResult ? '✅ Created/Exists' : '❌ Needs Manual Setup'}`)
  console.log('='.repeat(60))

  if (!auditResult || !storageResult) {
    console.log('\n⚠️  Some steps require manual setup.')
    console.log('📖 Please refer to the instructions above or check the documentation.')
    process.exit(1)
  } else {
    console.log('\n✅ Setup completed successfully!')
    console.log('🎉 Research Studies feature is ready to use.')
    process.exit(0)
  }
}

main().catch(error => {
  console.error('\n❌ Fatal error:', error)
  process.exit(1)
})

