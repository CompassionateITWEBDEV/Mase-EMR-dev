# Setup Instructions: Research Studies Tables

## Quick Setup Guide

The error "Could not find the table 'public.research_studies'" means the database tables haven't been created yet.

### Step 1: Open Supabase SQL Editor

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click on "SQL Editor" in the left sidebar

### Step 2: Run the Migration Script

1. Open the file: `scripts/create_research_studies_tables.sql`
2. Copy the entire contents of the file
3. Paste into the Supabase SQL Editor
4. Click the "Run" button (or press Ctrl+Enter / Cmd+Enter)

### Step 3: Verify Tables Were Created

Run this query in SQL Editor to verify:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('research_studies', 'research_study_participants');
```

You should see both tables listed.

### Step 4: Refresh the Application

1. Go back to your application
2. Navigate to `/research-dashboard`
3. Click on "Research Studies" tab
4. The error should be gone!

## Alternative: Run via Supabase CLI

If you have Supabase CLI installed:

```bash
supabase db push scripts/create_research_studies_tables.sql
```

## Troubleshooting

### Error: "relation 'organizations' does not exist"
- Make sure the `organizations` table exists first
- Check if you need to run other migration scripts first

### Error: "relation 'user_accounts' does not exist"
- Make sure the `user_accounts` table exists
- This is part of the multi-tenant system setup

### Error: "relation 'patients' does not exist"
- The `patients` table is needed for the participants table
- Make sure your core patient tables are set up

### If you get permission errors:
- Make sure you're using the service role key in your environment variables
- Check that your Supabase project has the correct permissions

## What Gets Created

1. **research_studies** table - Main table for storing research studies
2. **research_study_participants** table - Tracks patient enrollment
3. Indexes for performance
4. Triggers for auto-updating timestamps
5. Row Level Security (RLS) policies

## Need Help?

If you continue to have issues:
1. Check the Supabase logs for detailed error messages
2. Verify all dependencies (organizations, user_accounts, patients tables) exist
3. Make sure you're running the script in the correct database

