#!/bin/bash

# Research Studies Setup Script
# This script sets up the audit table and storage bucket for Research Studies feature

echo "🚀 Research Studies Setup Script"
echo "=================================="
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "❌ Error: .env file not found"
    echo "Please create a .env file with your Supabase credentials"
    exit 1
fi

# Load environment variables
export $(cat .env | grep -v '^#' | xargs)

# Check required variables
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] && [ -z "$SUPABASE_URL" ]; then
    echo "❌ Error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL not found in .env"
    exit 1
fi

if [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo "❌ Error: SUPABASE_SERVICE_ROLE_KEY not found in .env"
    exit 1
fi

echo "✅ Environment variables loaded"
echo ""

# Step 1: Run SQL script
echo "📊 Step 1: Creating audit trail table..."
echo "   Please run the SQL script in Supabase SQL Editor:"
echo "   File: scripts/setup_research_audit_and_storage_sql_only.sql"
echo ""

# Step 2: Run storage bucket setup
echo "📦 Step 2: Creating storage bucket..."
if command -v node &> /dev/null; then
    node scripts/setup_research_storage_bucket.js
else
    echo "   ⚠️  Node.js not found. Please run manually:"
    echo "   node scripts/setup_research_storage_bucket.js"
fi

echo ""
echo "✅ Setup script completed!"
echo ""
echo "📋 Next Steps:"
echo "   1. Run the SQL script in Supabase SQL Editor"
echo "   2. Verify storage bucket was created"
echo "   3. Test the Research Studies feature"

