-- Multi-tenant system for managing multiple clinics/practices
-- Each clinic is isolated and has its own users, patients, and data

-- Organizations/Clinics table
CREATE TABLE IF NOT EXISTS organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_name VARCHAR(255) NOT NULL,
  organization_slug VARCHAR(100) UNIQUE NOT NULL,
  organization_type VARCHAR(50), -- 'behavioral_health', 'primary_care', 'multi_specialty'
  specialties JSONB DEFAULT '[]'::jsonb, -- Array of enabled specialties
  subscription_id UUID REFERENCES clinic_subscriptions(id),
  status VARCHAR(50) DEFAULT 'active', -- 'active', 'suspended', 'inactive'
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(50),
  zip_code VARCHAR(20),
  phone VARCHAR(50),
  email VARCHAR(255),
  tax_id VARCHAR(50),
  npi_number VARCHAR(50),
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User accounts table (replaces multiple role-specific tables)
CREATE TABLE IF NOT EXISTS user_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_type VARCHAR(50) NOT NULL, -- 'super_admin', 'admin', 'provider', 'staff', 'patient'
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(50),
  employee_id VARCHAR(100),
  license_number VARCHAR(100),
  license_type VARCHAR(100),
  npi_number VARCHAR(50),
  specialization VARCHAR(100),
  department VARCHAR(100),
  role VARCHAR(50), -- Specific role within user_type
  permissions JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Super admin users (subscription managers) - not tied to any organization
CREATE TABLE IF NOT EXISTS super_admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  permissions JSONB DEFAULT '{"manage_organizations": true, "manage_subscriptions": true, "view_all_data": true}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_login_at TIMESTAMPTZ
);

-- Organization feature access (tracks what features each clinic has)
CREATE TABLE IF NOT EXISTS organization_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  feature_code VARCHAR(100) NOT NULL,
  feature_name VARCHAR(255),
  is_enabled BOOLEAN DEFAULT true,
  enabled_at TIMESTAMPTZ DEFAULT NOW(),
  disabled_at TIMESTAMPTZ,
  UNIQUE(organization_id, feature_code)
);

-- Login activity log
CREATE TABLE IF NOT EXISTS login_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID, -- Can be user_account.id or super_admin.id
  user_type VARCHAR(50), -- 'super_admin', 'admin', 'provider', 'staff', 'patient'
  organization_id UUID REFERENCES organizations(id),
  email VARCHAR(255),
  login_status VARCHAR(50), -- 'success', 'failed'
  failure_reason TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_accounts_org ON user_accounts(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_accounts_email ON user_accounts(email);
CREATE INDEX IF NOT EXISTS idx_user_accounts_type ON user_accounts(user_type);
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(organization_slug);
CREATE INDEX IF NOT EXISTS idx_login_activity_user ON login_activity(user_id, created_at);

-- Insert default super admin (password: Admin@123)
INSERT INTO super_admins (email, password_hash, full_name, phone)
VALUES 
  ('admin@mase-emr.com', '$2a$10$rKq8FxQfx.VLVpq7FxQfxOfxQfxQfxQfxQfxQfxQfxQfxQfxQfxQe', 'System Administrator', '555-0100')
ON CONFLICT (email) DO NOTHING;

-- Sample organization
INSERT INTO organizations (organization_name, organization_slug, organization_type, specialties, address, city, state, zip_code, phone, email)
VALUES 
  ('MASE Behavioral Health Clinic', 'mase-behavioral', 'behavioral_health', '["Behavioral Health/OTP/MAT", "Psychiatry"]', '123 Main St', 'Detroit', 'MI', '48201', '313-555-0100', 'info@mase-behavioral.com')
ON CONFLICT (organization_slug) DO NOTHING;

COMMENT ON TABLE organizations IS 'Multi-tenant organizations/clinics table';
COMMENT ON TABLE user_accounts IS 'Unified user accounts for all user types within organizations';
COMMENT ON TABLE super_admins IS 'Platform administrators who manage multiple organizations';
COMMENT ON TABLE organization_features IS 'Feature flags and specialty access per organization';
