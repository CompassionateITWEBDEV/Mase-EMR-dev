-- Michigan Health Information Network (MiHIN) Integration
-- Positions MASE as operational layer feeding Michigan's statewide health data utility

CREATE TABLE IF NOT EXISTS mihin_connection_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  mihin_participant_id VARCHAR(50) NOT NULL UNIQUE,
  mihin_organization_name VARCHAR(255) NOT NULL,
  connection_type VARCHAR(50) NOT NULL, -- 'direct', 'ehealth_exchange', 'carequality'
  connection_status VARCHAR(50) DEFAULT 'active',
  api_endpoint TEXT,
  certificate_path TEXT,
  certificate_expiration DATE,
  connectivity_test_passed BOOLEAN DEFAULT false,
  last_connectivity_test TIMESTAMP WITH TIME ZONE,
  hipaa_compliant BOOLEAN DEFAULT true,
  cfr_part_2_compliant BOOLEAN DEFAULT true,
  direct_address VARCHAR(255), -- provider@organization.mihin.org
  hisp_endpoint TEXT,
  production_ready BOOLEAN DEFAULT false,
  go_live_date DATE,
  technical_contact_name VARCHAR(255),
  technical_contact_email VARCHAR(255),
  technical_contact_phone VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mihin_data_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  submission_type VARCHAR(100) NOT NULL, -- 'clinical_quality', 'syndromic_surveillance', 'immunizations', 'prescriptions', 'lab_results'
  submission_category VARCHAR(100), -- 'opioid_surveillance', 'behavioral_health', 'public_health'
  data_source_table VARCHAR(100), -- which table the data came from
  record_ids JSONB, -- array of IDs from source table
  total_records INTEGER,
  submission_status VARCHAR(50) DEFAULT 'pending',
  submission_date TIMESTAMP WITH TIME ZONE,
  acknowledgment_received BOOLEAN DEFAULT false,
  acknowledgment_date TIMESTAMP WITH TIME ZONE,
  mihin_message_id VARCHAR(255),
  hl7_message TEXT,
  ccda_document TEXT,
  fhir_bundle JSONB,
  transmission_method VARCHAR(50), -- 'direct', 'fhir_api', 'hl7_v2', 'ccda'
  validation_status VARCHAR(50),
  validation_errors JSONB,
  retry_count INTEGER DEFAULT 0,
  last_retry_at TIMESTAMP WITH TIME ZONE,
  submitted_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mihin_workflow_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  workflow_type VARCHAR(100) NOT NULL, -- 'mat_admission', 'crisis_intervention', 'care_coordination', 'diversion_prevention'
  patient_id UUID,
  encounter_id UUID,
  outcome_measure VARCHAR(255) NOT NULL,
  outcome_value NUMERIC,
  outcome_unit VARCHAR(50),
  measurement_date TIMESTAMP WITH TIME ZONE,
  improvement_from_baseline NUMERIC,
  meets_quality_threshold BOOLEAN,
  submitted_to_mihin BOOLEAN DEFAULT false,
  mihin_submission_id UUID REFERENCES mihin_data_submissions(id),
  state_reporting_required BOOLEAN DEFAULT false,
  state_report_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mihin_provider_directory_sync (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  provider_id UUID,
  mihin_provider_id VARCHAR(100),
  npi_number VARCHAR(10),
  provider_name VARCHAR(255),
  specialty VARCHAR(100),
  direct_address VARCHAR(255),
  sync_status VARCHAR(50) DEFAULT 'active',
  last_sync_at TIMESTAMP WITH TIME ZONE,
  accepts_referrals BOOLEAN DEFAULT true,
  accepting_new_patients BOOLEAN DEFAULT true,
  directory_listing_public BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS mihin_quality_reporting (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  reporting_period_start DATE NOT NULL,
  reporting_period_end DATE NOT NULL,
  report_type VARCHAR(100) NOT NULL, -- 'hedis', 'uds', 'pqrs', 'ccbhc_measures'
  measure_code VARCHAR(50),
  measure_name VARCHAR(255),
  numerator INTEGER,
  denominator INTEGER,
  performance_rate NUMERIC,
  benchmark_rate NUMERIC,
  meets_benchmark BOOLEAN,
  stratification JSONB, -- age, race, gender breakdowns
  submitted_to_mihin BOOLEAN DEFAULT false,
  mihin_submission_id UUID REFERENCES mihin_data_submissions(id),
  submission_date TIMESTAMP WITH TIME ZONE,
  accepted_by_state BOOLEAN DEFAULT false,
  state_confirmation_number VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 988 Lifeline Integration Tracking
CREATE TABLE IF NOT EXISTS crisis_988_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  patient_id UUID,
  encounter_id UUID,
  referral_source VARCHAR(100), -- 'patient_portal', 'community_outreach', 'provider_referral', 'automated_screening'
  risk_level VARCHAR(50), -- 'low', 'moderate', 'high', 'imminent'
  screening_scores JSONB, -- PHQ-9, GAD-7, Columbia Suicide Severity Rating Scale
  called_988 BOOLEAN DEFAULT false,
  call_timestamp TIMESTAMP WITH TIME ZONE,
  follow_up_scheduled BOOLEAN DEFAULT false,
  follow_up_date DATE,
  safety_plan_created BOOLEAN DEFAULT false,
  safety_plan_id UUID,
  warm_handoff_completed BOOLEAN DEFAULT false,
  crisis_stabilization_needed BOOLEAN,
  hospitalization_needed BOOLEAN,
  outcome VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by UUID,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- State Callback Policy Integration (linking to existing takehome system)
CREATE TABLE IF NOT EXISTS state_callback_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  state_code VARCHAR(2) DEFAULT 'MI',
  policy_name VARCHAR(255) NOT NULL,
  policy_type VARCHAR(100), -- 'missed_dose', 'location_violation', 'time_violation', 'biometric_failure'
  violation_threshold INTEGER NOT NULL, -- how many violations trigger callback
  callback_window_days INTEGER NOT NULL, -- must be seen within X days
  mandatory BOOLEAN DEFAULT true,
  regulatory_citation TEXT,
  effective_date DATE NOT NULL,
  expiration_date DATE,
  is_active BOOLEAN DEFAULT true,
  auto_schedule_callback BOOLEAN DEFAULT true,
  notify_patient BOOLEAN DEFAULT true,
  notify_prescriber BOOLEAN DEFAULT true,
  require_uds BOOLEAN DEFAULT false,
  require_counseling BOOLEAN DEFAULT false,
  documentation_required TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS state_callback_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  organization_id UUID NOT NULL,
  policy_id UUID REFERENCES state_callback_policies(id),
  callback_reason VARCHAR(255) NOT NULL,
  violation_count INTEGER,
  violation_details JSONB,
  callback_required_date DATE NOT NULL,
  callback_scheduled_date DATE,
  callback_completed_date DATE,
  callback_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'scheduled', 'completed', 'missed', 'cancelled'
  counselor_id UUID,
  prescriber_id UUID,
  uds_completed BOOLEAN DEFAULT false,
  uds_result VARCHAR(50),
  counseling_completed BOOLEAN DEFAULT false,
  patient_response TEXT,
  action_taken VARCHAR(255),
  takehome_status_changed BOOLEAN DEFAULT false,
  new_takehome_level VARCHAR(50),
  submitted_to_state BOOLEAN DEFAULT false,
  state_submission_date TIMESTAMP WITH TIME ZONE,
  state_confirmation_number VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_mihin_submissions_org ON mihin_data_submissions(organization_id, submission_date);
CREATE INDEX idx_mihin_submissions_status ON mihin_data_submissions(submission_status);
CREATE INDEX idx_mihin_outcomes_patient ON mihin_workflow_outcomes(patient_id, measurement_date);
CREATE INDEX idx_988_referrals_patient ON crisis_988_referrals(patient_id, created_at);
CREATE INDEX idx_state_callbacks_patient ON state_callback_log(patient_id, callback_status);
CREATE INDEX idx_state_callbacks_due ON state_callback_log(callback_required_date) WHERE callback_status = 'pending';
