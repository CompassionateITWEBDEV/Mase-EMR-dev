-- Clinic onboarding and insurance management tables

-- Clinic onboarding tracking
CREATE TABLE IF NOT EXISTS clinic_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  current_step INTEGER DEFAULT 1,
  completed_steps JSONB DEFAULT '[]'::jsonb,
  basic_info_completed BOOLEAN DEFAULT false,
  insurance_configured BOOLEAN DEFAULT false,
  specialty_selected BOOLEAN DEFAULT false,
  staff_added BOOLEAN DEFAULT false,
  integrations_configured BOOLEAN DEFAULT false,
  onboarding_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Clinic insurance plans (which insurance plans the clinic accepts)
CREATE TABLE IF NOT EXISTS clinic_insurance_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  payer_id UUID REFERENCES insurance_payers(id),
  custom_payer_name VARCHAR(255),
  plan_type VARCHAR(100),
  network_status VARCHAR(50), -- in-network, out-of-network, preferred
  contract_start_date DATE,
  contract_end_date DATE,
  reimbursement_rate DECIMAL(5,2), -- percentage
  requires_prior_auth BOOLEAN DEFAULT false,
  accepts_new_patients BOOLEAN DEFAULT true,
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  added_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Clinic configuration
CREATE TABLE IF NOT EXISTS clinic_configuration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL UNIQUE REFERENCES organizations(id) ON DELETE CASCADE,
  npi_number VARCHAR(20),
  tax_id VARCHAR(20),
  license_number VARCHAR(100),
  dea_number VARCHAR(20),
  facility_type VARCHAR(100),
  bed_count INTEGER,
  operating_hours JSONB, -- {monday: {open: "08:00", close: "17:00"}, ...}
  timezone VARCHAR(50) DEFAULT 'America/Detroit',
  billing_npi VARCHAR(20),
  place_of_service_code VARCHAR(10),
  clearinghouse_config JSONB,
  ehr_settings JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Clinic specialty assignments
CREATE TABLE IF NOT EXISTS clinic_specialties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  specialty_code VARCHAR(100) NOT NULL,
  specialty_name VARCHAR(255) NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  enabled_features JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(organization_id, specialty_code)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_clinic_onboarding_org ON clinic_onboarding(organization_id);
CREATE INDEX IF NOT EXISTS idx_clinic_insurance_org ON clinic_insurance_plans(organization_id);
CREATE INDEX IF NOT EXISTS idx_clinic_config_org ON clinic_configuration(organization_id);
CREATE INDEX IF NOT EXISTS idx_clinic_specialties_org ON clinic_specialties(organization_id);
