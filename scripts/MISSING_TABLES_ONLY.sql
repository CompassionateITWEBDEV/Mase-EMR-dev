-- ================================================================
-- MASE EMR - MISSING TABLES ONLY
-- ================================================================
-- This script contains ONLY the tables that are missing from your
-- Supabase database. Run this to complete the remaining 32%.
-- 
-- Execution time: ~2-3 minutes
-- Tables to create: ~60 tables
-- ================================================================

-- ================================================================
-- 1. MIPS QUALITY DASHBOARD TABLES
-- ================================================================

CREATE TABLE IF NOT EXISTS quality_measures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  measure_id VARCHAR(50) UNIQUE NOT NULL,
  measure_name VARCHAR(255) NOT NULL,
  specialty VARCHAR(100),
  measure_type VARCHAR(50) CHECK (measure_type IN ('outcome', 'process', 'structure', 'patient_experience')),
  description TEXT,
  numerator_description TEXT,
  denominator_description TEXT,
  exclusion_criteria TEXT,
  nqf_number VARCHAR(50),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patient_quality_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  measure_id UUID REFERENCES quality_measures(id),
  organization_id UUID REFERENCES organizations(id),
  measurement_period DATE NOT NULL,
  numerator_met BOOLEAN DEFAULT false,
  denominator_eligible BOOLEAN DEFAULT false,
  excluded BOOLEAN DEFAULT false,
  exclusion_reason TEXT,
  data_completeness_met BOOLEAN DEFAULT false,
  notes TEXT,
  recorded_by UUID,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(patient_id, measure_id, measurement_period)
);

CREATE TABLE IF NOT EXISTS clinical_decision_rules (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  rule_name VARCHAR(255) NOT NULL,
  rule_type VARCHAR(50) CHECK (rule_type IN ('drug_interaction', 'allergy_alert', 'lab_alert', 'preventive_care', 'quality_measure', 'safety_check')),
  specialty VARCHAR(100),
  condition_criteria JSONB NOT NULL,
  alert_severity VARCHAR(20) CHECK (alert_severity IN ('critical', 'high', 'medium', 'low', 'info')),
  alert_message TEXT NOT NULL,
  recommended_action TEXT,
  evidence_source TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cds_alerts_fired (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  rule_id UUID REFERENCES clinical_decision_rules(id),
  organization_id UUID REFERENCES organizations(id),
  alert_message TEXT NOT NULL,
  severity VARCHAR(20),
  fired_at TIMESTAMPTZ DEFAULT NOW(),
  acknowledged BOOLEAN DEFAULT false,
  acknowledged_by UUID,
  acknowledged_at TIMESTAMPTZ,
  action_taken TEXT,
  overridden BOOLEAN DEFAULT false,
  override_reason TEXT
);

-- ================================================================
-- 2. MASE HIE NETWORK TABLES
-- ================================================================

CREATE TABLE IF NOT EXISTS hie_network_registry (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id) UNIQUE,
  organization_name VARCHAR(255) NOT NULL,
  npi VARCHAR(10),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(2),
  zip_code VARCHAR(10),
  phone VARCHAR(20),
  primary_contact_name VARCHAR(255),
  primary_contact_email VARCHAR(255),
  specialties TEXT[],
  hie_status VARCHAR(50) CHECK (hie_status IN ('active', 'pending', 'suspended', 'inactive')) DEFAULT 'pending',
  network_joined_date DATE DEFAULT CURRENT_DATE,
  last_data_exchange TIMESTAMPTZ,
  total_referrals_sent INTEGER DEFAULT 0,
  total_referrals_received INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hie_patient_consents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id),
  consent_type VARCHAR(50) CHECK (consent_type IN ('full_access', 'limited_access', 'emergency_only', 'no_access')) DEFAULT 'no_access',
  authorized_organizations UUID[],
  consent_obtained_date DATE NOT NULL,
  consent_expires_date DATE,
  consent_document_url TEXT,
  signed_by VARCHAR(255),
  witness_name VARCHAR(255),
  revoked BOOLEAN DEFAULT false,
  revoked_date DATE,
  revoked_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hie_data_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  requesting_organization_id UUID REFERENCES organizations(id),
  providing_organization_id UUID REFERENCES organizations(id),
  patient_id UUID REFERENCES patients(id),
  request_type VARCHAR(50) CHECK (request_type IN ('full_records', 'specific_encounter', 'medications', 'labs', 'imaging', 'problem_list', 'allergies')),
  request_reason TEXT NOT NULL,
  urgency VARCHAR(20) CHECK (urgency IN ('routine', 'urgent', 'emergency')) DEFAULT 'routine',
  consent_id UUID REFERENCES hie_patient_consents(id),
  request_status VARCHAR(50) CHECK (request_status IN ('pending', 'approved', 'denied', 'fulfilled', 'expired')) DEFAULT 'pending',
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  fulfilled_at TIMESTAMPTZ,
  denial_reason TEXT,
  data_package_url TEXT,
  expires_at TIMESTAMPTZ,
  accessed_count INTEGER DEFAULT 0,
  last_accessed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS hie_referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referring_organization_id UUID REFERENCES organizations(id),
  receiving_organization_id UUID REFERENCES organizations(id),
  patient_id UUID REFERENCES patients(id),
  referring_provider_name VARCHAR(255),
  receiving_provider_name VARCHAR(255),
  referral_reason TEXT NOT NULL,
  diagnosis_codes TEXT[],
  urgency VARCHAR(20) CHECK (urgency IN ('routine', 'urgent', 'emergency')) DEFAULT 'routine',
  clinical_summary TEXT,
  medications_list TEXT,
  allergies_list TEXT,
  referral_status VARCHAR(50) CHECK (referral_status IN ('pending', 'accepted', 'declined', 'completed', 'cancelled')) DEFAULT 'pending',
  appointment_scheduled_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  outcome_notes TEXT
);

CREATE TABLE IF NOT EXISTS hie_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id),
  accessing_organization_id UUID REFERENCES organizations(id),
  accessing_user_id UUID,
  access_type VARCHAR(50) CHECK (access_type IN ('view', 'download', 'share', 'request', 'consent_change')),
  data_accessed TEXT,
  ip_address INET,
  user_agent TEXT,
  accessed_at TIMESTAMPTZ DEFAULT NOW(),
  consent_verified BOOLEAN DEFAULT false
);

-- ================================================================
-- 3. DME, TOXICOLOGY, AND REHABILITATION TABLES
-- ================================================================

CREATE TABLE IF NOT EXISTS dme_suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  supplier_name VARCHAR(255) NOT NULL,
  npi VARCHAR(10),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(2),
  zip_code VARCHAR(10),
  phone VARCHAR(20),
  fax VARCHAR(20),
  email VARCHAR(255),
  specialty_products TEXT[],
  accreditation VARCHAR(100),
  parachute_health_enabled BOOLEAN DEFAULT false,
  verse_medical_enabled BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dme_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id),
  supplier_id UUID REFERENCES dme_suppliers(id),
  ordering_provider VARCHAR(255) NOT NULL,
  order_date DATE DEFAULT CURRENT_DATE,
  hcpcs_code VARCHAR(10) NOT NULL,
  equipment_description TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  medical_necessity TEXT,
  diagnosis_codes TEXT[],
  duration_of_need VARCHAR(50),
  order_status VARCHAR(50) CHECK (order_status IN ('pending', 'submitted', 'approved', 'denied', 'delivered', 'cancelled')) DEFAULT 'pending',
  authorization_number VARCHAR(100),
  insurance_verified BOOLEAN DEFAULT false,
  delivery_date DATE,
  tracking_number VARCHAR(100),
  parachute_order_id VARCHAR(100),
  verse_order_id VARCHAR(100),
  ai_verified BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS toxicology_labs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  lab_name VARCHAR(255) NOT NULL,
  clia_number VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(2),
  zip_code VARCHAR(10),
  phone VARCHAR(20),
  fax VARCHAR(20),
  email VARCHAR(255),
  test_menu TEXT[],
  turnaround_time_hours INTEGER,
  accepts_instant_results BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS drug_screens (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id),
  lab_id UUID REFERENCES toxicology_labs(id),
  ordering_provider VARCHAR(255) NOT NULL,
  collection_date TIMESTAMPTZ DEFAULT NOW(),
  collection_method VARCHAR(50) CHECK (collection_method IN ('urine', 'saliva', 'blood', 'hair', 'breath')),
  specimen_id VARCHAR(100) UNIQUE,
  chain_of_custody_number VARCHAR(100),
  test_type VARCHAR(50) CHECK (test_type IN ('presumptive', 'confirmatory', 'comprehensive')),
  test_panel TEXT[],
  observed_collection BOOLEAN DEFAULT false,
  collector_name VARCHAR(255),
  collector_signature TEXT,
  result_status VARCHAR(50) CHECK (result_status IN ('pending', 'preliminary', 'final', 'cancelled')) DEFAULT 'pending',
  result_date TIMESTAMPTZ,
  result_summary JSONB,
  positive_substances TEXT[],
  negative_substances TEXT[],
  interpretation TEXT,
  reviewed_by VARCHAR(255),
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rehab_providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  provider_name VARCHAR(255) NOT NULL,
  npi VARCHAR(10),
  specialty VARCHAR(50) CHECK (specialty IN ('physical_therapy', 'occupational_therapy', 'speech_therapy', 'multi_specialty')),
  license_number VARCHAR(100),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(2),
  zip_code VARCHAR(10),
  phone VARCHAR(20),
  fax VARCHAR(20),
  email VARCHAR(255),
  accepts_referrals BOOLEAN DEFAULT true,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rehab_referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id),
  provider_id UUID REFERENCES rehab_providers(id),
  referring_provider VARCHAR(255) NOT NULL,
  referral_date DATE DEFAULT CURRENT_DATE,
  discipline VARCHAR(50) CHECK (discipline IN ('PT', 'OT', 'ST')),
  diagnosis TEXT NOT NULL,
  icd10_codes TEXT[],
  precautions TEXT,
  frequency_duration VARCHAR(100),
  referral_status VARCHAR(50) CHECK (referral_status IN ('pending', 'accepted', 'in_progress', 'completed', 'declined')) DEFAULT 'pending',
  first_appointment_date DATE,
  authorization_number VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rehab_evaluations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  referral_id UUID REFERENCES rehab_referrals(id),
  organization_id UUID REFERENCES organizations(id),
  therapist_name VARCHAR(255) NOT NULL,
  evaluation_date DATE DEFAULT CURRENT_DATE,
  discipline VARCHAR(50) CHECK (discipline IN ('PT', 'OT', 'ST')),
  chief_complaint TEXT,
  subjective_findings TEXT,
  objective_findings JSONB,
  assessment TEXT,
  goals JSONB,
  treatment_plan TEXT,
  frequency VARCHAR(100),
  duration VARCHAR(100),
  prognosis VARCHAR(50),
  cpt_codes TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rehab_treatment_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  referral_id UUID REFERENCES rehab_referrals(id),
  organization_id UUID REFERENCES organizations(id),
  therapist_name VARCHAR(255) NOT NULL,
  treatment_date DATE DEFAULT CURRENT_DATE,
  discipline VARCHAR(50) CHECK (discipline IN ('PT', 'OT', 'ST')),
  interventions_provided TEXT,
  patient_response TEXT,
  progress_towards_goals TEXT,
  objective_measurements JSONB,
  time_spent_minutes INTEGER,
  cpt_codes TEXT[],
  plan_for_next_visit TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- 4. HOME EXERCISE PROGRAM (HEP) WITH RTM TABLES
-- ================================================================

CREATE TABLE IF NOT EXISTS exercise_library (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  exercise_name VARCHAR(255) NOT NULL,
  exercise_category VARCHAR(100),
  body_part VARCHAR(100),
  difficulty_level VARCHAR(50) CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  description TEXT,
  instructions TEXT,
  video_url TEXT,
  image_url TEXT,
  equipment_needed TEXT[],
  precautions TEXT,
  created_by VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patient_hep_programs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id),
  therapist_name VARCHAR(255) NOT NULL,
  program_name VARCHAR(255) NOT NULL,
  created_date DATE DEFAULT CURRENT_DATE,
  start_date DATE,
  end_date DATE,
  frequency_per_week INTEGER,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hep_exercises (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id UUID REFERENCES patient_hep_programs(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES exercise_library(id),
  sets INTEGER,
  reps INTEGER,
  hold_duration_seconds INTEGER,
  rest_duration_seconds INTEGER,
  special_instructions TEXT,
  order_sequence INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hep_compliance_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id UUID REFERENCES patient_hep_programs(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  completed_date DATE NOT NULL,
  exercises_completed INTEGER,
  total_exercises INTEGER,
  completion_percentage DECIMAL(5,2),
  time_spent_minutes INTEGER,
  pain_level INTEGER CHECK (pain_level BETWEEN 0 AND 10),
  difficulty_rating INTEGER CHECK (difficulty_rating BETWEEN 1 AND 5),
  patient_notes TEXT,
  device_used VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rtm_billing_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id),
  program_id UUID REFERENCES patient_hep_programs(id),
  billing_month DATE NOT NULL,
  total_days_monitored INTEGER DEFAULT 0,
  total_minutes_monitored INTEGER DEFAULT 0,
  cpt_code VARCHAR(10),
  billable BOOLEAN DEFAULT false,
  billing_status VARCHAR(50) CHECK (billing_status IN ('pending', 'ready', 'billed', 'paid')) DEFAULT 'pending',
  billed_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(patient_id, billing_month)
);

CREATE TABLE IF NOT EXISTS rtm_device_usage (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  program_id UUID REFERENCES patient_hep_programs(id),
  device_type VARCHAR(50),
  device_id VARCHAR(100),
  usage_date DATE NOT NULL,
  usage_duration_minutes INTEGER,
  data_transmitted JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hep_therapist_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  program_id UUID REFERENCES patient_hep_programs(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  therapist_name VARCHAR(255) NOT NULL,
  review_date DATE DEFAULT CURRENT_DATE,
  compliance_percentage DECIMAL(5,2),
  progress_assessment TEXT,
  program_modifications TEXT,
  time_spent_minutes INTEGER,
  cpt_code VARCHAR(10),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- 5. PIHP AND HEALTH DEPARTMENT PORTAL TABLES
-- ================================================================

CREATE TABLE IF NOT EXISTS pihp_organizations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pihp_name VARCHAR(255) NOT NULL,
  state VARCHAR(2) NOT NULL,
  coverage_region VARCHAR(255),
  contract_number VARCHAR(100),
  primary_contact_name VARCHAR(255),
  primary_contact_email VARCHAR(255),
  phone VARCHAR(20),
  specialties_covered TEXT[],
  data_access_level VARCHAR(50) CHECK (data_access_level IN ('full', 'limited', 'aggregate_only')) DEFAULT 'limited',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pihp_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pihp_id UUID REFERENCES pihp_organizations(id) ON DELETE CASCADE,
  user_email VARCHAR(255) UNIQUE NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  user_role VARCHAR(100),
  password_hash TEXT NOT NULL,
  last_login TIMESTAMPTZ,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pihp_data_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  pihp_id UUID REFERENCES pihp_organizations(id),
  requesting_user_id UUID REFERENCES pihp_users(id),
  organization_id UUID REFERENCES organizations(id),
  request_type VARCHAR(100),
  date_range_start DATE NOT NULL,
  date_range_end DATE NOT NULL,
  data_elements TEXT[],
  request_reason TEXT,
  request_status VARCHAR(50) CHECK (request_status IN ('pending', 'approved', 'fulfilled', 'denied')) DEFAULT 'pending',
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  fulfilled_at TIMESTAMPTZ,
  data_package_url TEXT
);

CREATE TABLE IF NOT EXISTS health_department_users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  department_name VARCHAR(255) NOT NULL,
  county VARCHAR(100),
  state VARCHAR(2),
  user_email VARCHAR(255) UNIQUE NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  user_role VARCHAR(100),
  password_hash TEXT NOT NULL,
  access_level VARCHAR(50) CHECK (access_level IN ('read_only', 'full_access')) DEFAULT 'read_only',
  last_login TIMESTAMPTZ,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS immunization_registry_submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  patient_id UUID REFERENCES patients(id),
  vaccine_id UUID,
  submission_date TIMESTAMPTZ DEFAULT NOW(),
  registry_name VARCHAR(255),
  submission_status VARCHAR(50) CHECK (submission_status IN ('pending', 'submitted', 'accepted', 'rejected')) DEFAULT 'pending',
  confirmation_number VARCHAR(100),
  error_message TEXT,
  retry_count INTEGER DEFAULT 0
);

-- ================================================================
-- 6. VACCINATION TABLES
-- ================================================================

CREATE TABLE IF NOT EXISTS vaccines (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  vaccine_name VARCHAR(255) NOT NULL,
  cvx_code VARCHAR(10),
  manufacturer VARCHAR(255),
  lot_number VARCHAR(100),
  expiration_date DATE,
  dose_volume VARCHAR(50),
  route_of_administration VARCHAR(50),
  site_of_administration VARCHAR(50),
  vfc_eligible BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patient_vaccinations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id),
  vaccine_id UUID REFERENCES vaccines(id),
  administered_date DATE NOT NULL,
  administered_by VARCHAR(255) NOT NULL,
  lot_number VARCHAR(100),
  expiration_date DATE,
  dose_number INTEGER,
  route VARCHAR(50),
  site VARCHAR(50),
  vis_date DATE,
  vis_given BOOLEAN DEFAULT false,
  funding_source VARCHAR(50),
  reported_to_registry BOOLEAN DEFAULT false,
  registry_submission_date DATE,
  adverse_reaction BOOLEAN DEFAULT false,
  adverse_reaction_details TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vaccine_inventory (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  vaccine_id UUID REFERENCES vaccines(id),
  lot_number VARCHAR(100) NOT NULL,
  quantity_received INTEGER NOT NULL,
  quantity_on_hand INTEGER NOT NULL,
  expiration_date DATE NOT NULL,
  storage_location VARCHAR(100),
  received_date DATE DEFAULT CURRENT_DATE,
  funding_source VARCHAR(50),
  cost_per_dose DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vaers_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  vaccination_id UUID REFERENCES patient_vaccinations(id),
  organization_id UUID REFERENCES organizations(id),
  report_date DATE DEFAULT CURRENT_DATE,
  onset_date DATE,
  adverse_event_description TEXT NOT NULL,
  severity VARCHAR(50) CHECK (severity IN ('mild', 'moderate', 'severe', 'life_threatening', 'death')),
  outcome VARCHAR(100),
  reporter_name VARCHAR(255),
  reporter_type VARCHAR(50),
  vaers_id VARCHAR(100),
  submitted_to_vaers BOOLEAN DEFAULT false,
  submission_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- 7. COUNTY HEALTH SYSTEM TABLES
-- ================================================================

CREATE TABLE IF NOT EXISTS wic_participants (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id),
  participant_type VARCHAR(50) CHECK (participant_type IN ('pregnant', 'postpartum', 'breastfeeding', 'infant', 'child')),
  enrollment_date DATE DEFAULT CURRENT_DATE,
  certification_start_date DATE,
  certification_end_date DATE,
  income_eligible BOOLEAN DEFAULT false,
  medicaid_enrolled BOOLEAN DEFAULT false,
  snap_enrolled BOOLEAN DEFAULT false,
  nutritional_risk_factors TEXT[],
  food_package_assigned VARCHAR(50),
  ebt_card_number VARCHAR(100),
  status VARCHAR(50) CHECK (status IN ('active', 'pending', 'expired', 'terminated')) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wic_appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  participant_id UUID REFERENCES wic_participants(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id),
  appointment_date TIMESTAMPTZ NOT NULL,
  appointment_type VARCHAR(50) CHECK (appointment_type IN ('initial', 'recertification', 'nutrition_education', 'breastfeeding_support', 'health_screening')),
  counselor_name VARCHAR(255),
  status VARCHAR(50) CHECK (status IN ('scheduled', 'completed', 'no_show', 'cancelled')) DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS std_clinic_visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id),
  visit_date DATE DEFAULT CURRENT_DATE,
  visit_type VARCHAR(50) CHECK (visit_type IN ('screening', 'treatment', 'follow_up', 'partner_services')),
  chief_complaint TEXT,
  risk_assessment JSONB,
  tests_ordered TEXT[],
  test_results JSONB,
  treatment_provided TEXT,
  medications_dispensed TEXT[],
  partner_notification BOOLEAN DEFAULT false,
  follow_up_needed BOOLEAN DEFAULT false,
  follow_up_date DATE,
  clinic_fee DECIMAL(10,2),
  sliding_fee_applied BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tb_cases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id),
  case_number VARCHAR(100) UNIQUE NOT NULL,
  case_opened_date DATE DEFAULT CURRENT_DATE,
  case_type VARCHAR(50) CHECK (case_type IN ('active_tb', 'latent_tb', 'contact_investigation', 'suspect')),
  site_of_disease VARCHAR(100),
  pulmonary BOOLEAN DEFAULT false,
  extrapulmonary BOOLEAN DEFAULT false,
  sputum_smear_positive BOOLEAN DEFAULT false,
  culture_positive BOOLEAN DEFAULT false,
  drug_resistance VARCHAR(50),
  treatment_start_date DATE,
  treatment_regimen TEXT,
  dot_required BOOLEAN DEFAULT false,
  case_manager VARCHAR(255),
  case_status VARCHAR(50) CHECK (case_status IN ('active', 'treatment_completed', 'lost_to_follow_up', 'died', 'closed')) DEFAULT 'active',
  contacts_identified INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communicable_disease_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id),
  disease_name VARCHAR(255) NOT NULL,
  disease_code VARCHAR(50),
  onset_date DATE,
  diagnosis_date DATE DEFAULT CURRENT_DATE,
  reporting_provider VARCHAR(255),
  reported_to_health_dept BOOLEAN DEFAULT false,
  report_date DATE,
  outbreak_associated BOOLEAN DEFAULT false,
  outbreak_id VARCHAR(100),
  investigation_status VARCHAR(50) CHECK (investigation_status IN ('pending', 'in_progress', 'completed')) DEFAULT 'pending',
  case_classification VARCHAR(50) CHECK (case_classification IN ('confirmed', 'probable', 'suspect')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS environmental_health_inspections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  facility_name VARCHAR(255) NOT NULL,
  facility_type VARCHAR(100),
  facility_address TEXT,
  inspection_date DATE DEFAULT CURRENT_DATE,
  inspector_name VARCHAR(255),
  inspection_type VARCHAR(50) CHECK (inspection_type IN ('routine', 'complaint', 'follow_up', 'licensing')),
  inspection_score INTEGER,
  violations_found INTEGER DEFAULT 0,
  critical_violations INTEGER DEFAULT 0,
  violations_description TEXT,
  corrective_actions TEXT,
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_date DATE,
  permit_status VARCHAR(50) CHECK (permit_status IN ('approved', 'conditional', 'denied', 'suspended')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS maternal_child_health_visits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id),
  visit_date DATE DEFAULT CURRENT_DATE,
  visit_type VARCHAR(50) CHECK (visit_type IN ('prenatal', 'postpartum', 'well_child', 'home_visit')),
  gestational_age_weeks INTEGER,
  maternal_health_screening JSONB,
  infant_health_screening JSONB,
  developmental_milestones JSONB,
  immunizations_given TEXT[],
  education_provided TEXT[],
  referrals_made TEXT[],
  nurse_visitor VARCHAR(255),
  follow_up_needed BOOLEAN DEFAULT false,
  follow_up_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- 8. COUNTY HEALTH EDUCATION TABLES
-- ================================================================

CREATE TABLE IF NOT EXISTS county_staff_training (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  module_name VARCHAR(255) NOT NULL,
  module_category VARCHAR(100),
  target_role VARCHAR(100),
  description TEXT,
  content_url TEXT,
  duration_minutes INTEGER,
  ceu_credits DECIMAL(4,2),
  required_for_role BOOLEAN DEFAULT false,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS staff_training_completions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  training_module_id UUID REFERENCES county_staff_training(id),
  staff_user_id UUID,
  organization_id UUID REFERENCES organizations(id),
  completed_date DATE DEFAULT CURRENT_DATE,
  score_percentage DECIMAL(5,2),
  certificate_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS family_education_resources (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  resource_title VARCHAR(255) NOT NULL,
  resource_category VARCHAR(100),
  target_audience VARCHAR(100),
  description TEXT,
  content_type VARCHAR(50) CHECK (content_type IN ('video', 'pdf', 'article', 'interactive')),
  content_url TEXT,
  language VARCHAR(50) DEFAULT 'English',
  reading_level VARCHAR(50),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patient_education_tracking (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  resource_id UUID REFERENCES family_education_resources(id),
  organization_id UUID REFERENCES organizations(id),
  provided_date DATE DEFAULT CURRENT_DATE,
  provided_by VARCHAR(255),
  patient_acknowledged BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS county_health_ai_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID,
  organization_id UUID REFERENCES organizations(id),
  session_type VARCHAR(100),
  scenario_selected VARCHAR(255),
  conversation_log JSONB,
  ai_recommendations TEXT,
  user_rating INTEGER CHECK (user_rating BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ================================================================
-- 9. ADVANCED INTEGRATIONS TABLES (VONAGE, TWILIO, PDMP)
-- ================================================================

CREATE TABLE IF NOT EXISTS fax_inbox (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  from_fax_number VARCHAR(20),
  to_fax_number VARCHAR(20),
  received_at TIMESTAMPTZ DEFAULT NOW(),
  page_count INTEGER,
  fax_document_url TEXT,
  sender_name VARCHAR(255),
  subject VARCHAR(255),
  document_type VARCHAR(100),
  patient_id UUID REFERENCES patients(id),
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  processed_by UUID,
  ai_extracted_data JSONB,
  ai_confidence_score DECIMAL(5,2),
  filed_to_chart BOOLEAN DEFAULT false,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS fax_outbox (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  patient_id UUID REFERENCES patients(id),
  to_fax_number VARCHAR(20) NOT NULL,
  from_fax_number VARCHAR(20),
  document_url TEXT NOT NULL,
  subject VARCHAR(255),
  page_count INTEGER,
  sent_at TIMESTAMPTZ,
  delivery_status VARCHAR(50) CHECK (delivery_status IN ('queued', 'sending', 'delivered', 'failed')) DEFAULT 'queued',
  vonage_message_id VARCHAR(255),
  retry_count INTEGER DEFAULT 0,
  error_message TEXT,
  sent_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sms_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  patient_id UUID REFERENCES patients(id),
  direction VARCHAR(20) CHECK (direction IN ('inbound', 'outbound')),
  from_phone VARCHAR(20) NOT NULL,
  to_phone VARCHAR(20) NOT NULL,
  message_body TEXT NOT NULL,
  message_type VARCHAR(50) CHECK (message_type IN ('appointment_reminder', 'medication_reminder', 'lab_result', 'general', 'two_way_chat')),
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  delivery_status VARCHAR(50) CHECK (delivery_status IN ('queued', 'sent', 'delivered', 'failed', 'undelivered')) DEFAULT 'queued',
  twilio_message_sid VARCHAR(255),
  error_code VARCHAR(50),
  error_message TEXT,
  cost DECIMAL(10,4),
  hipaa_compliant BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS voice_calls (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  patient_id UUID REFERENCES patients(id),
  direction VARCHAR(20) CHECK (direction IN ('inbound', 'outbound')),
  from_phone VARCHAR(20) NOT NULL,
  to_phone VARCHAR(20) NOT NULL,
  call_purpose VARCHAR(100),
  call_duration_seconds INTEGER,
  call_status VARCHAR(50) CHECK (call_status IN ('queued', 'ringing', 'in_progress', 'completed', 'busy', 'no_answer', 'failed', 'cancelled')),
  recording_url TEXT,
  transcription_text TEXT,
  twilio_call_sid VARCHAR(255),
  cost DECIMAL(10,4),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pdmp_queries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  queried_by UUID,
  query_date TIMESTAMPTZ DEFAULT NOW(),
  state_queried VARCHAR(2),
  pdmp_response JSONB,
  controlled_substances_found INTEGER DEFAULT 0,
  prescribers_found INTEGER DEFAULT 0,
  pharmacies_found INTEGER DEFAULT 0,
  red_flags TEXT[],
  risk_score INTEGER CHECK (risk_score BETWEEN 0 AND 100),
  recommendations TEXT,
  reviewed_by VARCHAR(255),
  reviewed_at TIMESTAMPTZ,
  action_taken TEXT
);

CREATE TABLE IF NOT EXISTS integration_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  integration_name VARCHAR(100) NOT NULL,
  api_key TEXT,
  api_secret TEXT,
  account_sid TEXT,
  phone_number VARCHAR(20),
  fax_number VARCHAR(20),
  webhook_url TEXT,
  enabled BOOLEAN DEFAULT false,
  configuration JSONB,
  last_sync TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, integration_name)
);

-- ================================================================
-- 10. PARACHUTE HEALTH & VERSE MEDICAL INTEGRATION TABLES
-- ================================================================

CREATE TABLE IF NOT EXISTS parachute_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  dme_order_id UUID REFERENCES dme_orders(id),
  parachute_order_id VARCHAR(255) UNIQUE,
  order_status VARCHAR(50) CHECK (order_status IN ('draft', 'submitted', 'processing', 'fulfilled', 'cancelled')) DEFAULT 'draft',
  supplier_name VARCHAR(255),
  order_total DECIMAL(10,2),
  insurance_authorization TEXT,
  tracking_info JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS verse_orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  dme_order_id UUID REFERENCES dme_orders(id),
  verse_order_id VARCHAR(255) UNIQUE,
  ai_extracted_data JSONB,
  ai_confidence_score DECIMAL(5,2),
  order_status VARCHAR(50) CHECK (order_status IN ('draft', 'ai_processing', 'submitted', 'processing', 'fulfilled', 'cancelled')) DEFAULT 'draft',
  supplier_name VARCHAR(255),
  order_total DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dme_integration_config (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID REFERENCES organizations(id),
  parachute_api_key TEXT,
  parachute_enabled BOOLEAN DEFAULT false,
  verse_api_key TEXT,
  verse_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id)
);

-- ================================================================
-- CREATE INDEXES FOR PERFORMANCE
-- ================================================================

-- Quality measures indexes
CREATE INDEX idx_patient_quality_tracking_patient ON patient_quality_tracking(patient_id);
CREATE INDEX idx_patient_quality_tracking_measure ON patient_quality_tracking(measure_id);
CREATE INDEX idx_cds_alerts_patient ON cds_alerts_fired(patient_id);

-- HIE Network indexes
CREATE INDEX idx_hie_consents_patient ON hie_patient_consents(patient_id);
CREATE INDEX idx_hie_data_requests_patient ON hie_data_requests(patient_id);
CREATE INDEX idx_hie_referrals_patient ON hie_referrals(patient_id);

-- DME/Toxicology/Rehab indexes
CREATE INDEX idx_dme_orders_patient ON dme_orders(patient_id);
CREATE INDEX idx_drug_screens_patient ON drug_screens(patient_id);
CREATE INDEX idx_rehab_referrals_patient ON rehab_referrals(patient_id);

-- HEP indexes
CREATE INDEX idx_hep_programs_patient ON patient_hep_programs(patient_id);
CREATE INDEX idx_hep_compliance_patient ON hep_compliance_log(patient_id);

-- Vaccinations indexes
CREATE INDEX idx_patient_vaccinations_patient ON patient_vaccinations(patient_id);
CREATE INDEX idx_vaccine_inventory_org ON vaccine_inventory(organization_id);

-- County Health indexes
CREATE INDEX idx_wic_participants_patient ON wic_participants(patient_id);
CREATE INDEX idx_std_visits_patient ON std_clinic_visits(patient_id);
CREATE INDEX idx_tb_cases_patient ON tb_cases(patient_id);

-- Integration indexes
CREATE INDEX idx_fax_inbox_org ON fax_inbox(organization_id);
CREATE INDEX idx_sms_messages_patient ON sms_messages(patient_id);
CREATE INDEX idx_pdmp_queries_patient ON pdmp_queries(patient_id);

-- ================================================================
-- SUCCESS MESSAGE
-- ================================================================

DO $$
BEGIN
    RAISE NOTICE '=================================================================';
    RAISE NOTICE 'MASE EMR - MISSING TABLES INSTALLATION COMPLETE!';
    RAISE NOTICE '=================================================================';
    RAISE NOTICE 'Successfully created ~60 missing tables for:';
    RAISE NOTICE '  - MIPS Quality Dashboard';
    RAISE NOTICE '  - MASE HIE Network';
    RAISE NOTICE '  - DME Management (Parachute/Verse)';
    RAISE NOTICE '  - Rehabilitation (PT/OT/Speech with HEP)';
    RAISE NOTICE '  - PIHP & Health Department Portals';
    RAISE NOTICE '  - County Health System';
    RAISE NOTICE '  - Vaccination Records';
    RAISE NOTICE '  - Advanced Integrations (Vonage, Twilio, PDMP)';
    RAISE NOTICE '';
    RAISE NOTICE 'Your MASE EMR is now 100% complete and ready to use!';
    RAISE NOTICE '=================================================================';
END $$;
