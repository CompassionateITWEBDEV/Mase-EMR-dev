# Database Connection Setup Guide

## Quick Setup

To execute SQL migrations directly from the terminal, you need to add `DATABASE_URL` to your `.env.local` file.

## Step 1: Get Your Database Connection String

### Option A: From Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to: **Settings** → **Database**
3. Scroll to **Connection string** section
4. Select **URI** format
5. Copy the connection string (it looks like):
   ```
   postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres
   ```
   OR
   ```
   postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
   ```

### Option B: Construct from Supabase URL

If you have `NEXT_PUBLIC_SUPABASE_URL` in your `.env.local`:

1. Extract your project reference from the URL
2. Get your database password from Supabase Dashboard → Settings → Database
3. Construct the connection string:
   ```
   postgresql://postgres:[PASSWORD]@db.[PROJECT_REF].supabase.co:5432/postgres
   ```

## Step 2: Add to .env.local

Add this line to your `.env.local` file:

```env
DATABASE_URL="postgresql://postgres:[YOUR_PASSWORD]@db.[YOUR_PROJECT_REF].supabase.co:5432/postgres"
```

**Important:** Replace:
- `[YOUR_PASSWORD]` with your actual database password
- `[YOUR_PROJECT_REF]` with your Supabase project reference

## Step 3: Verify Connection

Run the check script:

```bash
node scripts/check-db-connection.js
```

This will verify your connection string is configured correctly.

## Step 4: Execute Migration

Once `DATABASE_URL` is set, run:

```bash
node scripts/execute-migration-direct.js
```

Or use the npm script:

```bash
npm run migrate:research:direct
```

## Alternative: Connection Pooling (Recommended for Production)

For better performance and connection management, use the connection pooler:

```env
DATABASE_URL="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres"
```

Get this from: **Settings** → **Database** → **Connection Pooling**

## Troubleshooting

### Error: "Connection refused"
- Check that your database is accessible
- Verify the host and port are correct
- Check firewall settings

### Error: "Authentication failed"
- Verify your database password is correct
- Make sure you're using the right user (usually `postgres`)

### Error: "Database not found"
- Verify the database name in the connection string (usually `postgres`)
- Check that the database exists

## Security Note

⚠️ **Never commit `.env.local` to version control!** It contains sensitive credentials.

The `.env.local` file should already be in `.gitignore`, but double-check to ensure your credentials are safe.

