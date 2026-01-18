-- CCBHC Community Outreach Compliance Tracking Schema
-- Tracks adherence to CCBHC certification criteria for outreach services

-- Core CCBHC Services Tracking
CREATE TABLE IF NOT EXISTS ccbhc_service_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_code VARCHAR(50) UNIQUE NOT NULL,
  service_name VARCHAR(255) NOT NULL,
  service_category VARCHAR(100) NOT NULL, -- crisis, screening, assessment, treatment, case_management, recovery_support
  is_required_ccbhc BOOLEAN DEFAULT true,
  description TEXT,
  regulatory_reference TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert CCBHC required services
INSERT INTO ccbhc_service_types (service_code, service_name, service_category, is_required_ccbhc, regulatory_reference) VALUES
('CRISIS_24_7', '24/7 Crisis Intervention', 'crisis', true, '42 CFR § 438.3(u)(1)(i)'),
('CRISIS_MOBILE', 'Mobile Crisis Response', 'crisis', true, '42 CFR § 438.3(u)(1)(ii)'),
('SCREENING', 'Initial Screening & Triage', 'screening', true, '42 CFR § 438.3(u)(2)'),
('ASSESSMENT_COMP', 'Comprehensive Assessment', 'assessment', true, '42 CFR § 438.3(u)(3)'),
('TREATMENT_MH', 'Mental Health Treatment', 'treatment', true, '42 CFR § 438.3(u)(4)'),
('TREATMENT_SUD', 'Substance Use Disorder Treatment', 'treatment', true, '42 CFR § 438.3(u)(4)'),
('CASE_MGMT', 'Care Coordination/Case Management', 'case_management', true, '42 CFR § 438.3(u)(5)'),
('RECOVERY_PEER', 'Peer Support Services', 'recovery_support', true, '42 CFR § 438.3(u)(6)'),
('RECOVERY_FAMILY', 'Family Support Services', 'recovery_support', true, '42 CFR § 438.3(u)(6)'),
('PRIMARY_CARE', 'Primary Care Screening & Monitoring', 'treatment', true, '42 CFR § 438.3(u)(7)'),
('PSYCHIATRIC_REHAB', 'Psychiatric Rehabilitation', 'treatment', true, '42 CFR § 438.3(u)(8)'),
('OUTREACH', 'Targeted Community Outreach', 'outreach', true, '42 CFR § 438.3(u)(9)')
ON CONFLICT (service_code) DO NOTHING;

-- Community Outreach Encounters (CCBHC Compliant)
CREATE TABLE IF NOT EXISTS ccbhc_outreach_encounters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_number VARCHAR(50) UNIQUE NOT NULL,
  encounter_date DATE NOT NULL,
  encounter_time TIME NOT NULL,
  encounter_type VARCHAR(100) NOT NULL, -- screening, crisis, assessment, referral, education
  service_provided VARCHAR(50) REFERENCES ccbhc_service_types(service_code),
  
  -- Patient/Individual Information (may be anonymous)
  patient_id UUID REFERENCES patients(id),
  is_anonymous BOOLEAN DEFAULT false,
  anonymous_demographics JSONB, -- {age_range, gender, zip_code}
  
  -- CCBHC Requirements
  ability_to_pay_assessed BOOLEAN DEFAULT false,
  payment_source VARCHAR(100), -- medicaid, medicare, private, sliding_scale, uninsured, no_charge
  sliding_scale_applied BOOLEAN DEFAULT false,
  no_wrong_door_policy_applied BOOLEAN DEFAULT true,
  
  -- Screening & Assessment
  screening_tool_used VARCHAR(100),
  screening_results JSONB,
  risk_level VARCHAR(50), -- low, moderate, high, crisis
  immediate_safety_concerns BOOLEAN DEFAULT false,
  crisis_intervention_needed BOOLEAN DEFAULT false,
  
  -- Care Coordination
  needs_identified JSONB, -- array of service needs
  referrals_made JSONB, -- array of referral details
  care_coordination_provided BOOLEAN DEFAULT false,
  follow_up_scheduled BOOLEAN DEFAULT false,
  follow_up_date DATE,
  
  -- Recovery Support
  peer_support_offered BOOLEAN DEFAULT false,
  family_support_offered BOOLEAN DEFAULT false,
  recovery_resources_provided JSONB,
  
  -- Outreach Staff
  staff_id UUID REFERENCES staff(id),
  staff_role VARCHAR(100),
  
  -- Location & Method
  encounter_location VARCHAR(255),
  encounter_method VARCHAR(50), -- in_person, mobile, telehealth, phone, community_event
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  
  -- Outcomes
  outcome VARCHAR(100), -- enrolled, referred, crisis_resolved, follow_up_needed, declined
  outcome_notes TEXT,
  
  -- CCBHC Compliance Tracking
  services_offered_count INTEGER DEFAULT 0,
  ccbhc_criteria_met BOOLEAN DEFAULT true,
  compliance_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CCBHC Access Regardless of Ability to Pay Tracking
CREATE TABLE IF NOT EXISTS ccbhc_financial_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_id UUID REFERENCES ccbhc_outreach_encounters(id),
  patient_id UUID REFERENCES patients(id),
  
  -- Financial Screening
  income_level VARCHAR(50), -- below_poverty, 100_200_fpl, above_200_fpl, declined_to_answer
  insurance_status VARCHAR(100),
  insurance_accepted BOOLEAN,
  
  -- CCBHC Requirement: Access Regardless of Ability to Pay
  service_provided_without_insurance BOOLEAN DEFAULT false,
  sliding_fee_scale_applied BOOLEAN DEFAULT false,
  sliding_fee_percentage INTEGER, -- 0-100
  payment_plan_offered BOOLEAN DEFAULT false,
  no_cost_services_provided BOOLEAN DEFAULT false,
  
  -- Documentation
  financial_assistance_application_completed BOOLEAN DEFAULT false,
  medicaid_application_assistance BOOLEAN DEFAULT false,
  
  -- Compliance
  turned_away_due_to_payment BOOLEAN DEFAULT false, -- Should ALWAYS be false for CCBHC
  payment_barrier_documented TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CCBHC Designated Collaborating Organizations (DCOs)
CREATE TABLE IF NOT EXISTS ccbhc_designated_collaborating_orgs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_name VARCHAR(255) NOT NULL,
  organization_type VARCHAR(100) NOT NULL, -- hospital, specialty_provider, social_services, housing, etc
  
  -- Contact Information
  contact_name VARCHAR(255),
  contact_phone VARCHAR(20),
  contact_email VARCHAR(255),
  address TEXT,
  
  -- Services Provided
  services_offered JSONB,
  accepts_ccbhc_referrals BOOLEAN DEFAULT true,
  
  -- Collaboration Agreement
  mou_signed BOOLEAN DEFAULT false,
  mou_signed_date DATE,
  mou_expiration_date DATE,
  care_coordination_protocol JSONB,
  
  -- Performance Metrics
  referrals_sent_count INTEGER DEFAULT 0,
  referrals_completed_count INTEGER DEFAULT 0,
  average_response_time_days NUMERIC(5,2),
  
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- CCBHC Quality Measures for Outreach
CREATE TABLE IF NOT EXISTS ccbhc_outreach_quality_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporting_period_start DATE NOT NULL,
  reporting_period_end DATE NOT NULL,
  
  -- Access Measures
  total_encounters INTEGER DEFAULT 0,
  unique_individuals_served INTEGER DEFAULT 0,
  new_clients_enrolled INTEGER DEFAULT 0,
  crisis_encounters_24_7 INTEGER DEFAULT 0,
  
  -- Financial Access (CCBHC Requirement)
  encounters_uninsured INTEGER DEFAULT 0,
  encounters_sliding_scale INTEGER DEFAULT 0,
  encounters_no_charge INTEGER DEFAULT 0,
  individuals_turned_away INTEGER DEFAULT 0, -- Should be 0
  
  -- Service Delivery
  screenings_completed INTEGER DEFAULT 0,
  assessments_completed INTEGER DEFAULT 0,
  crisis_interventions INTEGER DEFAULT 0,
  referrals_made INTEGER DEFAULT 0,
  care_coordination_provided INTEGER DEFAULT 0,
  
  -- Recovery Support
  peer_support_encounters INTEGER DEFAULT 0,
  family_support_encounters INTEGER DEFAULT 0,
  
  -- Outcomes
  successful_linkage_to_care_percentage NUMERIC(5,2),
  follow_up_completion_percentage NUMERIC(5,2),
  crisis_stabilization_percentage NUMERIC(5,2),
  
  -- CCBHC Compliance Score
  ccbhc_compliance_score NUMERIC(5,2), -- 0-100
  compliance_barriers TEXT,
  
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  generated_by UUID REFERENCES staff(id)
);

-- CCBHC Needs Assessment (for outreach program planning)
CREATE TABLE IF NOT EXISTS ccbhc_community_needs_assessment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_year INTEGER NOT NULL,
  geographic_area VARCHAR(255),
  
  -- Population Demographics
  total_population INTEGER,
  population_demographics JSONB,
  
  -- Identified Needs
  mental_health_need_prevalence NUMERIC(5,2), -- percentage
  sud_need_prevalence NUMERIC(5,2),
  crisis_services_gap BOOLEAN DEFAULT false,
  access_barriers JSONB, -- transportation, language, stigma, etc
  
  -- Service Gaps
  unmet_needs_identified JSONB,
  recommended_services_expansion JSONB,
  
  -- Stakeholder Input
  community_forums_held INTEGER DEFAULT 0,
  stakeholder_interviews INTEGER DEFAULT 0,
  key_findings TEXT,
  
  -- Action Plan
  outreach_strategy JSONB,
  implementation_timeline JSONB,
  
  assessed_by UUID REFERENCES staff(id),
  approved_by UUID REFERENCES staff(id),
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_ccbhc_encounters_date ON ccbhc_outreach_encounters(encounter_date);
CREATE INDEX IF NOT EXISTS idx_ccbhc_encounters_patient ON ccbhc_outreach_encounters(patient_id);
CREATE INDEX IF NOT EXISTS idx_ccbhc_encounters_type ON ccbhc_outreach_encounters(encounter_type);
CREATE INDEX IF NOT EXISTS idx_ccbhc_financial_access_patient ON ccbhc_financial_access_log(patient_id);
CREATE INDEX IF NOT EXISTS idx_ccbhc_dco_active ON ccbhc_designated_collaborating_orgs(is_active);

-- Row Level Security
ALTER TABLE ccbhc_outreach_encounters ENABLE ROW LEVEL SECURITY;
ALTER TABLE ccbhc_financial_access_log ENABLE ROW LEVEL SECURITY;

-- Policy: Public can insert anonymous screenings
CREATE POLICY "public_anonymous_screening" ON ccbhc_outreach_encounters
  FOR INSERT
  WITH CHECK (is_anonymous = true);

-- Policy: Authenticated staff can view all
CREATE POLICY "staff_view_all_encounters" ON ccbhc_outreach_encounters
  FOR SELECT
  USING (auth.role() = 'authenticated');

-- Policy: Staff can view financial access logs
CREATE POLICY "staff_view_financial_logs" ON ccbhc_financial_access_log
  FOR SELECT
  USING (auth.role() = 'authenticated');

COMMENT ON TABLE ccbhc_outreach_encounters IS 'Tracks all community outreach encounters per CCBHC certification criteria 42 CFR § 438.3(u)';
COMMENT ON TABLE ccbhc_financial_access_log IS 'Documents CCBHC requirement to provide access regardless of ability to pay';
COMMENT ON TABLE ccbhc_designated_collaborating_orgs IS 'Tracks DCOs as required for CCBHC network of care coordination';
COMMENT ON TABLE ccbhc_outreach_quality_metrics IS 'CCBHC-specific quality measures for community outreach program';
