-- CCBHC Certification Compliance Tracking Schema

-- Core Services Tracking
CREATE TABLE IF NOT EXISTS ccbhc_core_services_compliance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  service_name VARCHAR(255) NOT NULL,
  service_category VARCHAR(100) NOT NULL, -- crisis, outpatient, care_coordination, etc.
  compliance_status VARCHAR(50) NOT NULL DEFAULT 'compliant', -- compliant, partial, non_compliant
  compliance_score NUMERIC(5,2) CHECK (compliance_score >= 0 AND compliance_score <= 100),
  evidence_documentation TEXT,
  last_audit_date DATE,
  next_audit_due DATE,
  audit_findings TEXT,
  corrective_actions TEXT,
  responsible_staff_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Access & Availability Tracking
CREATE TABLE IF NOT EXISTS ccbhc_access_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  metric_date DATE NOT NULL,
  same_day_appointments_available INTEGER DEFAULT 0,
  same_day_appointments_filled INTEGER DEFAULT 0,
  walk_ins_accepted INTEGER DEFAULT 0,
  patients_turned_away INTEGER DEFAULT 0,
  turnaway_reasons JSONB, -- {reason: count}
  avg_wait_time_days NUMERIC(5,2),
  crisis_calls_answered INTEGER DEFAULT 0,
  crisis_response_time_avg_minutes NUMERIC(7,2),
  sliding_scale_patients INTEGER DEFAULT 0,
  uninsured_patients_served INTEGER DEFAULT 0,
  medicaid_patients_served INTEGER DEFAULT 0,
  medicare_patients_served INTEGER DEFAULT 0,
  private_insurance_patients INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Care Coordination Tracking
CREATE TABLE IF NOT EXISTS ccbhc_care_coordination (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  care_coordinator_id UUID NOT NULL,
  coordination_start_date DATE NOT NULL,
  coordination_status VARCHAR(50) DEFAULT 'active', -- active, completed, transferred
  care_plan_documented BOOLEAN DEFAULT FALSE,
  care_plan_last_updated DATE,
  community_referrals_made INTEGER DEFAULT 0,
  successful_referrals INTEGER DEFAULT 0,
  pending_referrals INTEGER DEFAULT 0,
  coordination_meetings_count INTEGER DEFAULT 0,
  last_coordination_meeting DATE,
  barriers_to_care TEXT,
  interventions_provided JSONB,
  outcomes_achieved JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quality Outcome Measures
CREATE TABLE IF NOT EXISTS ccbhc_quality_measures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  measurement_period_start DATE NOT NULL,
  measurement_period_end DATE NOT NULL,
  measure_name VARCHAR(255) NOT NULL,
  measure_category VARCHAR(100) NOT NULL, -- screening, follow_up, engagement, outcomes
  numerator INTEGER NOT NULL DEFAULT 0, -- patients meeting criteria
  denominator INTEGER NOT NULL DEFAULT 0, -- eligible patients
  rate NUMERIC(5,2) GENERATED ALWAYS AS (
    CASE WHEN denominator > 0 THEN (numerator::NUMERIC / denominator::NUMERIC * 100) ELSE 0 END
  ) STORED,
  benchmark_rate NUMERIC(5,2),
  performance_status VARCHAR(50), -- exceeds, meets, below
  improvement_actions TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Staffing Compliance
CREATE TABLE IF NOT EXISTS ccbhc_staffing_compliance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  audit_date DATE NOT NULL,
  designated_collaborating_org BOOLEAN DEFAULT FALSE,
  collaborating_org_name VARCHAR(255),
  collaborating_org_contact TEXT,
  psychiatric_consultant_id UUID,
  psychiatric_consultant_hours_per_week NUMERIC(5,2),
  licensed_prescribers_count INTEGER DEFAULT 0,
  licensed_clinical_staff_count INTEGER DEFAULT 0,
  peer_specialists_count INTEGER DEFAULT 0,
  care_coordinators_count INTEGER DEFAULT 0,
  total_patients_served INTEGER DEFAULT 0,
  staff_patient_ratio NUMERIC(7,2),
  staff_training_compliance_rate NUMERIC(5,2),
  training_gaps_identified TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Community Partnerships
CREATE TABLE IF NOT EXISTS ccbhc_community_partnerships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  partner_name VARCHAR(255) NOT NULL,
  partner_type VARCHAR(100) NOT NULL, -- healthcare, housing, employment, education, legal, etc.
  partnership_status VARCHAR(50) DEFAULT 'active', -- active, inactive, pending
  partnership_agreement_signed BOOLEAN DEFAULT FALSE,
  agreement_date DATE,
  agreement_expiration_date DATE,
  services_provided TEXT,
  referrals_sent_30_days INTEGER DEFAULT 0,
  referrals_received_30_days INTEGER DEFAULT 0,
  successful_collaborations INTEGER DEFAULT 0,
  contact_person VARCHAR(255),
  contact_phone VARCHAR(20),
  contact_email VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Certification Audit History
CREATE TABLE IF NOT EXISTS ccbhc_certification_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  audit_date DATE NOT NULL,
  audit_type VARCHAR(100) NOT NULL, -- initial, annual, spot_check, recertification
  auditor_name VARCHAR(255),
  auditor_organization VARCHAR(255),
  overall_compliance_score NUMERIC(5,2) CHECK (overall_compliance_score >= 0 AND overall_compliance_score <= 100),
  certification_status VARCHAR(50) NOT NULL, -- certified, provisional, non_certified
  areas_of_strength TEXT,
  areas_needing_improvement TEXT,
  corrective_action_plan TEXT,
  corrective_action_due_date DATE,
  follow_up_required BOOLEAN DEFAULT FALSE,
  follow_up_date DATE,
  audit_report_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices for performance
CREATE INDEX idx_ccbhc_core_services_org ON ccbhc_core_services_compliance(organization_id);
CREATE INDEX idx_ccbhc_access_metrics_date ON ccbhc_access_metrics(metric_date);
CREATE INDEX idx_ccbhc_care_coord_patient ON ccbhc_care_coordination(patient_id);
CREATE INDEX idx_ccbhc_quality_measures_period ON ccbhc_quality_measures(measurement_period_start, measurement_period_end);
CREATE INDEX idx_ccbhc_partnerships_org ON ccbhc_community_partnerships(organization_id);
CREATE INDEX idx_ccbhc_audits_org ON ccbhc_certification_audits(organization_id, audit_date);

-- RLS Policies
ALTER TABLE ccbhc_core_services_compliance ENABLE ROW LEVEL SECURITY;
ALTER TABLE ccbhc_access_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE ccbhc_care_coordination ENABLE ROW LEVEL SECURITY;
ALTER TABLE ccbhc_quality_measures ENABLE ROW LEVEL SECURITY;
ALTER TABLE ccbhc_staffing_compliance ENABLE ROW LEVEL SECURITY;
ALTER TABLE ccbhc_community_partnerships ENABLE ROW LEVEL SECURITY;
ALTER TABLE ccbhc_certification_audits ENABLE ROW LEVEL SECURITY;

-- Allow authenticated staff to read all CCBHC compliance data
CREATE POLICY ccbhc_staff_read_all ON ccbhc_core_services_compliance FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY ccbhc_access_read ON ccbhc_access_metrics FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY ccbhc_coord_read ON ccbhc_care_coordination FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY ccbhc_quality_read ON ccbhc_quality_measures FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY ccbhc_staffing_read ON ccbhc_staffing_compliance FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY ccbhc_partnerships_read ON ccbhc_community_partnerships FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY ccbhc_audits_read ON ccbhc_certification_audits FOR SELECT USING (auth.role() = 'authenticated');
