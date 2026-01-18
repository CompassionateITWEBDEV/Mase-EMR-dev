-- Create external/collaborating providers table
CREATE TABLE IF NOT EXISTS external_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_name VARCHAR(255) NOT NULL,
  provider_name VARCHAR(255) NOT NULL,
  provider_type VARCHAR(100) NOT NULL, -- PCP, Specialist, Mental Health, Social Services, etc.
  npi_number VARCHAR(20),
  license_number VARCHAR(50),
  specialty VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(20),
  fax VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(50),
  zip_code VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  is_verified BOOLEAN DEFAULT false,
  verification_date TIMESTAMP WITH TIME ZONE,
  collaboration_agreement_signed BOOLEAN DEFAULT false,
  agreement_date DATE,
  agreement_expiry DATE,
  hipaa_trained BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create shared patient authorizations table (42 CFR Part 2 compliant)
CREATE TABLE IF NOT EXISTS patient_sharing_authorizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id),
  external_provider_id UUID REFERENCES external_providers(id),
  authorization_type VARCHAR(50) NOT NULL, -- 'full', 'limited', 'emergency_only'
  purpose TEXT NOT NULL,
  information_types JSONB, -- What info can be shared
  effective_date DATE NOT NULL,
  expiration_date DATE,
  revoked_at TIMESTAMP WITH TIME ZONE,
  revoked_by UUID,
  revocation_reason TEXT,
  signed_consent_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create collaboration notes table
CREATE TABLE IF NOT EXISTS collaboration_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id),
  external_provider_id UUID REFERENCES external_providers(id),
  internal_provider_id UUID REFERENCES providers(id),
  note_type VARCHAR(50) NOT NULL, -- 'consultation', 'referral', 'care_coordination', 'treatment_update'
  subject VARCHAR(255),
  note_content TEXT NOT NULL,
  clinical_data JSONB, -- Structured clinical info
  attachments JSONB,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  is_urgent BOOLEAN DEFAULT false,
  requires_response BOOLEAN DEFAULT false,
  response_due_date DATE,
  parent_note_id UUID REFERENCES collaboration_notes(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create referral tracking table
CREATE TABLE IF NOT EXISTS provider_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id),
  referring_provider_id UUID REFERENCES providers(id),
  external_provider_id UUID REFERENCES external_providers(id),
  referral_type VARCHAR(100) NOT NULL,
  referral_reason TEXT NOT NULL,
  clinical_information TEXT,
  diagnosis_codes JSONB,
  urgency VARCHAR(20) DEFAULT 'routine', -- routine, urgent, emergent
  preferred_date DATE,
  status VARCHAR(50) DEFAULT 'pending', -- pending, accepted, scheduled, completed, declined, cancelled
  status_updated_at TIMESTAMP WITH TIME ZONE,
  appointment_date TIMESTAMP WITH TIME ZONE,
  outcome TEXT,
  outcome_date DATE,
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create collaboration activity log (audit trail)
CREATE TABLE IF NOT EXISTS collaboration_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  external_provider_id UUID REFERENCES external_providers(id),
  patient_id UUID REFERENCES patients(id),
  action VARCHAR(100) NOT NULL,
  action_details TEXT,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_external_providers_active ON external_providers(is_active);
CREATE INDEX IF NOT EXISTS idx_patient_sharing_auth_patient ON patient_sharing_authorizations(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_sharing_auth_provider ON patient_sharing_authorizations(external_provider_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_notes_patient ON collaboration_notes(patient_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_notes_external ON collaboration_notes(external_provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_referrals_patient ON provider_referrals(patient_id);
CREATE INDEX IF NOT EXISTS idx_provider_referrals_status ON provider_referrals(status);
