# SQL Scripts Completion Audit

## Summary
Based on the current Supabase database schema, most tables have been created. However, some tables from recent scripts are missing or might be causing RLS (Row Level Security) errors.

## ✅ Successfully Created Tables (263 tables found)

All major core tables exist including:
- patients, providers, staff, appointments, encounters
- medications, prescriptions, assessments, progress_notes
- insurance_payers, patient_insurance, claims
- workflow_templates, workflow_instances, workflow_tasks
- All OTP/behavioral health tables
- All rehabilitation/PT/OT tables
- All take-home diversion control tables
- All HIE network tables
- All county health program tables

## ❌ Missing Tables That Need Creation

Based on script analysis, these tables are missing:

### 1. Support/IT Tables (from FINAL_LAUNCH_COMPLETE_SETUP.sql)
```sql
-- Run this in Supabase SQL Editor:
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  ticket_number VARCHAR(50) UNIQUE,
  subject TEXT NOT NULL,
  description TEXT,
  priority VARCHAR(20) DEFAULT 'medium',
  status VARCHAR(20) DEFAULT 'open',
  category VARCHAR(50),
  assigned_to UUID REFERENCES staff(id),
  created_by UUID REFERENCES staff(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT
);

CREATE TABLE IF NOT EXISTS support_ticket_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES support_tickets(id),
  comment_text TEXT NOT NULL,
  created_by UUID REFERENCES staff(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  is_internal BOOLEAN DEFAULT false
);

CREATE TABLE IF NOT EXISTS remote_support_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  session_code VARCHAR(20) UNIQUE,
  initiated_by UUID REFERENCES staff(id),
  support_agent_id UUID,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  session_status VARCHAR(20) DEFAULT 'active',
  connection_method VARCHAR(50),
  notes TEXT
);
```

### 2. Pharmacies Table (referenced but missing)
```sql
CREATE TABLE IF NOT EXISTS pharmacies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  npi VARCHAR(10),
  ncpdp_id VARCHAR(7),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(2),
  zip_code VARCHAR(10),
  phone VARCHAR(20),
  fax VARCHAR(20),
  email VARCHAR(255),
  accepts_e_prescribing BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 3. System Tables
```sql
CREATE TABLE IF NOT EXISTS system_diagnostics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  check_date TIMESTAMPTZ DEFAULT NOW(),
  database_health VARCHAR(20),
  api_health VARCHAR(20),
  integration_health VARCHAR(20),
  storage_used_gb NUMERIC(10,2),
  active_users_count INTEGER,
  error_rate_percentage NUMERIC(5,2),
  performance_score INTEGER,
  issues_detected JSONB,
  recommendations JSONB
);

CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_key VARCHAR(100) UNIQUE NOT NULL,
  flag_name VARCHAR(255),
  description TEXT,
  is_enabled BOOLEAN DEFAULT false,
  rollout_percentage INTEGER DEFAULT 0,
  target_organizations UUID[],
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS system_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  announcement_type VARCHAR(50),
  priority VARCHAR(20) DEFAULT 'normal',
  start_date TIMESTAMPTZ DEFAULT NOW(),
  end_date TIMESTAMPTZ,
  is_dismissible BOOLEAN DEFAULT true,
  target_roles VARCHAR[],
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4. Patient Portal Tables
```sql
CREATE TABLE IF NOT EXISTS patient_portal_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email_verified BOOLEAN DEFAULT false,
  verification_token TEXT,
  last_login_at TIMESTAMPTZ,
  failed_login_attempts INTEGER DEFAULT 0,
  account_locked BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patient_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id),
  sender_type VARCHAR(20),
  sender_id UUID,
  subject VARCHAR(255),
  message_body TEXT,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patient_appointment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id),
  provider_id UUID REFERENCES providers(id),
  preferred_date DATE,
  preferred_time_start TIME,
  preferred_time_end TIME,
  appointment_type VARCHAR(100),
  reason TEXT,
  request_status VARCHAR(20) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  appointment_id UUID REFERENCES appointments(id)
);
```

## ⚠️ RLS Policy Issues

The following tables have RLS enabled but may have overly restrictive policies causing the errors:

1. **patients** - RLS is blocking inserts via API
   - Solution: Use service role key in API routes (already implemented in `/api/patients`)
   
2. **staff** - Infinite recursion in RLS policy
   - Solution: Simplify staff policies or use service role

3. **organizations** - RLS blocking super admin operations
   - Solution: Already using `createServiceClient()` in super-admin routes

## 📝 Recommended Actions

### Immediate (Run these now):

1. **Run missing table creation scripts** in Supabase SQL Editor
2. **Seed test patient data** - Run `scripts/seed_test_patients.sql`
3. **Seed OTP patients** - Run `scripts/seed_otp_patients.sql`

### Optional (For additional features):

4. Run `scripts/011_patient_reminders_schema.sql` if not already run
5. Run `scripts/012_subscription_schema.sql` for subscription features
6. Run `scripts/FINAL_LAUNCH_COMPLETE_SETUP.sql` for support portal

## 🔍 How to Check What's Missing

Run this query in Supabase SQL Editor to see all your tables:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_type = 'BASE TABLE'
ORDER BY table_name;
```

Compare the results with the scripts in the `/scripts` folder.

## 🚀 Quick Fix Script

Run this all-in-one script to add the most critical missing tables:

```sql
-- Critical missing tables
CREATE TABLE IF NOT EXISTS pharmacies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  npi VARCHAR(10),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(2),
  zip_code VARCHAR(10),
  phone VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert some sample pharmacies
INSERT INTO pharmacies (name, npi, address, city, state, zip_code, phone) VALUES
('CVS Pharmacy', '1234567890', '123 Main St', 'New York', 'NY', '10001', '555-0100'),
('Walgreens', '0987654321', '456 Broadway', 'New York', 'NY', '10002', '555-0200'),
('Rite Aid', '1122334455', '789 Park Ave', 'New York', 'NY', '10003', '555-0300')
ON CONFLICT DO NOTHING;

COMMIT;
```

## Note
Most core EMR functionality is working because all major tables exist. The errors you're experiencing are primarily due to RLS policies, not missing tables. We've already addressed most RLS issues by using the service role key in API routes.
