-- =====================================================
-- PART 4: Insurance Verification System
-- =====================================================

-- Insurance Verification Requests
CREATE TABLE IF NOT EXISTS insurance_verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  patient_id UUID,
  insurance_name TEXT NOT NULL,
  member_id TEXT NOT NULL,
  group_number TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'verified', 'failed'
  eligibility_status TEXT,
  coverage_start DATE,
  coverage_end DATE,
  copay_amount DECIMAL(10,2),
  deductible_amount DECIMAL(10,2),
  deductible_met DECIMAL(10,2),
  out_of_pocket_max DECIMAL(10,2),
  out_of_pocket_met DECIMAL(10,2),
  benefits_summary TEXT,
  verification_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prior Authorization Tracking
CREATE TABLE IF NOT EXISTS prior_authorizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  patient_id UUID,
  service_description TEXT NOT NULL,
  cpt_code TEXT,
  auth_number TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'denied', 'expired'
  requested_date DATE,
  approved_date DATE,
  expiration_date DATE,
  denial_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_insurance_verification_org ON insurance_verification_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_prior_auth_org ON prior_authorizations(organization_id);

SELECT 'Part 4: Insurance Verification created successfully!' AS status;
