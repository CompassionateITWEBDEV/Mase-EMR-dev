-- HR Management System for MASE EMR
-- Comprehensive HR system with hiring, onboarding, credentials, licenses, background checks,
-- training, complaints, and biometric time tracking

-- ======================
-- HR EMPLOYEES TABLE
-- ======================
CREATE TABLE IF NOT EXISTS hr_employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  employee_number VARCHAR(50) UNIQUE NOT NULL,
  
  -- Personal Information
  first_name VARCHAR(100) NOT NULL,
  middle_name VARCHAR(100),
  last_name VARCHAR(100) NOT NULL,
  preferred_name VARCHAR(100),
  date_of_birth DATE NOT NULL,
  ssn_encrypted TEXT, -- Encrypted SSN
  gender VARCHAR(20),
  marital_status VARCHAR(20),
  
  -- Contact Information
  email VARCHAR(255) NOT NULL,
  personal_email VARCHAR(255),
  phone VARCHAR(20),
  emergency_contact_name VARCHAR(200),
  emergency_contact_phone VARCHAR(20),
  emergency_contact_relationship VARCHAR(50),
  
  -- Address
  address_line1 TEXT,
  address_line2 TEXT,
  city VARCHAR(100),
  state VARCHAR(2),
  zip_code VARCHAR(10),
  
  -- Employment Information
  department VARCHAR(100),
  position_title VARCHAR(200),
  employment_type VARCHAR(50), -- Full-Time, Part-Time, Contract, PRN, Temp
  employment_status VARCHAR(50) DEFAULT 'active', -- active, on_leave, suspended, terminated
  hire_date DATE NOT NULL,
  termination_date DATE,
  termination_reason TEXT,
  
  -- Compensation
  pay_type VARCHAR(50), -- Hourly, Salary, Contract
  pay_rate NUMERIC(10,2),
  pay_schedule VARCHAR(50), -- Weekly, Biweekly, Monthly
  
  -- Direct Supervisor
  supervisor_id UUID,
  
  -- Biometric Enrollment
  facial_biometric_enrolled BOOLEAN DEFAULT FALSE,
  facial_template_encrypted TEXT,
  fingerprint_enrolled BOOLEAN DEFAULT FALSE,
  fingerprint_template_encrypted TEXT,
  
  -- Status flags
  onboarding_completed BOOLEAN DEFAULT FALSE,
  i9_verified BOOLEAN DEFAULT FALSE,
  w4_completed BOOLEAN DEFAULT FALSE,
  direct_deposit_setup BOOLEAN DEFAULT FALSE,
  benefits_enrollment_completed BOOLEAN DEFAULT FALSE,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID,
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX idx_hr_employees_org ON hr_employees(organization_id);
CREATE INDEX idx_hr_employees_status ON hr_employees(employment_status);
CREATE INDEX idx_hr_employees_supervisor ON hr_employees(supervisor_id);

-- ======================
-- JOB POSTINGS
-- ======================
CREATE TABLE IF NOT EXISTS hr_job_postings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  job_title VARCHAR(200) NOT NULL,
  department VARCHAR(100),
  job_code VARCHAR(50),
  
  -- Job Details
  employment_type VARCHAR(50),
  job_description TEXT,
  responsibilities TEXT,
  qualifications TEXT,
  required_licenses JSONB, -- Array of required licenses
  required_certifications JSONB,
  education_requirements TEXT,
  experience_required VARCHAR(100),
  
  -- Compensation
  pay_range_min NUMERIC(10,2),
  pay_range_max NUMERIC(10,2),
  benefits_summary TEXT,
  
  -- Posting Details
  posting_status VARCHAR(50) DEFAULT 'draft', -- draft, active, paused, closed, filled
  posted_date DATE,
  closing_date DATE,
  number_of_openings INTEGER DEFAULT 1,
  hiring_manager_id UUID,
  
  -- Application tracking
  total_applications INTEGER DEFAULT 0,
  reviewed_applications INTEGER DEFAULT 0,
  interviewed_candidates INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hr_job_postings_org ON hr_job_postings(organization_id);
CREATE INDEX idx_hr_job_postings_status ON hr_job_postings(posting_status);

-- ======================
-- JOB APPLICATIONS
-- ======================
CREATE TABLE IF NOT EXISTS hr_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_posting_id UUID REFERENCES hr_job_postings(id),
  organization_id UUID NOT NULL,
  
  -- Applicant Information
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  address TEXT,
  
  -- Application Documents
  resume_url TEXT,
  cover_letter_url TEXT,
  additional_documents JSONB,
  
  -- Application Status
  application_status VARCHAR(50) DEFAULT 'submitted', -- submitted, under_review, interview_scheduled, offer_extended, hired, rejected, withdrawn
  application_date TIMESTAMPTZ DEFAULT NOW(),
  
  -- Screening
  screening_questions JSONB,
  screening_responses JSONB,
  
  -- Interview Process
  phone_screen_date DATE,
  phone_screen_notes TEXT,
  interview_scheduled_date DATE,
  interview_completed_date DATE,
  interview_notes TEXT,
  interview_score INTEGER,
  
  -- Decision
  decision VARCHAR(50), -- hire, reject, hold
  decision_date DATE,
  decision_by UUID,
  decision_notes TEXT,
  rejection_reason TEXT,
  
  -- Offer
  offer_extended_date DATE,
  offer_accepted_date DATE,
  offer_declined_date DATE,
  proposed_start_date DATE,
  proposed_salary NUMERIC(10,2),
  
  -- Conversion to Employee
  employee_id UUID,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hr_applications_job ON hr_applications(job_posting_id);
CREATE INDEX idx_hr_applications_status ON hr_applications(application_status);
CREATE INDEX idx_hr_applications_email ON hr_applications(email);

-- ======================
-- LICENSES & CERTIFICATIONS
-- ======================
CREATE TABLE IF NOT EXISTS hr_licenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES hr_employees(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL,
  
  -- License Details
  license_type VARCHAR(100) NOT NULL, -- RN, LPN, MD, DO, LCSW, LCPC, etc.
  license_number VARCHAR(100) NOT NULL,
  issuing_state VARCHAR(2),
  issuing_authority VARCHAR(200),
  
  -- Dates
  issue_date DATE,
  expiration_date DATE NOT NULL,
  renewal_date DATE,
  
  -- Verification
  verification_status VARCHAR(50) DEFAULT 'pending', -- pending, verified, expired, revoked, suspended
  verification_date DATE,
  verified_by UUID,
  verification_method VARCHAR(100), -- Online Portal, Phone, Mail
  verification_source TEXT,
  last_verification_date DATE,
  next_verification_due DATE,
  
  -- Documents
  license_document_url TEXT,
  
  -- Compliance
  requires_ceu BOOLEAN DEFAULT FALSE,
  ceu_hours_required INTEGER,
  ceu_hours_completed INTEGER DEFAULT 0,
  
  -- Alerts
  expiration_alert_sent BOOLEAN DEFAULT FALSE,
  days_until_expiration INTEGER,
  
  -- Status
  is_primary BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hr_licenses_employee ON hr_licenses(employee_id);
CREATE INDEX idx_hr_licenses_expiration ON hr_licenses(expiration_date);
CREATE INDEX idx_hr_licenses_status ON hr_licenses(verification_status);

-- ======================
-- CREDENTIALS & CERTIFICATIONS
-- ======================
CREATE TABLE IF NOT EXISTS hr_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES hr_employees(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL,
  
  -- Credential Information
  credential_type VARCHAR(100) NOT NULL, -- BLS, ACLS, CPR, CCRN, etc.
  credential_name VARCHAR(200),
  certification_number VARCHAR(100),
  issuing_organization VARCHAR(200),
  
  -- Dates
  issue_date DATE,
  expiration_date DATE,
  
  -- Verification
  verification_status VARCHAR(50) DEFAULT 'verified',
  document_url TEXT,
  
  -- Renewal
  renewal_required BOOLEAN DEFAULT TRUE,
  renewal_notification_sent BOOLEAN DEFAULT FALSE,
  
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hr_credentials_employee ON hr_credentials(employee_id);
CREATE INDEX idx_hr_credentials_expiration ON hr_credentials(expiration_date);

-- ======================
-- BACKGROUND CHECKS
-- ======================
CREATE TABLE IF NOT EXISTS hr_background_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES hr_employees(id) ON DELETE CASCADE,
  application_id UUID REFERENCES hr_applications(id),
  organization_id UUID NOT NULL,
  
  -- Check Details
  check_type VARCHAR(100) NOT NULL, -- Criminal, Employment, Education, Reference, Credit, Driving
  vendor_name VARCHAR(200),
  case_number VARCHAR(100),
  
  -- Status
  check_status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, completed, failed, expired
  requested_date DATE NOT NULL,
  completed_date DATE,
  expiration_date DATE,
  
  -- Results
  overall_result VARCHAR(50), -- clear, consider, suspended
  result_summary TEXT,
  result_document_url TEXT,
  
  -- Flags
  requires_review BOOLEAN DEFAULT FALSE,
  reviewed_by UUID,
  reviewed_date DATE,
  review_notes TEXT,
  review_decision VARCHAR(50), -- approved, denied, conditional
  
  -- Compliance
  fcra_compliant BOOLEAN DEFAULT TRUE,
  adverse_action_sent BOOLEAN DEFAULT FALSE,
  adverse_action_date DATE,
  
  -- Renewal
  requires_renewal BOOLEAN DEFAULT FALSE,
  renewal_frequency_months INTEGER,
  
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hr_background_checks_employee ON hr_background_checks(employee_id);
CREATE INDEX idx_hr_background_checks_status ON hr_background_checks(check_status);
CREATE INDEX idx_hr_background_checks_expiration ON hr_background_checks(expiration_date);

-- ======================
-- INSERVICE TRAINING
-- ======================
CREATE TABLE IF NOT EXISTS hr_training_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  
  -- Program Details
  program_code VARCHAR(50) UNIQUE,
  program_name VARCHAR(200) NOT NULL,
  program_category VARCHAR(100), -- Orientation, Compliance, Clinical, Safety, Leadership
  description TEXT,
  
  -- Requirements
  is_required BOOLEAN DEFAULT FALSE,
  required_for_roles JSONB, -- Array of roles that require this training
  frequency VARCHAR(50), -- One-Time, Annual, Quarterly, etc.
  frequency_months INTEGER,
  
  -- Content
  training_method VARCHAR(100), -- In-Person, Online, Hybrid, Self-Study
  duration_hours NUMERIC(4,2),
  materials_url TEXT,
  quiz_required BOOLEAN DEFAULT FALSE,
  passing_score INTEGER,
  
  -- Compliance
  regulatory_requirement VARCHAR(200),
  accreditation_body VARCHAR(200), -- Joint Commission, CARF, State Board
  ceu_credits NUMERIC(4,2),
  
  -- Instructor
  instructor_name VARCHAR(200),
  instructor_credentials VARCHAR(200),
  
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hr_training_programs_org ON hr_training_programs(organization_id);
CREATE INDEX idx_hr_training_programs_category ON hr_training_programs(program_category);

-- ======================
-- TRAINING COMPLETIONS
-- ======================
CREATE TABLE IF NOT EXISTS hr_training_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES hr_employees(id) ON DELETE CASCADE,
  training_program_id UUID REFERENCES hr_training_programs(id),
  organization_id UUID NOT NULL,
  
  -- Completion Details
  completion_date DATE NOT NULL,
  completion_method VARCHAR(100),
  instructor_name VARCHAR(200),
  location VARCHAR(200),
  
  -- Assessment
  quiz_taken BOOLEAN DEFAULT FALSE,
  quiz_score INTEGER,
  quiz_passed BOOLEAN,
  quiz_attempts INTEGER DEFAULT 0,
  
  -- Certification
  certificate_number VARCHAR(100),
  certificate_issued_date DATE,
  certificate_expiration_date DATE,
  certificate_url TEXT,
  
  -- Hours
  hours_completed NUMERIC(4,2),
  ceu_credits_earned NUMERIC(4,2),
  
  -- Verification
  verified_by UUID,
  verified_date DATE,
  
  -- Renewal
  renewal_required BOOLEAN DEFAULT FALSE,
  renewal_due_date DATE,
  renewal_notification_sent BOOLEAN DEFAULT FALSE,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hr_training_completions_employee ON hr_training_completions(employee_id);
CREATE INDEX idx_hr_training_completions_program ON hr_training_completions(training_program_id);
CREATE INDEX idx_hr_training_completions_expiration ON hr_training_completions(certificate_expiration_date);

-- ======================
-- EMPLOYEE COMPLAINTS
-- ======================
CREATE TABLE IF NOT EXISTS hr_complaints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  complaint_number VARCHAR(50) UNIQUE NOT NULL,
  
  -- Complainant (optional - can be anonymous)
  complainant_employee_id UUID REFERENCES hr_employees(id),
  complainant_name VARCHAR(200),
  complainant_email VARCHAR(255),
  complainant_phone VARCHAR(20),
  is_anonymous BOOLEAN DEFAULT FALSE,
  
  -- Subject of Complaint
  subject_employee_id UUID REFERENCES hr_employees(id),
  subject_employee_name VARCHAR(200),
  
  -- Complaint Details
  complaint_type VARCHAR(100), -- Harassment, Discrimination, Safety, Policy Violation, Retaliation, Workplace Violence, Other
  complaint_category VARCHAR(100),
  incident_date DATE,
  incident_location VARCHAR(200),
  complaint_description TEXT NOT NULL,
  
  -- Severity & Priority
  severity VARCHAR(50) DEFAULT 'medium', -- low, medium, high, critical
  priority VARCHAR(50) DEFAULT 'normal', -- low, normal, high, urgent
  
  -- Investigation
  investigation_status VARCHAR(50) DEFAULT 'reported', -- reported, under_investigation, pending_review, resolved, closed
  assigned_investigator_id UUID,
  investigation_start_date DATE,
  investigation_end_date DATE,
  investigation_notes TEXT,
  investigation_findings TEXT,
  
  -- Witnesses
  witnesses JSONB,
  
  -- Evidence
  evidence_documents JSONB,
  
  -- Resolution
  resolution_type VARCHAR(100), -- Substantiated, Unsubstantiated, Inconclusive
  resolution_date DATE,
  resolution_summary TEXT,
  corrective_actions_taken TEXT,
  
  -- Follow-up
  follow_up_required BOOLEAN DEFAULT FALSE,
  follow_up_date DATE,
  follow_up_notes TEXT,
  
  -- Confidentiality
  confidential BOOLEAN DEFAULT TRUE,
  retaliation_protection BOOLEAN DEFAULT TRUE,
  
  -- Compliance
  reported_to_authorities BOOLEAN DEFAULT FALSE,
  authority_name VARCHAR(200),
  authority_report_date DATE,
  authority_case_number VARCHAR(100),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID,
  closed_at TIMESTAMPTZ,
  closed_by UUID
);

CREATE INDEX idx_hr_complaints_org ON hr_complaints(organization_id);
CREATE INDEX idx_hr_complaints_status ON hr_complaints(investigation_status);
CREATE INDEX idx_hr_complaints_subject ON hr_complaints(subject_employee_id);
CREATE INDEX idx_hr_complaints_date ON hr_complaints(incident_date);

-- ======================
-- BIOMETRIC TIME CLOCK
-- ======================
CREATE TABLE IF NOT EXISTS hr_time_clock_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES hr_employees(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL,
  
  -- Event Details
  event_type VARCHAR(20) NOT NULL, -- clock_in, clock_out, break_start, break_end
  event_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  event_date DATE NOT NULL,
  event_time TIME NOT NULL,
  
  -- Location
  clock_location VARCHAR(200),
  gps_latitude NUMERIC(10,8),
  gps_longitude NUMERIC(11,8),
  gps_accuracy_meters INTEGER,
  ip_address INET,
  
  -- Biometric Verification
  biometric_method VARCHAR(50), -- facial, fingerprint, pin, badge
  facial_biometric_verified BOOLEAN DEFAULT FALSE,
  facial_match_confidence NUMERIC(5,2),
  facial_image_url TEXT,
  liveness_check_passed BOOLEAN DEFAULT FALSE,
  fingerprint_verified BOOLEAN DEFAULT FALSE,
  
  -- Device Information
  device_id VARCHAR(200),
  device_type VARCHAR(100),
  terminal_id VARCHAR(100),
  
  -- Verification Status
  verification_status VARCHAR(50) DEFAULT 'verified', -- verified, manual_entry, failed, disputed
  verification_failed_reason TEXT,
  
  -- Manual Entry
  is_manual_entry BOOLEAN DEFAULT FALSE,
  manual_entry_by UUID,
  manual_entry_reason TEXT,
  manual_entry_approved_by UUID,
  manual_entry_approved_at TIMESTAMPTZ,
  
  -- Flags
  is_late BOOLEAN DEFAULT FALSE,
  is_early_departure BOOLEAN DEFAULT FALSE,
  requires_approval BOOLEAN DEFAULT FALSE,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  
  -- Dispute
  is_disputed BOOLEAN DEFAULT FALSE,
  dispute_reason TEXT,
  dispute_resolved BOOLEAN DEFAULT FALSE,
  dispute_resolution TEXT,
  
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hr_time_clock_employee ON hr_time_clock_events(employee_id);
CREATE INDEX idx_hr_time_clock_date ON hr_time_clock_events(event_date);
CREATE INDEX idx_hr_time_clock_timestamp ON hr_time_clock_events(event_timestamp);

-- ======================
-- PAYROLL HOURS SUMMARY
-- ======================
CREATE TABLE IF NOT EXISTS hr_payroll_hours (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES hr_employees(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL,
  
  -- Pay Period
  pay_period_start DATE NOT NULL,
  pay_period_end DATE NOT NULL,
  pay_period_number INTEGER,
  
  -- Hours Worked
  regular_hours NUMERIC(8,2) DEFAULT 0,
  overtime_hours NUMERIC(8,2) DEFAULT 0,
  double_time_hours NUMERIC(8,2) DEFAULT 0,
  pto_hours NUMERIC(8,2) DEFAULT 0,
  sick_hours NUMERIC(8,2) DEFAULT 0,
  holiday_hours NUMERIC(8,2) DEFAULT 0,
  unpaid_hours NUMERIC(8,2) DEFAULT 0,
  total_hours NUMERIC(8,2) DEFAULT 0,
  
  -- Breaks
  total_break_minutes INTEGER DEFAULT 0,
  paid_break_minutes INTEGER DEFAULT 0,
  unpaid_break_minutes INTEGER DEFAULT 0,
  
  -- Attendance
  days_worked INTEGER DEFAULT 0,
  days_absent INTEGER DEFAULT 0,
  days_late INTEGER DEFAULT 0,
  days_early_departure INTEGER DEFAULT 0,
  
  -- Status
  status VARCHAR(50) DEFAULT 'draft', -- draft, pending_review, approved, submitted, processed
  
  -- Review & Approval
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  
  -- Submission
  submitted_to_payroll BOOLEAN DEFAULT FALSE,
  submitted_at TIMESTAMPTZ,
  submitted_by UUID,
  
  -- Payroll Integration
  payroll_batch_id VARCHAR(100),
  payroll_processed_at TIMESTAMPTZ,
  
  -- Exceptions
  has_exceptions BOOLEAN DEFAULT FALSE,
  exception_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hr_payroll_hours_employee ON hr_payroll_hours(employee_id);
CREATE INDEX idx_hr_payroll_hours_period ON hr_payroll_hours(pay_period_start, pay_period_end);
CREATE INDEX idx_hr_payroll_hours_status ON hr_payroll_hours(status);

-- ======================
-- ONBOARDING CHECKLISTS
-- ======================
CREATE TABLE IF NOT EXISTS hr_onboarding_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES hr_employees(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL,
  
  -- Task Details
  task_category VARCHAR(100), -- Paperwork, IT Setup, Training, Orientation, Benefits
  task_name VARCHAR(200) NOT NULL,
  task_description TEXT,
  task_order INTEGER,
  
  -- Assignment
  assigned_to UUID, -- HR staff responsible
  due_date DATE,
  
  -- Completion
  status VARCHAR(50) DEFAULT 'pending', -- pending, in_progress, completed, skipped
  completed_date DATE,
  completed_by UUID,
  completion_notes TEXT,
  
  -- Documents
  requires_document BOOLEAN DEFAULT FALSE,
  document_url TEXT,
  document_verified BOOLEAN DEFAULT FALSE,
  verified_by UUID,
  
  is_required BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_hr_onboarding_tasks_employee ON hr_onboarding_tasks(employee_id);
CREATE INDEX idx_hr_onboarding_tasks_status ON hr_onboarding_tasks(status);

-- Enable Row Level Security
ALTER TABLE hr_employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_licenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_background_checks ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_training_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_training_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_complaints ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_time_clock_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_payroll_hours ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_onboarding_tasks ENABLE ROW LEVEL SECURITY;

-- Basic RLS Policies (Allow service role full access)
CREATE POLICY hr_employees_service_role ON hr_employees FOR ALL USING (true);
CREATE POLICY hr_job_postings_service_role ON hr_job_postings FOR ALL USING (true);
CREATE POLICY hr_applications_service_role ON hr_applications FOR ALL USING (true);
CREATE POLICY hr_licenses_service_role ON hr_licenses FOR ALL USING (true);
CREATE POLICY hr_credentials_service_role ON hr_credentials FOR ALL USING (true);
CREATE POLICY hr_background_checks_service_role ON hr_background_checks FOR ALL USING (true);
CREATE POLICY hr_training_programs_service_role ON hr_training_programs FOR ALL USING (true);
CREATE POLICY hr_training_completions_service_role ON hr_training_completions FOR ALL USING (true);
CREATE POLICY hr_complaints_service_role ON hr_complaints FOR ALL USING (true);
CREATE POLICY hr_time_clock_events_service_role ON hr_time_clock_events FOR ALL USING (true);
CREATE POLICY hr_payroll_hours_service_role ON hr_payroll_hours FOR ALL USING (true);
CREATE POLICY hr_onboarding_tasks_service_role ON hr_onboarding_tasks FOR ALL USING (true);

COMMENT ON TABLE hr_employees IS 'Complete employee management with biometric enrollment';
COMMENT ON TABLE hr_job_postings IS 'Job posting and applicant tracking system';
COMMENT ON TABLE hr_applications IS 'Employment applications with full hiring workflow';
COMMENT ON TABLE hr_licenses IS 'Professional licenses with automated verification and expiration tracking';
COMMENT ON TABLE hr_credentials IS 'Certifications and credentials tracking';
COMMENT ON TABLE hr_background_checks IS 'Background check management with FCRA compliance';
COMMENT ON TABLE hr_training_programs IS 'Inservice training and education programs';
COMMENT ON TABLE hr_training_completions IS 'Employee training completion tracking with CEU credits';
COMMENT ON TABLE hr_complaints IS 'Employee complaint and investigation management';
COMMENT ON TABLE hr_time_clock_events IS 'Biometric time clock with facial recognition and GPS verification';
COMMENT ON TABLE hr_payroll_hours IS 'Automated payroll hours calculation from time clock data';
COMMENT ON TABLE hr_onboarding_tasks IS 'New hire onboarding checklist and task tracking';
