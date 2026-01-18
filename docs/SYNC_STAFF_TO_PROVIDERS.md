# Sync Staff to Providers - Setup Guide

This guide explains how to automatically sync eligible staff members to the providers table in Supabase.

## Overview

Staff members with the following roles are automatically synced to the `providers` table:
- `doctor` - Doctor/Physician
- `counselor` - Counselor
- `case_manager` - Case Manager
- `supervisor` - Clinical Supervisor
- `rn` - Registered Nurse
- `peer_recovery` - Peer Recovery Specialist

## Setup Instructions

### Option 1: Run SQL Migration Script (Recommended)

1. **Open Supabase Dashboard**
   - Go to your Supabase project
   - Navigate to **SQL Editor**

2. **Run the Migration Script**
   - Open the file: `scripts/023_sync_staff_to_providers.sql`
   - Copy the entire contents
   - Paste into Supabase SQL Editor
   - Click **Run** or press `Ctrl+Enter`

3. **Verify the Sync**
   - The script will automatically:
     - Sync existing eligible staff to providers
     - Create triggers to auto-sync new staff
     - Update providers when staff information changes

### Option 2: Use API Endpoint (Manual Sync)

If you prefer to sync manually or test the sync:

1. **Check Sync Status**
   ```bash
   GET http://localhost:3000/api/providers/sync
   ```
   This returns:
   - Count of eligible staff members
   - Count of synced providers
   - Whether sync is needed

2. **Trigger Manual Sync**
   ```bash
   POST http://localhost:3000/api/providers/sync
   ```
   This will:
   - Find all eligible staff members
   - Sync them to the providers table
   - Return the count of synced providers

## How It Works

### Automatic Sync (After Running SQL Script)

1. **When Staff is Added**
   - If the staff member has an eligible role → Automatically added to providers table
   - If the staff member has a non-eligible role → Not added to providers

2. **When Staff is Updated**
   - If role changes to eligible → Added to providers
   - If role changes to non-eligible → Removed from providers
   - If name, email, department, etc. changes → Provider record is updated

3. **When Staff is Deactivated**
   - Staff marked as inactive → Provider is also marked inactive

### Specialization Mapping

Staff roles are automatically mapped to specializations:
- `doctor` → "Physician" (or "Physician - [Department]")
- `counselor` → "Counseling" (or "Counseling - [Department]")
- `case_manager` → "Case Management" (or "Case Management - [Department]")
- `supervisor` → "Clinical Supervisor" (or "Clinical Supervisor - [Department]")
- `rn` → "Nursing" (or "Nursing - [Department]")
- `peer_recovery` → "Peer Recovery" (or "Peer Recovery - [Department]")

## Verification

After running the migration, verify it's working:

### 1. Check Providers API
```bash
GET http://localhost:3000/api/providers?active=false
```

Should return all providers including synced staff members.

### 2. Check Database Directly
Run this query in Supabase SQL Editor:
```sql
SELECT 
  p.id,
  p.first_name,
  p.last_name,
  p.specialization,
  s.role,
  s.department,
  p.is_active
FROM public.providers p
INNER JOIN public.staff s ON p.id = s.id
WHERE s.role IN ('doctor', 'counselor', 'case_manager', 'supervisor', 'rn', 'peer_recovery')
ORDER BY p.last_name, p.first_name;
```

### 3. Test in Appointment Dialog
1. Go to `/appointments`
2. Click "Schedule New Appointment"
3. Check the Provider dropdown - it should show all eligible staff members

## Troubleshooting

### No Providers Showing Up

1. **Check if staff members exist:**
   ```sql
   SELECT * FROM public.staff 
   WHERE role IN ('doctor', 'counselor', 'case_manager', 'supervisor', 'rn', 'peer_recovery')
   AND is_active = true;
   ```

2. **Check if triggers are created:**
   ```sql
   SELECT * FROM pg_trigger 
   WHERE tgname LIKE '%sync_staff_to_providers%';
   ```

3. **Manually trigger sync:**
   - Use the API endpoint: `POST /api/providers/sync`
   - Or re-run the migration script

### Providers Not Updating

- The triggers should automatically update providers when staff changes
- If not working, check trigger logs in Supabase
- You can manually sync using the API endpoint

## Notes

- Staff members must be **Active** (`is_active = true`) to appear as providers
- The sync maintains the same `id` in both tables (staff.id = providers.id)
- If a staff member's role changes to non-eligible, they are removed from providers
- The sync happens automatically via database triggers (no application code needed)
