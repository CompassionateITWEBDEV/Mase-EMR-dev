#!/usr/bin/env node

/**
 * Setup script for EBP Certificates Storage Bucket
 * 
 * Creates the ebp-certificates storage bucket in Supabase for Evidence-Based Practices
 * staff training certificate uploads
 * 
 * Usage: node scripts/setup_ebp_certificates_bucket.js
 */

const { createClient } = require('@supabase/supabase-js')
const path = require('path')
const fs = require('fs')

// Load environment variables from .env file (prioritizing .env over .env.local)
function loadEnv() {
  const envPaths = [
    path.join(__dirname, '..', '.env'),
    path.join(__dirname, '..', '.env.local')
  ]
  
  for (const envPath of envPaths) {
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
      console.log(`✅ Loaded environment from: ${path.basename(envPath)}\n`)
      break
    }
  }
}

loadEnv()

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

async function setupStorageBucket() {
  console.log('🚀 EBP Certificates Storage Bucket Setup')
  console.log('='.repeat(60))
  console.log(`📡 Connecting to: ${supabaseUrl}\n`)

  const bucketName = 'ebp-certificates'

  try {
    // Check if bucket exists
    console.log(`📦 Checking for bucket "${bucketName}"...`)
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()

    if (listError) {
      console.error('❌ Error listing buckets:', listError.message)
      console.log('\n💡 Manual Setup Instructions:')
      console.log('   1. Go to Supabase Dashboard > Storage')
      console.log(`   2. Create a new bucket named "${bucketName}"`)
      console.log('   3. Set it to Public')
      console.log('   4. Set file size limit to 10MB')
      process.exit(1)
    }

    const bucketExists = buckets?.some(bucket => bucket.name === bucketName)

    if (bucketExists) {
      console.log(`✅ Bucket "${bucketName}" already exists`)
      const bucket = buckets.find(b => b.name === bucketName)
      console.log(`   Public: ${bucket.public ? 'Yes ✅' : 'No ⚠️'}`)
      console.log(`   File size limit: ${bucket.fileSizeLimit ? `${bucket.fileSizeLimit / 1024 / 1024}MB` : 'Not set'}`)
      
      if (!bucket.public) {
        console.log('\n⚠️  Warning: Bucket is not public. File uploads may not work correctly.')
        console.log('   Please set the bucket to public in Supabase Dashboard.')
      }
      
      console.log('\n✅ Setup complete!')
      process.exit(0)
    }

    // Create bucket
    console.log(`📝 Creating bucket "${bucketName}"...`)
    const { data, error } = await supabase.storage.createBucket(bucketName, {
      public: true,
      fileSizeLimit: 10485760, // 10MB in bytes
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
      console.error('❌ Error creating bucket:', error.message)
      
      if (error.message.includes('already exists')) {
        console.log(`✅ Bucket "${bucketName}" already exists (created elsewhere)`)
        process.exit(0)
      }
      
      console.log('\n💡 Manual Setup Instructions:')
      console.log('   1. Go to Supabase Dashboard > Storage')
      console.log(`   2. Create a new bucket named "${bucketName}"`)
      console.log('   3. Set it to Public')
      console.log('   4. Set file size limit to 10MB')
      console.log('   5. Allowed MIME types:')
      console.log('      - application/pdf')
      console.log('      - image/jpeg, image/jpg, image/png')
      console.log('      - application/msword')
      console.log('      - application/vnd.openxmlformats-officedocument.wordprocessingml.document')
      process.exit(1)
    }

    console.log(`✅ Bucket "${bucketName}" created successfully!`)
    console.log('   Public: Yes')
    console.log('   File size limit: 10MB')
    console.log('   Allowed types: PDF, Images, Word documents')
    console.log('\n✅ Setup complete!')
    process.exit(0)
  } catch (error) {
    console.error('\n❌ Fatal error:', error.message)
    console.log('\n💡 Please create the bucket manually in Supabase Dashboard')
    process.exit(1)
  }
}

setupStorageBucket()

