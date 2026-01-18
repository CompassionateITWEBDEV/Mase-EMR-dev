-- MASE EMR - County Health System Module
-- For counties like Oakland County Health Department serving public health needs

-- County Health Organizations
CREATE TABLE IF NOT EXISTS county_health_departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  county_name VARCHAR(255) NOT NULL,
  state VARCHAR(2) NOT NULL,
  department_name VARCHAR(500) NOT NULL,
  organization_id UUID REFERENCES organizations(id),
  population_served BIGINT,
  service_areas JSONB, -- Cities, townships covered
  contact_info JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- WIC Program Management
CREATE TABLE IF NOT EXISTS wic_participants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id),
  county_dept_id UUID REFERENCES county_health_departments(id),
  participant_type VARCHAR(50), -- pregnant, postpartum, breastfeeding, infant, child
  enrollment_date DATE NOT NULL,
  certification_date DATE,
  certification_expires DATE,
  income_verified BOOLEAN DEFAULT FALSE,
  medicaid_enrolled BOOLEAN DEFAULT FALSE,
  snap_enrolled BOOLEAN DEFAULT FALSE,
  risk_factors JSONB,
  benefits_issued JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wic_appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  participant_id UUID REFERENCES wic_participants(id),
  appointment_date TIMESTAMPTZ NOT NULL,
  appointment_type VARCHAR(100), -- certification, nutrition_counseling, breastfeeding_support
  counselor_id UUID REFERENCES providers(id),
  height_cm DECIMAL(5,2),
  weight_kg DECIMAL(5,2),
  hemoglobin_level DECIMAL(4,2),
  blood_pressure VARCHAR(20),
  nutrition_assessment JSONB,
  education_provided TEXT[],
  follow_up_needed BOOLEAN DEFAULT FALSE,
  status VARCHAR(50) DEFAULT 'scheduled',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Immunization Clinic Management
CREATE TABLE IF NOT EXISTS immunization_clinics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  county_dept_id UUID REFERENCES county_health_departments(id),
  clinic_name VARCHAR(255),
  location_name VARCHAR(255),
  address TEXT,
  clinic_type VARCHAR(100), -- walk_in, appointment, outreach
  operating_hours JSONB,
  services_offered TEXT[],
  insurance_accepted TEXT[], -- Medicaid, Medicare, BCBS, cash
  sliding_fee_available BOOLEAN DEFAULT TRUE,
  administration_fee DECIMAL(8,2), -- $7 per vaccine
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- STD/STI Clinic Services
CREATE TABLE IF NOT EXISTS std_clinic_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id),
  county_dept_id UUID REFERENCES county_health_departments(id),
  visit_date TIMESTAMPTZ NOT NULL,
  visit_type VARCHAR(100), -- screening, treatment, follow_up, partner_services
  services_provided TEXT[], -- HIV_test, syphilis_test, gonorrhea_test, chlamydia_test, treatment
  risk_assessment JSONB,
  test_results JSONB,
  treatment_provided JSONB,
  partner_notification_needed BOOLEAN DEFAULT FALSE,
  prep_prescribed BOOLEAN DEFAULT FALSE,
  nPEP_prescribed BOOLEAN DEFAULT FALSE,
  follow_up_date DATE,
  clinic_fee DECIMAL(8,2), -- $5 clinic visit fee
  sliding_fee_applied BOOLEAN DEFAULT FALSE,
  provider_id UUID REFERENCES providers(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Maternal & Child Health Programs
CREATE TABLE IF NOT EXISTS mch_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id),
  county_dept_id UUID REFERENCES county_health_departments(id),
  program_type VARCHAR(100), -- prenatal, well_child, home_visiting, family_planning
  enrollment_date DATE NOT NULL,
  case_manager_id UUID REFERENCES providers(id),
  risk_level VARCHAR(50), -- low, medium, high
  home_visits_scheduled INTEGER DEFAULT 0,
  home_visits_completed INTEGER DEFAULT 0,
  developmental_screenings JSONB,
  health_education_topics TEXT[],
  referrals_made JSONB,
  program_status VARCHAR(50) DEFAULT 'active',
  graduation_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Communicable Disease Tracking
CREATE TABLE IF NOT EXISTS communicable_disease_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id),
  county_dept_id UUID REFERENCES county_health_departments(id),
  disease_name VARCHAR(255) NOT NULL,
  disease_code VARCHAR(50), -- ICD-10 code
  report_date DATE NOT NULL,
  onset_date DATE,
  diagnosis_date DATE,
  reporting_source VARCHAR(100), -- lab, provider, hospital
  case_status VARCHAR(50), -- suspected, probable, confirmed
  outbreak_associated BOOLEAN DEFAULT FALSE,
  outbreak_id UUID,
  investigation_status VARCHAR(50),
  investigator_id UUID REFERENCES providers(id),
  contact_tracing_completed BOOLEAN DEFAULT FALSE,
  isolation_required BOOLEAN DEFAULT FALSE,
  isolation_start_date DATE,
  isolation_end_date DATE,
  reported_to_state BOOLEAN DEFAULT FALSE,
  state_report_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- TB (Tuberculosis) Management
CREATE TABLE IF NOT EXISTS tb_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id),
  county_dept_id UUID REFERENCES county_health_departments(id),
  case_number VARCHAR(100) UNIQUE NOT NULL,
  case_type VARCHAR(50), -- latent, active, extrapulmonary
  diagnosis_date DATE NOT NULL,
  treatment_start_date DATE,
  treatment_regimen VARCHAR(255),
  dot_required BOOLEAN DEFAULT TRUE, -- Directly Observed Therapy
  dot_provider_id UUID REFERENCES providers(id),
  medication_adherence JSONB,
  chest_xray_results JSONB,
  sputum_tests JSONB,
  contact_investigation_completed BOOLEAN DEFAULT FALSE,
  treatment_completion_date DATE,
  case_status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Environmental Health Services
CREATE TABLE IF NOT EXISTS environmental_health_inspections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  county_dept_id UUID REFERENCES county_health_departments(id),
  facility_name VARCHAR(255) NOT NULL,
  facility_type VARCHAR(100), -- food_establishment, pool, septic, water_system
  address TEXT NOT NULL,
  inspection_date DATE NOT NULL,
  inspector_id UUID REFERENCES providers(id),
  inspection_type VARCHAR(100), -- routine, complaint, follow_up, licensing
  violations_found JSONB,
  risk_level VARCHAR(50), -- low, medium, high, critical
  score INTEGER,
  permit_status VARCHAR(50),
  follow_up_required BOOLEAN DEFAULT FALSE,
  follow_up_date DATE,
  report_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Family Planning Services
CREATE TABLE IF NOT EXISTS family_planning_visits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id),
  county_dept_id UUID REFERENCES county_health_departments(id),
  visit_date TIMESTAMPTZ NOT NULL,
  provider_id UUID REFERENCES providers(id),
  contraceptive_method VARCHAR(100),
  services_provided TEXT[], -- counseling, exam, lab_tests, contraceptive_provided
  pregnancy_test_result VARCHAR(20),
  std_screening_done BOOLEAN DEFAULT FALSE,
  education_topics TEXT[],
  follow_up_needed BOOLEAN DEFAULT FALSE,
  follow_up_date DATE,
  visit_fee DECIMAL(8,2),
  sliding_fee_applied BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Health Education & Outreach
CREATE TABLE IF NOT EXISTS community_health_education (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  county_dept_id UUID REFERENCES county_health_departments(id),
  program_name VARCHAR(255) NOT NULL,
  program_type VARCHAR(100), -- workshop, screening_event, health_fair, school_program
  event_date DATE NOT NULL,
  location VARCHAR(255),
  target_population VARCHAR(255), -- seniors, children, at_risk_youth, general_public
  topics_covered TEXT[],
  participants_count INTEGER DEFAULT 0,
  materials_distributed JSONB,
  screenings_provided TEXT[], -- blood_pressure, glucose, cholesterol
  referrals_made INTEGER DEFAULT 0,
  staff_assigned UUID[] REFERENCES providers(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Public Health Emergency Preparedness
CREATE TABLE IF NOT EXISTS emergency_response_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  county_dept_id UUID REFERENCES county_health_departments(id),
  event_name VARCHAR(255) NOT NULL,
  event_type VARCHAR(100), -- pandemic, outbreak, natural_disaster, bioterrorism
  start_date DATE NOT NULL,
  end_date DATE,
  status VARCHAR(50) DEFAULT 'active',
  emergency_operations_center_activated BOOLEAN DEFAULT FALSE,
  services_provided TEXT[], -- testing, vaccination, treatment, shelter
  patients_served INTEGER DEFAULT 0,
  resources_deployed JSONB,
  partner_agencies TEXT[],
  situation_reports JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- County Health Patient Portal Access
CREATE TABLE IF NOT EXISTS county_patient_portal_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id),
  county_dept_id UUID REFERENCES county_health_departments(id),
  portal_username VARCHAR(255) UNIQUE,
  email VARCHAR(255),
  phone VARCHAR(20),
  access_granted_date DATE DEFAULT CURRENT_DATE,
  last_login_date TIMESTAMPTZ,
  services_accessible TEXT[], -- immunization_records, std_results, wic_benefits, appointments
  notification_preferences JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_wic_participants_patient ON wic_participants(patient_id);
CREATE INDEX IF NOT EXISTS idx_wic_participants_county ON wic_participants(county_dept_id);
CREATE INDEX IF NOT EXISTS idx_std_clinic_visits_patient ON std_clinic_visits(patient_id);
CREATE INDEX IF NOT EXISTS idx_std_clinic_visits_date ON std_clinic_visits(visit_date);
CREATE INDEX IF NOT EXISTS idx_communicable_disease_reports_disease ON communicable_disease_reports(disease_name);
CREATE INDEX IF NOT EXISTS idx_communicable_disease_reports_date ON communicable_disease_reports(report_date);
CREATE INDEX IF NOT EXISTS idx_tb_cases_patient ON tb_cases(patient_id);
CREATE INDEX IF NOT EXISTS idx_tb_cases_status ON tb_cases(case_status);
CREATE INDEX IF NOT EXISTS idx_mch_programs_patient ON mch_programs(patient_id);
CREATE INDEX IF NOT EXISTS idx_environmental_health_facility ON environmental_health_inspections(facility_type);

COMMENT ON TABLE county_health_departments IS 'County/local health departments serving public health populations';
COMMENT ON TABLE wic_participants IS 'Women, Infants & Children (WIC) program participants';
COMMENT ON TABLE immunization_clinics IS 'Walk-in and appointment-based immunization clinics';
COMMENT ON TABLE std_clinic_visits IS 'Sexual health/STD clinic visits';
COMMENT ON TABLE mch_programs IS 'Maternal & Child Health home visiting and support programs';
COMMENT ON TABLE communicable_disease_reports IS 'Reportable disease surveillance and tracking';
COMMENT ON TABLE tb_cases IS 'Tuberculosis case management and DOT tracking';
COMMENT ON TABLE environmental_health_inspections IS 'Food safety, water, septic inspections';
COMMENT ON TABLE family_planning_visits IS 'Family planning and reproductive health services';
