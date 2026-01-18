-- Enhanced Provider Registration System with Services, Pricing, and MASE EMR Trial

-- Provider Services offered
CREATE TABLE IF NOT EXISTS provider_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES external_providers(id) ON DELETE CASCADE,
  service_name TEXT NOT NULL,
  service_category TEXT NOT NULL, -- therapy, medical, case_management, peer_support, housing, employment, legal
  description TEXT,
  price DECIMAL(10,2),
  pricing_type TEXT DEFAULT 'per_session', -- per_session, hourly, monthly, sliding_scale, free
  insurance_accepted BOOLEAN DEFAULT false,
  medicaid_accepted BOOLEAN DEFAULT false,
  accepts_uninsured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Provider MASE EMR Trial Applications
CREATE TABLE IF NOT EXISTS provider_mase_trial_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Basic Provider Info
  organization_name TEXT NOT NULL,
  provider_name TEXT NOT NULL,
  provider_type TEXT NOT NULL,
  npi_number TEXT,
  specialty TEXT,
  
  -- Contact Information
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  fax TEXT,
  website TEXT,
  address TEXT,
  city TEXT,
  state TEXT DEFAULT 'MI',
  zip_code TEXT,
  
  -- Practice Details
  practice_size TEXT, -- solo, small_group, large_group, hospital
  current_emr TEXT, -- Current EMR system they use
  num_providers INTEGER,
  num_staff INTEGER,
  patient_volume_monthly INTEGER,
  
  -- Services Offered (JSON array)
  services_offered JSONB DEFAULT '[]'::jsonb, -- [{name, category, price, pricing_type}]
  
  -- MASE Trial Interest
  trial_requested BOOLEAN DEFAULT false,
  trial_start_date DATE,
  trial_duration_days INTEGER DEFAULT 30,
  features_interested TEXT[], -- referral_management, patient_portal, michigan_reporting, hr_management, etc.
  
  -- Application Status
  status TEXT DEFAULT 'pending_review', -- pending_review, approved, trial_active, converted_to_paid, declined
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  
  -- Trial Activation
  trial_activated_at TIMESTAMPTZ,
  trial_expires_at TIMESTAMPTZ,
  trial_api_key TEXT UNIQUE,
  trial_subdomain TEXT UNIQUE,
  
  -- Conversion
  converted_to_paid BOOLEAN DEFAULT false,
  conversion_date TIMESTAMPTZ,
  subscription_tier TEXT, -- starter, professional, enterprise
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Provider Portal Access (after approval)
CREATE TABLE IF NOT EXISTS provider_portal_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES external_providers(id) ON DELETE CASCADE,
  trial_application_id UUID REFERENCES provider_mase_trial_applications(id),
  
  -- Access Level
  access_level TEXT DEFAULT 'basic', -- basic, trial, premium, enterprise
  features_enabled TEXT[], -- referral_management, patient_data_access, billing, reporting, etc.
  
  -- Login Credentials
  login_email TEXT UNIQUE,
  password_hash TEXT,
  last_login_at TIMESTAMPTZ,
  
  -- Usage Tracking
  referrals_sent INTEGER DEFAULT 0,
  referrals_received INTEGER DEFAULT 0,
  patients_shared INTEGER DEFAULT 0,
  active_collaborations INTEGER DEFAULT 0,
  
  -- Limits (for trial accounts)
  monthly_referral_limit INTEGER DEFAULT 50,
  patient_data_limit INTEGER DEFAULT 100,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  suspended_at TIMESTAMPTZ,
  suspension_reason TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Provider Activity Log
CREATE TABLE IF NOT EXISTS provider_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID REFERENCES external_providers(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL, -- login, referral_sent, patient_viewed, message_sent, etc.
  activity_details JSONB DEFAULT '{}'::jsonb,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_provider_services_provider ON provider_services(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_services_category ON provider_services(service_category);
CREATE INDEX IF NOT EXISTS idx_mase_trial_status ON provider_mase_trial_applications(status);
CREATE INDEX IF NOT EXISTS idx_mase_trial_email ON provider_mase_trial_applications(email);
CREATE INDEX IF NOT EXISTS idx_provider_portal_access_email ON provider_portal_access(login_email);
CREATE INDEX IF NOT EXISTS idx_provider_activity_provider ON provider_activity_log(provider_id);

COMMIT;
