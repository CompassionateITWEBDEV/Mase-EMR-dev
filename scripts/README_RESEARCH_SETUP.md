# Research Studies Setup Instructions

This guide will help you set up the database table and storage bucket required for the Research Studies feature.

## Prerequisites

- Access to Supabase Dashboard
- Environment variables configured in `.env` file:
  - `NEXT_PUBLIC_SUPABASE_URL` or `SUPABASE_URL`
  - `SUPABASE_SERVICE_ROLE_KEY`

## Setup Methods

### Method 1: Automated Script (Recommended)

Run the automated setup script:

```bash
node scripts/setup_research_storage_bucket.js
```

This will:
- ✅ Check if the storage bucket exists
- ✅ Create the bucket if it doesn't exist
- ✅ Configure it as public with 10MB file size limit

### Method 2: Manual Setup

#### Step 1: Create Audit Table

1. Open Supabase Dashboard
2. Go to **SQL Editor**
3. Copy and paste the contents of `scripts/setup_research_audit_and_storage_sql_only.sql`
4. Click **Run** to execute

The SQL will create:
- `research_study_audit_log` table
- Required indexes for performance

#### Step 2: Create Storage Bucket

1. Open Supabase Dashboard
2. Go to **Storage**
3. Click **New bucket**
4. Configure:
   - **Name**: `research-consents`
   - **Public bucket**: ✅ Yes (checked)
   - **File size limit**: `10485760` (10MB in bytes)
   - **Allowed MIME types** (optional, but recommended):
     - `application/pdf`
     - `image/jpeg`
     - `image/jpg`
     - `image/png`
     - `application/msword`
     - `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
5. Click **Create bucket**

## Verification

### Verify Audit Table

Run this query in Supabase SQL Editor:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'research_study_audit_log';
```

Should return: `research_study_audit_log`

### Verify Storage Bucket

1. Go to **Storage** in Supabase Dashboard
2. You should see a bucket named `research-consents`
3. Verify it's set to **Public**

## Troubleshooting

### Storage Bucket Creation Fails

If the automated script fails to create the bucket:

1. Check that `SUPABASE_SERVICE_ROLE_KEY` is correct in `.env`
2. Verify you have admin access to the Supabase project
3. Create the bucket manually using Method 2

### Audit Table Already Exists

If you see an error that the table already exists, that's fine! The table is already set up.

### Permission Errors

If you get permission errors:
- Ensure you're using the **Service Role Key** (not the anon key)
- Verify the key has admin privileges
- Check RLS policies if needed

## What Gets Created

### Database Table

- **Table**: `research_study_audit_log`
- **Purpose**: Tracks all changes to studies and participants
- **Indexes**: 4 indexes for optimal query performance

### Storage Bucket

- **Bucket**: `research-consents`
- **Purpose**: Stores uploaded consent documents
- **Public**: Yes (for direct file access)
- **Size Limit**: 10MB per file
- **Allowed Types**: PDF, Images, Word documents

## Next Steps

After setup is complete:

1. ✅ Test participant enrollment
2. ✅ Test file upload in enrollment dialog
3. ✅ Verify audit logs are being created
4. ✅ Check notifications are working

## Support

If you encounter issues:
1. Check the error messages in the console
2. Verify environment variables are correct
3. Check Supabase Dashboard for any errors
4. Review the test plan in `docs/RESEARCH_STUDIES_IMPLEMENTATION_TEST_PLAN.md`

