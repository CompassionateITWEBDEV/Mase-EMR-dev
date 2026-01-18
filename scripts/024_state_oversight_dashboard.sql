-- State Oversight Dashboard for Michigan MDHHS/MPHI
-- Monitor all clinics using MASE statewide

-- Clinic registry with licensing and accreditation
CREATE TABLE IF NOT EXISTS state_clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_name TEXT NOT NULL,
  license_number TEXT UNIQUE NOT NULL,
  facility_type TEXT NOT NULL, -- 'OTP', 'CCBHC', 'FQHC', 'County', 'Private'
  address TEXT,
  city TEXT,
  county TEXT NOT NULL,
  zip_code TEXT,
  phone TEXT,
  email TEXT,
  administrator_name TEXT,
  administrator_email TEXT,
  license_status TEXT NOT NULL DEFAULT 'active', -- 'active', 'probation', 'suspended'
  license_expiration DATE,
  dea_registration TEXT,
  dea_expiration DATE,
  samhsa_certified BOOLEAN DEFAULT false,
  carf_accredited BOOLEAN DEFAULT false,
  joint_commission_accredited BOOLEAN DEFAULT false,
  ccbhc_certified BOOLEAN DEFAULT false,
  recovery_friendly_certified BOOLEAN DEFAULT false,
  staff_count INTEGER DEFAULT 0,
  patient_capacity INTEGER,
  current_census INTEGER DEFAULT 0,
  mase_activation_date DATE,
  last_submission_date TIMESTAMP,
  compliance_score DECIMAL(5,2),
  quality_score DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Clinic surveillance submissions tracking
CREATE TABLE IF NOT EXISTS state_surveillance_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES state_clinics(id),
  submission_date TIMESTAMP NOT NULL,
  reporting_period TEXT NOT NULL, -- 'Q1-2024', 'December-2024', etc.
  submission_type TEXT NOT NULL, -- 'MiOFR', 'SUDORS', 'DOSE-SYS', 'MiPHY', 'Mi-SUTWA'
  overdose_deaths INTEGER DEFAULT 0,
  nonfatal_overdoses INTEGER DEFAULT 0,
  naloxone_distributed INTEGER DEFAULT 0,
  mat_enrollments INTEGER DEFAULT 0,
  treatment_episodes INTEGER DEFAULT 0,
  successful_completions INTEGER DEFAULT 0,
  submission_status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'late'
  days_late INTEGER DEFAULT 0,
  data_quality_score DECIMAL(5,2),
  validation_errors JSONB,
  submitted_by TEXT,
  approved_by TEXT,
  approved_at TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Workforce compliance tracking per clinic
CREATE TABLE IF NOT EXISTS state_workforce_compliance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES state_clinics(id),
  reporting_period TEXT NOT NULL,
  total_staff INTEGER DEFAULT 0,
  licensed_staff INTEGER DEFAULT 0,
  certified_staff INTEGER DEFAULT 0,
  peer_specialists INTEGER DEFAULT 0,
  mat_prescribers INTEGER DEFAULT 0,
  expired_licenses INTEGER DEFAULT 0,
  training_compliance_rate DECIMAL(5,2),
  background_check_compliance BOOLEAN DEFAULT false,
  credential_compliance_rate DECIMAL(5,2),
  turnover_rate DECIMAL(5,2),
  vacancy_rate DECIMAL(5,2),
  open_positions INTEGER DEFAULT 0,
  avg_hire_days INTEGER,
  recovery_friendly_score DECIMAL(5,2),
  workforce_gaps JSONB,
  submitted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Patient outcomes tracking per clinic
CREATE TABLE IF NOT EXISTS state_patient_outcomes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES state_clinics(id),
  reporting_period TEXT NOT NULL,
  total_patients INTEGER DEFAULT 0,
  new_admissions INTEGER DEFAULT 0,
  active_mat_patients INTEGER DEFAULT 0,
  retention_rate DECIMAL(5,2),
  completion_rate DECIMAL(5,2),
  overdose_events INTEGER DEFAULT 0,
  overdose_deaths INTEGER DEFAULT 0,
  naloxone_reversals INTEGER DEFAULT 0,
  ed_visits INTEGER DEFAULT 0,
  readmissions INTEGER DEFAULT 0,
  criminal_justice_involvement INTEGER DEFAULT 0,
  employment_outcomes INTEGER DEFAULT 0,
  housing_stability_rate DECIMAL(5,2),
  patient_satisfaction_score DECIMAL(5,2),
  outcomes_data JSONB,
  submitted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Quality metrics per clinic
CREATE TABLE IF NOT EXISTS state_quality_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES state_clinics(id),
  reporting_period TEXT NOT NULL,
  samhsa_compliance_rate DECIMAL(5,2),
  dea_compliance_rate DECIMAL(5,2),
  diversion_incidents INTEGER DEFAULT 0,
  medication_errors INTEGER DEFAULT 0,
  adverse_events INTEGER DEFAULT 0,
  patient_complaints INTEGER DEFAULT 0,
  staff_incidents INTEGER DEFAULT 0,
  infection_control_score DECIMAL(5,2),
  documentation_compliance DECIMAL(5,2),
  billing_accuracy DECIMAL(5,2),
  timely_reporting_rate DECIMAL(5,2),
  data_quality_score DECIMAL(5,2),
  overall_quality_score DECIMAL(5,2),
  deficiencies JSONB,
  corrective_actions JSONB,
  submitted_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- State alerts and interventions
CREATE TABLE IF NOT EXISTS state_clinic_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES state_clinics(id),
  alert_type TEXT NOT NULL, -- 'compliance', 'quality', 'surveillance', 'workforce'
  severity TEXT NOT NULL, -- 'low', 'medium', 'high', 'critical'
  alert_title TEXT NOT NULL,
  alert_description TEXT,
  triggered_date TIMESTAMP DEFAULT NOW(),
  status TEXT DEFAULT 'open', -- 'open', 'acknowledged', 'in_progress', 'resolved'
  assigned_to TEXT,
  resolution_notes TEXT,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_clinics_county ON state_clinics(county);
CREATE INDEX IF NOT EXISTS idx_clinics_type ON state_clinics(facility_type);
CREATE INDEX IF NOT EXISTS idx_submissions_clinic ON state_surveillance_submissions(clinic_id);
CREATE INDEX IF NOT EXISTS idx_submissions_type ON state_surveillance_submissions(submission_type);
CREATE INDEX IF NOT EXISTS idx_workforce_clinic ON state_workforce_compliance(clinic_id);
CREATE INDEX IF NOT EXISTS idx_outcomes_clinic ON state_patient_outcomes(clinic_id);
CREATE INDEX IF NOT EXISTS idx_quality_clinic ON state_quality_metrics(clinic_id);
CREATE INDEX IF NOT EXISTS idx_alerts_clinic ON state_clinic_alerts(clinic_id);
CREATE INDEX IF NOT EXISTS idx_alerts_status ON state_clinic_alerts(status);
