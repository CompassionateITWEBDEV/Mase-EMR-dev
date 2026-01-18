-- =====================================================
-- PART 3: Clinic Onboarding System
-- =====================================================

-- Clinic Onboarding Progress
CREATE TABLE IF NOT EXISTS clinic_onboarding_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE UNIQUE,
  step_1_basic_info BOOLEAN DEFAULT false,
  step_2_insurance BOOLEAN DEFAULT false,
  step_3_specialties BOOLEAN DEFAULT false,
  step_4_complete BOOLEAN DEFAULT false,
  npi TEXT,
  tax_id TEXT,
  license_number TEXT,
  dea_number TEXT,
  facility_type TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clinic Insurance Plans
CREATE TABLE IF NOT EXISTS clinic_insurance_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  insurance_name TEXT NOT NULL,
  payer_id TEXT,
  accepts_plan BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, insurance_name)
);

CREATE INDEX IF NOT EXISTS idx_clinic_insurance_org ON clinic_insurance_plans(organization_id);

SELECT 'Part 3: Clinic Onboarding created successfully!' AS status;
