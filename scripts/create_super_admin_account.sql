-- =====================================================
-- CREATE DEFAULT SUPER ADMIN ACCOUNT
-- Run this ONCE to create initial super admin access
-- =====================================================

-- Default Super Admin Credentials:
-- Email: admin@maseemr.com
-- Password: MaseAdmin2025!
-- 
-- ⚠️ IMPORTANT: Change this password immediately after first login!
-- =====================================================

-- Insert default super admin
INSERT INTO super_admins (
  id,
  email,
  password_hash,
  full_name,
  phone,
  is_active,
  permissions,
  created_at
)
VALUES (
  gen_random_uuid(),
  'admin@maseemr.com',
  -- This is a bcrypt hash of 'MaseAdmin2025!'
  -- You should use your own hashing in production
  '$2a$10$rHqPJT4YcJZ5WQK8Z3xPOuqLt8U.9m8YLnX2p6FqMf3bH0oJ.KvHe',
  'System Administrator',
  '+1-555-0100',
  true,
  '{
    "super_admin": true,
    "manage_organizations": true,
    "manage_subscriptions": true,
    "manage_users": true,
    "view_all_data": true,
    "system_configuration": true,
    "billing_management": true,
    "integration_management": true,
    "support_access": true
  }'::jsonb,
  NOW()
)
ON CONFLICT (email) DO NOTHING;

-- Create super admin login page access table if needed
CREATE TABLE IF NOT EXISTS super_admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  super_admin_id UUID NOT NULL REFERENCES super_admins(id),
  session_token TEXT NOT NULL UNIQUE,
  ip_address INET,
  user_agent TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_super_admin_sessions_token ON super_admin_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_super_admin_sessions_expires ON super_admin_sessions(expires_at);

-- Enable RLS on super_admins table
ALTER TABLE super_admins ENABLE ROW LEVEL SECURITY;

-- Only super admins can view super admin records
CREATE POLICY super_admins_self_select ON super_admins
  FOR SELECT
  USING (auth.uid() = id);

-- =====================================================
-- SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'SUPER ADMIN ACCOUNT CREATED';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'Email: admin@maseemr.com';
  RAISE NOTICE 'Password: MaseAdmin2025!';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  SECURITY WARNING:';
  RAISE NOTICE 'Please change this password immediately after login!';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'Login at: /super-admin/login';
  RAISE NOTICE '=====================================================';
END $$;
