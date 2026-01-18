-- ============================================================================
-- MASE BEHAVIORAL HEALTH EMR - COMPLETE DATABASE SETUP
-- ============================================================================
-- This master script contains ALL SQL needed to set up the complete EMR system
-- Execute this entire script in your Supabase SQL Editor
-- Estimated execution time: 2-5 minutes
-- ============================================================================

-- SECTION 1: CORE FOUNDATION TABLES
-- ============================================================================

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- MULTI-TENANT SYSTEM (Organizations & Users)
-- ============================================================================

CREATE TABLE IF NOT EXISTS organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'clinic', 'hospital', 'county_health', 'otp'
    npi VARCHAR(10),
    tax_id VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(2),
    zip VARCHAR(10),
    phone VARCHAR(20),
    email VARCHAR(255),
    website VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    subscription_tier VARCHAR(50) DEFAULT 'basic', -- 'basic', 'professional', 'enterprise'
    subscription_status VARCHAR(50) DEFAULT 'active', -- 'active', 'suspended', 'trial'
    trial_ends_at TIMESTAMP,
    onboarding_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(50) NOT NULL, -- 'super_admin', 'clinic_admin', 'provider', 'nurse', 'staff', 'patient'
    specialty VARCHAR(100),
    license_number VARCHAR(50),
    dea_number VARCHAR(20),
    npi VARCHAR(10),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS super_admins (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_account_id UUID REFERENCES user_accounts(id) ON DELETE CASCADE,
    permissions JSONB DEFAULT '{"manage_all": true}'::jsonb,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS organization_features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    feature_name VARCHAR(100) NOT NULL,
    is_enabled BOOLEAN DEFAULT true,
    config JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS login_activity (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_account_id UUID REFERENCES user_accounts(id) ON DELETE CASCADE,
    login_time TIMESTAMP DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN DEFAULT true
);

-- ============================================================================
-- CLINIC ONBOARDING TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS clinic_onboarding (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    step_number INT NOT NULL,
    step_name VARCHAR(100) NOT NULL,
    is_completed BOOLEAN DEFAULT false,
    completed_at TIMESTAMP,
    data JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clinic_insurance_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    payer_name VARCHAR(255) NOT NULL,
    payer_id VARCHAR(100),
    plan_type VARCHAR(100), -- 'commercial', 'medicare', 'medicaid', 'exchange'
    accepts_plan BOOLEAN DEFAULT true,
    contract_start_date DATE,
    contract_end_date DATE,
    reimbursement_rate_percentage DECIMAL(5,2),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- SPECIALTY CONFIGURATION TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS clinic_specialty_configuration (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    specialty_name VARCHAR(100) NOT NULL,
    is_enabled BOOLEAN DEFAULT true,
    config JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(organization_id, specialty_name)
);

CREATE TABLE IF NOT EXISTS specialty_features (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    specialty_name VARCHAR(100) NOT NULL,
    feature_name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Seed specialty features
INSERT INTO specialty_features (specialty_name, feature_name, description, category) VALUES
('Behavioral Health', 'OTP/MAT Programs', 'Opioid Treatment Program management', 'clinical'),
('Behavioral Health', 'COWS Assessments', 'Clinical Opiate Withdrawal Scale', 'assessments'),
('Behavioral Health', 'DEA Compliance', 'Schedule II-V tracking', 'regulatory'),
('Primary Care', 'ICD-10 Diagnosis Coding', 'All specialties coding', 'billing'),
('Primary Care', 'Vital Signs Trending', 'Track BP, HR, Weight', 'clinical'),
('Primary Care', 'Preventive Care Reminders', 'USPSTF guidelines', 'clinical'),
('Psychiatry', 'Mental Status Exams', 'Standardized MSE templates', 'assessments'),
('Psychiatry', 'PHQ-9/GAD-7 Tracking', 'Depression and anxiety screening', 'assessments'),
('Psychiatry', 'Medication Management', 'Psychotropic medication tracking', 'clinical'),
('OB/GYN', 'Prenatal Care Tracking', 'Trimester-based visits', 'clinical'),
('OB/GYN', 'GYN Exam Templates', 'Pap smear, pelvic exam', 'clinical'),
('OB/GYN', 'High-Risk Pregnancy Alerts', 'Automated risk detection', 'clinical'),
('Cardiology', 'ECG Integration', 'Import and interpret ECGs', 'diagnostics'),
('Cardiology', 'Cardiac Risk Calculators', 'Framingham, ASCVD', 'clinical'),
('Cardiology', 'Stress Test Tracking', 'Results and follow-up', 'diagnostics'),
('Dermatology', 'Lesion Photography', 'Document skin conditions', 'clinical'),
('Dermatology', 'Biopsy Tracking', 'Lab results management', 'diagnostics'),
('Dermatology', 'Derm-Specific Codes', 'CPT codes for procedures', 'billing'),
('Pediatrics', 'Growth Charts', 'CDC growth percentiles', 'clinical'),
('Pediatrics', 'Immunization Schedule', 'ACIP recommendations', 'clinical'),
('Pediatrics', 'Well-Child Visits', 'Age-based templates', 'clinical'),
('Urgent Care', 'Fast Track Templates', 'Quick documentation', 'clinical'),
('Urgent Care', 'Work/School Notes', 'Automated note generation', 'clinical'),
('Urgent Care', 'Minor Procedure Billing', 'Laceration repair, etc.', 'billing'),
('Podiatry', 'Diabetic Foot Exams', 'Monofilament testing, vascular', 'clinical'),
('Podiatry', 'Nail Procedures', 'Ingrown nail, debridement', 'procedures'),
('Podiatry', 'Custom Orthotics', 'Casting and fitting', 'dme'),
('Physical Therapy', 'Functional Assessments', 'ROM, strength, gait', 'assessments'),
('Physical Therapy', 'Home Exercise Programs', 'Remote monitoring', 'clinical'),
('Physical Therapy', 'RTM Billing', 'Remote therapeutic monitoring CPT codes', 'billing'),
('Occupational Therapy', 'ADL Assessments', 'Activities of daily living', 'assessments'),
('Occupational Therapy', 'Home Safety Evaluations', 'Fall risk assessment', 'clinical'),
('Occupational Therapy', 'Adaptive Equipment', 'DME recommendations', 'dme'),
('Speech Therapy', 'Swallowing Assessments', 'Dysphagia evaluation', 'assessments'),
('Speech Therapy', 'Articulation Testing', 'Speech sound disorders', 'assessments'),
('Speech Therapy', 'AAC Devices', 'Communication devices', 'equipment'),
('County Health', 'WIC Program Management', 'Nutrition counseling, vouchers', 'public_health'),
('County Health', 'Immunization Clinics', 'Walk-in vaccination services', 'public_health'),
('County Health', 'STI/STD Testing', 'Confidential testing and treatment', 'public_health'),
('County Health', 'TB Management', 'DOT therapy tracking', 'public_health'),
('County Health', 'Communicable Disease', 'Outbreak investigation', 'public_health')
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PATIENTS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS patients (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    date_of_birth DATE NOT NULL,
    gender VARCHAR(20),
    ssn VARCHAR(11),
    mrn VARCHAR(50) UNIQUE,
    email VARCHAR(255),
    phone VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(2),
    zip VARCHAR(10),
    emergency_contact_name VARCHAR(200),
    emergency_contact_phone VARCHAR(20),
    insurance_provider VARCHAR(255),
    insurance_policy_number VARCHAR(100),
    insurance_group_number VARCHAR(100),
    primary_care_provider VARCHAR(255),
    preferred_pharmacy VARCHAR(255),
    allergies TEXT,
    medical_history TEXT,
    current_medications TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- STAFF & PROVIDERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_account_id UUID REFERENCES user_accounts(id) ON DELETE CASCADE,
    employee_id VARCHAR(50) UNIQUE,
    department VARCHAR(100),
    title VARCHAR(100),
    hire_date DATE,
    termination_date DATE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_account_id UUID REFERENCES user_accounts(id) ON DELETE CASCADE,
    provider_type VARCHAR(50), -- 'physician', 'np', 'pa', 'therapist'
    specialty VARCHAR(100),
    accepts_new_patients BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- APPOINTMENTS & ENCOUNTERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES providers(id) ON DELETE SET NULL,
    appointment_date DATE NOT NULL,
    appointment_time TIME NOT NULL,
    duration_minutes INT DEFAULT 30,
    appointment_type VARCHAR(100),
    status VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'checked-in', 'completed', 'cancelled', 'no-show'
    reason TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS encounters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES providers(id) ON DELETE SET NULL,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    encounter_date TIMESTAMP NOT NULL DEFAULT NOW(),
    encounter_type VARCHAR(100), -- 'office_visit', 'telehealth', 'hospital', 'emergency'
    chief_complaint TEXT,
    diagnosis_codes TEXT[], -- Array of ICD-10 codes
    procedure_codes TEXT[], -- Array of CPT codes
    subjective TEXT,
    objective TEXT,
    assessment TEXT,
    plan TEXT,
    status VARCHAR(50) DEFAULT 'open', -- 'open', 'signed', 'billing_complete'
    signed_by UUID REFERENCES providers(id) ON DELETE SET NULL,
    signed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vital_signs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    encounter_id UUID REFERENCES encounters(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    recorded_at TIMESTAMP DEFAULT NOW(),
    blood_pressure_systolic INT,
    blood_pressure_diastolic INT,
    heart_rate INT,
    respiratory_rate INT,
    temperature DECIMAL(4,1),
    oxygen_saturation INT,
    weight DECIMAL(5,2),
    height DECIMAL(5,2),
    bmi DECIMAL(4,1),
    pain_level INT CHECK (pain_level BETWEEN 0 AND 10),
    recorded_by UUID REFERENCES staff(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- ASSESSMENTS
-- ============================================================================

CREATE TABLE IF NOT EXISTS assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    encounter_id UUID REFERENCES encounters(id) ON DELETE SET NULL,
    assessment_type VARCHAR(100) NOT NULL, -- 'COWS', 'PHQ-9', 'GAD-7', 'intake', etc.
    assessment_date TIMESTAMP DEFAULT NOW(),
    performed_by UUID REFERENCES staff(id) ON DELETE SET NULL,
    total_score INT,
    severity_level VARCHAR(50),
    responses JSONB, -- Store all question/answer pairs
    diagnosis_codes TEXT[],
    recommendations TEXT,
    notes TEXT,
    status VARCHAR(50) DEFAULT 'completed',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- MEDICATIONS & PRESCRIPTIONS
-- ============================================================================

CREATE TABLE IF NOT EXISTS medications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    medication_name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255),
    ndc_code VARCHAR(20),
    dea_schedule VARCHAR(10), -- 'I', 'II', 'III', 'IV', 'V'
    strength VARCHAR(50),
    dosage_form VARCHAR(100),
    route VARCHAR(50),
    frequency VARCHAR(100),
    quantity INT,
    refills INT,
    prescribed_date DATE NOT NULL,
    prescribed_by UUID REFERENCES providers(id) ON DELETE SET NULL,
    start_date DATE,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'discontinued', 'completed'
    pharmacy VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- CLINICAL NOTES
-- ============================================================================

CREATE TABLE IF NOT EXISTS progress_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    encounter_id UUID REFERENCES encounters(id) ON DELETE SET NULL,
    note_type VARCHAR(100), -- 'progress', 'soap', 'intake', 'discharge', 'specialty'
    specialty_type VARCHAR(100), -- 'PT', 'OT', 'Speech', 'Podiatry', etc.
    note_date TIMESTAMP DEFAULT NOW(),
    author_id UUID REFERENCES staff(id) ON DELETE SET NULL,
    subjective TEXT,
    objective TEXT,
    assessment TEXT,
    plan TEXT,
    full_note TEXT,
    template_used VARCHAR(100),
    is_signed BOOLEAN DEFAULT false,
    signed_at TIMESTAMP,
    signed_by UUID REFERENCES providers(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- BILLING & CLAIMS
-- ============================================================================

CREATE TABLE IF NOT EXISTS claims (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    encounter_id UUID REFERENCES encounters(id) ON DELETE CASCADE,
    claim_number VARCHAR(50) UNIQUE,
    claim_type VARCHAR(50), -- 'professional', 'institutional'
    payer_name VARCHAR(255),
    payer_id VARCHAR(100),
    service_date DATE NOT NULL,
    total_charges DECIMAL(10,2),
    total_payments DECIMAL(10,2),
    total_adjustments DECIMAL(10,2),
    balance DECIMAL(10,2),
    status VARCHAR(50) DEFAULT 'draft', -- 'draft', 'submitted', 'accepted', 'rejected', 'paid', 'denied'
    submitted_at TIMESTAMP,
    paid_at TIMESTAMP,
    denial_reason TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS claim_line_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    claim_id UUID REFERENCES claims(id) ON DELETE CASCADE,
    service_date DATE NOT NULL,
    procedure_code VARCHAR(10) NOT NULL, -- CPT/HCPCS code
    modifier_1 VARCHAR(2),
    modifier_2 VARCHAR(2),
    diagnosis_pointer VARCHAR(4),
    units INT DEFAULT 1,
    charge_amount DECIMAL(10,2),
    allowed_amount DECIMAL(10,2),
    payment_amount DECIMAL(10,2),
    adjustment_amount DECIMAL(10,2),
    description TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- OTP/MAT SPECIFIC TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS otp_admissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    admission_date DATE NOT NULL,
    program_type VARCHAR(50), -- 'methadone', 'buprenorphine', 'naltrexone'
    primary_substance VARCHAR(100),
    previous_treatment_episodes INT,
    medication VARCHAR(100),
    initial_dose DECIMAL(6,2),
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'discharged', 'transferred'
    discharge_date DATE,
    discharge_reason TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dosing_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    otp_admission_id UUID REFERENCES otp_admissions(id) ON DELETE CASCADE,
    dose_date DATE NOT NULL,
    dose_time TIME NOT NULL,
    medication VARCHAR(100) NOT NULL,
    dose_amount DECIMAL(6,2) NOT NULL,
    dispensed_by UUID REFERENCES staff(id) ON DELETE SET NULL,
    witnessed_by UUID REFERENCES staff(id) ON DELETE SET NULL,
    observation_time_minutes INT,
    patient_response TEXT,
    adverse_events TEXT,
    bottle_number VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS takehome_doses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    authorized_by UUID REFERENCES providers(id) ON DELETE SET NULL,
    authorization_date DATE NOT NULL,
    medication VARCHAR(100) NOT NULL,
    dose_amount DECIMAL(6,2) NOT NULL,
    number_of_doses INT NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    dispensed_date DATE,
    dispensed_by UUID REFERENCES staff(id) ON DELETE SET NULL,
    bottle_numbers TEXT[],
    recalled BOOLEAN DEFAULT false,
    recall_date DATE,
    recall_reason TEXT,
    status VARCHAR(50) DEFAULT 'authorized', -- 'authorized', 'dispensed', 'recalled', 'expired'
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS urine_drug_screens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    collection_date TIMESTAMP NOT NULL,
    collected_by UUID REFERENCES staff(id) ON DELETE SET NULL,
    observed BOOLEAN DEFAULT false,
    temperature DECIMAL(4,1),
    specimen_id VARCHAR(50) UNIQUE,
    test_type VARCHAR(50), -- 'instant', 'lab_confirm', 'both'
    lab_name VARCHAR(255),
    results JSONB, -- {substance: result}
    positive_for TEXT[],
    interpretation TEXT,
    follow_up_required BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- DISPENSING & INVENTORY
-- ============================================================================

CREATE TABLE IF NOT EXISTS medication_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    medication_name VARCHAR(255) NOT NULL,
    ndc_code VARCHAR(20),
    dea_schedule VARCHAR(10),
    lot_number VARCHAR(50),
    expiration_date DATE,
    quantity_on_hand INT NOT NULL,
    unit_of_measure VARCHAR(20),
    location VARCHAR(100),
    reorder_level INT,
    cost_per_unit DECIMAL(10,2),
    last_inventory_date DATE,
    last_counted_by UUID REFERENCES staff(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    medication_inventory_id UUID REFERENCES medication_inventory(id) ON DELETE CASCADE,
    transaction_type VARCHAR(50) NOT NULL, -- 'receive', 'dispense', 'waste', 'return', 'adjustment'
    quantity INT NOT NULL,
    transaction_date TIMESTAMP DEFAULT NOW(),
    performed_by UUID REFERENCES staff(id) ON DELETE SET NULL,
    witnessed_by UUID REFERENCES staff(id) ON DELETE SET NULL,
    reason TEXT,
    reference_number VARCHAR(100), -- Links to dosing_log, waste_log, etc.
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- VACCINATION RECORDS
-- ============================================================================

CREATE TABLE IF NOT EXISTS vaccinations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    vaccine_name VARCHAR(255) NOT NULL,
    vaccine_code VARCHAR(20), -- CVX code
    manufacturer VARCHAR(255),
    lot_number VARCHAR(50),
    expiration_date DATE,
    dose_number INT,
    total_doses_in_series INT,
    administration_date DATE NOT NULL,
    administration_site VARCHAR(100), -- 'left_deltoid', 'right_deltoid', etc.
    route VARCHAR(50), -- 'IM', 'SubQ', 'PO', 'Intranasal'
    administered_by UUID REFERENCES staff(id) ON DELETE SET NULL,
    vis_date DATE, -- Vaccine Information Statement date
    vis_given BOOLEAN DEFAULT true,
    funding_source VARCHAR(100), -- 'private', 'vfc', 'medicaid', 'uninsured'
    reported_to_registry BOOLEAN DEFAULT false,
    registry_report_date DATE,
    adverse_event BOOLEAN DEFAULT false,
    adverse_event_details TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vaccine_inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    vaccine_name VARCHAR(255) NOT NULL,
    vaccine_code VARCHAR(20),
    manufacturer VARCHAR(255),
    lot_number VARCHAR(50) NOT NULL,
    expiration_date DATE NOT NULL,
    quantity_on_hand INT NOT NULL,
    unit_of_measure VARCHAR(20) DEFAULT 'doses',
    storage_location VARCHAR(100),
    temperature_min DECIMAL(4,1),
    temperature_max DECIMAL(4,1),
    funding_source VARCHAR(100),
    cost_per_dose DECIMAL(10,2),
    received_date DATE,
    last_inventory_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- MASE HIE NETWORK (Health Information Exchange)
-- ============================================================================

CREATE TABLE IF NOT EXISTS hie_network_registry (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    network_status VARCHAR(50) DEFAULT 'active', -- 'active', 'inactive', 'suspended'
    joined_date TIMESTAMP DEFAULT NOW(),
    last_sync TIMESTAMP,
    data_sharing_level VARCHAR(50) DEFAULT 'full', -- 'full', 'limited', 'emergency_only'
    contact_name VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hie_patient_consents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    consent_type VARCHAR(50) DEFAULT 'share_all', -- 'share_all', 'share_limited', 'opt_out'
    effective_date DATE NOT NULL,
    expiration_date DATE,
    signed_date DATE NOT NULL,
    revoked BOOLEAN DEFAULT false,
    revoked_date DATE,
    scope TEXT, -- What data can be shared
    restrictions TEXT, -- Any limitations
    consent_document_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hie_data_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    requesting_organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    providing_organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    request_type VARCHAR(50), -- 'full_record', 'specific_encounter', 'medications', 'labs'
    request_date TIMESTAMP DEFAULT NOW(),
    requested_by UUID REFERENCES staff(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'denied', 'completed'
    approval_date TIMESTAMP,
    completion_date TIMESTAMP,
    data_sent JSONB,
    denial_reason TEXT,
    audit_log JSONB,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hie_referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    referring_organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    receiving_organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    referral_date DATE NOT NULL,
    referring_provider UUID REFERENCES providers(id) ON DELETE SET NULL,
    referral_reason TEXT NOT NULL,
    specialty_needed VARCHAR(100),
    urgency VARCHAR(50) DEFAULT 'routine', -- 'routine', 'urgent', 'emergent'
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'accepted', 'declined', 'completed'
    accepted_date DATE,
    appointment_scheduled BOOLEAN DEFAULT false,
    appointment_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- DME, TOXICOLOGY LAB, REHABILITATION SERVICES
-- ============================================================================

CREATE TABLE IF NOT EXISTS dme_suppliers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    supplier_name VARCHAR(255) NOT NULL,
    npi VARCHAR(10),
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(2),
    zip VARCHAR(10),
    is_preferred BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dme_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
    supplier_id UUID REFERENCES dme_suppliers(id) ON DELETE SET NULL,
    order_date DATE NOT NULL,
    dme_item VARCHAR(255) NOT NULL,
    hcpcs_code VARCHAR(10),
    quantity INT NOT NULL,
    diagnosis_codes TEXT[],
    medical_necessity TEXT,
    status VARCHAR(50) DEFAULT 'ordered', -- 'ordered', 'pending_auth', 'approved', 'delivered', 'denied'
    authorization_number VARCHAR(100),
    delivery_date DATE,
    tracking_number VARCHAR(100),
    parachute_order_id VARCHAR(100), -- Integration with Parachute Health
    verse_order_id VARCHAR(100), -- Integration with Verse Medical
    ai_validated BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS toxicology_labs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lab_name VARCHAR(255) NOT NULL,
    clia_number VARCHAR(20),
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    turnaround_time_hours INT,
    test_menu TEXT[],
    is_preferred BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS toxicology_orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
    lab_id UUID REFERENCES toxicology_labs(id) ON DELETE SET NULL,
    order_date TIMESTAMP DEFAULT NOW(),
    collection_date TIMESTAMP,
    specimen_id VARCHAR(50) UNIQUE,
    test_type VARCHAR(100), -- 'urine_drug_screen', 'blood_alcohol', 'etg', 'comprehensive'
    tests_ordered TEXT[],
    chain_of_custody BOOLEAN DEFAULT true,
    results JSONB,
    result_date TIMESTAMP,
    interpretation TEXT,
    reviewed_by UUID REFERENCES providers(id) ON DELETE SET NULL,
    reviewed_date TIMESTAMP,
    status VARCHAR(50) DEFAULT 'ordered', -- 'ordered', 'collected', 'in_transit', 'received', 'resulted'
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rehabilitation_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    provider_type VARCHAR(50) NOT NULL, -- 'PT', 'OT', 'Speech'
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    license_number VARCHAR(50),
    specialty VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rehabilitation_referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    referring_provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
    therapy_type VARCHAR(50) NOT NULL, -- 'PT', 'OT', 'Speech'
    referral_date DATE NOT NULL,
    diagnosis_codes TEXT[],
    reason_for_referral TEXT,
    precautions TEXT,
    frequency_per_week INT,
    duration_weeks INT,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'accepted', 'in_progress', 'completed', 'discontinued'
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rehabilitation_evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    referral_id UUID REFERENCES rehabilitation_referrals(id) ON DELETE CASCADE,
    therapist_id UUID REFERENCES rehabilitation_providers(id) ON DELETE CASCADE,
    evaluation_date DATE NOT NULL,
    therapy_type VARCHAR(50),
    chief_complaint TEXT,
    history_of_present_illness TEXT,
    functional_limitations TEXT,
    objective_findings JSONB,
    assessment TEXT,
    goals JSONB,
    plan_of_care TEXT,
    frequency_per_week INT,
    estimated_duration_weeks INT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rehabilitation_treatment_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    referral_id UUID REFERENCES rehabilitation_referrals(id) ON DELETE CASCADE,
    therapist_id UUID REFERENCES rehabilitation_providers(id) ON DELETE CASCADE,
    treatment_date DATE NOT NULL,
    therapy_type VARCHAR(50),
    interventions TEXT,
    patient_response TEXT,
    objective_measures JSONB,
    progress_toward_goals TEXT,
    plan_for_next_visit TEXT,
    visit_number INT,
    total_minutes INT,
    cpt_codes TEXT[],
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- HOME EXERCISE PROGRAM (HEP) WITH REMOTE THERAPEUTIC MONITORING (RTM)
-- ============================================================================

CREATE TABLE IF NOT EXISTS hep_exercise_library (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    exercise_name VARCHAR(255) NOT NULL,
    exercise_type VARCHAR(100), -- 'strength', 'flexibility', 'balance', 'cardio', 'functional'
    body_region VARCHAR(100),
    description TEXT,
    instructions TEXT,
    video_url TEXT,
    image_url TEXT,
    contraindications TEXT,
    modifications TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patient_hep_programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    therapist_id UUID REFERENCES rehabilitation_providers(id) ON DELETE CASCADE,
    program_name VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'completed', 'discontinued'
    exercises JSONB, -- Array of {exercise_id, sets, reps, frequency, duration}
    patient_instructions TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hep_compliance_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    program_id UUID REFERENCES patient_hep_programs(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    log_date DATE NOT NULL,
    exercises_completed JSONB,
    total_minutes INT,
    pain_level_before INT,
    pain_level_after INT,
    difficulty_level VARCHAR(50), -- 'easy', 'moderate', 'difficult', 'too_difficult'
    patient_notes TEXT,
    device_data JSONB, -- Data from wearables/apps
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rtm_billing_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    program_id UUID REFERENCES patient_hep_programs(id) ON DELETE CASCADE,
    therapist_id UUID REFERENCES rehabilitation_providers(id) ON DELETE CASCADE,
    billing_month DATE NOT NULL,
    total_days_monitored INT,
    total_interactive_minutes INT,
    setup_completed BOOLEAN DEFAULT false,
    device_supplied BOOLEAN DEFAULT false,
    data_transmission_confirmed BOOLEAN DEFAULT false,
    cpt_code VARCHAR(10), -- 98975, 98976, 98977, 98980, 98981
    billed BOOLEAN DEFAULT false,
    billing_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- PIHP, CITY HEALTH DEPARTMENT, AND PUBLIC HEALTH PORTALS
-- ============================================================================

CREATE TABLE IF NOT EXISTS pihp_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pihp_name VARCHAR(255) NOT NULL,
    user_email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(100),
    authorized_regions TEXT[],
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pihp_data_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    pihp_user_id UUID REFERENCES pihp_users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    request_type VARCHAR(100), -- 'mental_health_data', 'sud_data', 'otp_compliance'
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    request_date TIMESTAMP DEFAULT NOW(),
    date_range_start DATE,
    date_range_end DATE,
    purpose TEXT,
    legal_authority TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'denied', 'completed'
    approved_by UUID REFERENCES staff(id) ON DELETE SET NULL,
    approval_date TIMESTAMP,
    data_provided JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS health_dept_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_name VARCHAR(255) NOT NULL,
    user_email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(100),
    jurisdiction VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS immunization_registry_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    report_date DATE NOT NULL,
    reporting_period_start DATE,
    reporting_period_end DATE,
    total_vaccines_administered INT,
    vaccines_by_type JSONB,
    patients_vaccinated INT,
    report_data JSONB,
    submitted_to_state BOOLEAN DEFAULT false,
    submission_date TIMESTAMP,
    state_confirmation_number VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS communicable_disease_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    disease_name VARCHAR(255) NOT NULL,
    diagnosis_date DATE NOT NULL,
    reported_date DATE NOT NULL,
    reported_by UUID REFERENCES staff(id) ON DELETE SET NULL,
    case_status VARCHAR(50), -- 'suspected', 'probable', 'confirmed'
    investigation_status VARCHAR(50),
    public_health_notified BOOLEAN DEFAULT false,
    notification_date DATE,
    case_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- COUNTY HEALTH SYSTEM TABLES
-- ============================================================================

CREATE TABLE IF NOT EXISTS county_health_programs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    program_name VARCHAR(255) NOT NULL, -- 'WIC', 'Immunizations', 'STI', 'TB', 'Maternal_Health'
    program_type VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    contact_person VARCHAR(255),
    contact_phone VARCHAR(20),
    location TEXT,
    hours_of_operation TEXT,
    eligibility_criteria TEXT,
    fee_schedule JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wic_enrollments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    enrollment_date DATE NOT NULL,
    category VARCHAR(50), -- 'pregnant', 'postpartum', 'breastfeeding', 'infant', 'child'
    due_date DATE,
    income_verified BOOLEAN DEFAULT false,
    medicaid_recipient BOOLEAN DEFAULT false,
    voucher_amount DECIMAL(10,2),
    recertification_date DATE,
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wic_nutrition_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    wic_enrollment_id UUID REFERENCES wic_enrollments(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    assessment_date DATE NOT NULL,
    height DECIMAL(5,2),
    weight DECIMAL(5,2),
    hemoglobin DECIMAL(4,1),
    nutritional_risk_factors TEXT[],
    dietary_assessment TEXT,
    counseling_provided TEXT,
    goals_set TEXT,
    next_appointment DATE,
    counselor_id UUID REFERENCES staff(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sti_clinic_visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    visit_date DATE NOT NULL,
    chief_complaint TEXT,
    sexual_history JSONB,
    risk_assessment TEXT,
    tests_ordered TEXT[],
    test_results JSONB,
    diagnosis_codes TEXT[],
    treatment_provided TEXT,
    partner_notification_needed BOOLEAN DEFAULT false,
    partner_notification_completed BOOLEAN DEFAULT false,
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date DATE,
    confidential BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tb_cases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    case_number VARCHAR(50) UNIQUE,
    diagnosis_date DATE NOT NULL,
    case_type VARCHAR(50), -- 'active', 'latent'
    treatment_start_date DATE,
    treatment_regimen TEXT,
    dot_required BOOLEAN DEFAULT true, -- Directly Observed Therapy
    case_manager_id UUID REFERENCES staff(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'completed', 'ltfu', 'transferred'
    completion_date DATE,
    contact_investigation_completed BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS tb_dot_visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tb_case_id UUID REFERENCES tb_cases(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    visit_date DATE NOT NULL,
    visit_time TIME,
    location VARCHAR(100),
    medications_given TEXT[],
    directly_observed BOOLEAN DEFAULT true,
    side_effects TEXT,
    patient_compliance VARCHAR(50),
    next_visit_date DATE,
    staff_id UUID REFERENCES staff(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS maternal_child_health_visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    visit_type VARCHAR(100), -- 'prenatal', 'postpartum', 'well_child', 'family_planning'
    visit_date DATE NOT NULL,
    gestational_age_weeks INT,
    prenatal_risk_factors TEXT[],
    infant_age_months INT,
    developmental_milestones JSONB,
    immunizations_given TEXT[],
    education_topics TEXT[],
    referrals_made TEXT[],
    home_visit BOOLEAN DEFAULT false,
    next_visit_date DATE,
    case_manager_id UUID REFERENCES staff(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS environmental_health_inspections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    facility_name VARCHAR(255) NOT NULL,
    facility_type VARCHAR(100), -- 'restaurant', 'school', 'daycare', 'pool', 'housing'
    inspection_date DATE NOT NULL,
    inspector_id UUID REFERENCES staff(id) ON DELETE SET NULL,
    inspection_type VARCHAR(50), -- 'routine', 'complaint', 'follow-up', 're-inspection'
    violations JSONB,
    critical_violations INT,
    non_critical_violations INT,
    score INT,
    result VARCHAR(50), -- 'pass', 'conditional_pass', 'fail'
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- COUNTY HEALTH EDUCATION & TRAINING
-- ============================================================================

CREATE TABLE IF NOT EXISTS county_staff_training (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    training_title VARCHAR(255) NOT NULL,
    training_category VARCHAR(100), -- 'wic', 'immunization', 'sti', 'tb', 'maternal_health', 'environmental'
    description TEXT,
    learning_objectives TEXT[],
    content TEXT,
    duration_minutes INT,
    ceu_credits DECIMAL(3,1),
    required_for_roles TEXT[],
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS staff_training_completions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    training_id UUID REFERENCES county_staff_training(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
    completion_date DATE NOT NULL,
    score INT,
    certificate_issued BOOLEAN DEFAULT false,
    certificate_url TEXT,
    expiration_date DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS family_education_resources (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    resource_title VARCHAR(255) NOT NULL,
    resource_type VARCHAR(100), -- 'video', 'handout', 'interactive', 'quiz'
    topic VARCHAR(100), -- 'wic_nutrition', 'immunizations', 'prenatal_care', 'child_development'
    target_audience TEXT[],
    language VARCHAR(50) DEFAULT 'English',
    content TEXT,
    media_url TEXT,
    download_count INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patient_education_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    resource_id UUID REFERENCES family_education_resources(id) ON DELETE CASCADE,
    provided_date DATE NOT NULL,
    provided_by UUID REFERENCES staff(id) ON DELETE SET NULL,
    patient_understood BOOLEAN,
    follow_up_needed BOOLEAN DEFAULT false,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- ADVANCED INTEGRATIONS (Vonage Fax, Twilio, PDMP)
-- ============================================================================

CREATE TABLE IF NOT EXISTS integration_configuration (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    integration_name VARCHAR(100) NOT NULL, -- 'vonage_fax', 'twilio', 'pdmp', 'surescripts', 'parachute', 'verse'
    is_enabled BOOLEAN DEFAULT false,
    api_key TEXT,
    api_secret TEXT,
    endpoint_url TEXT,
    configuration JSONB,
    last_sync TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(organization_id, integration_name)
);

CREATE TABLE IF NOT EXISTS fax_inbox (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    fax_number VARCHAR(20),
    sender_fax_number VARCHAR(20),
    received_at TIMESTAMP DEFAULT NOW(),
    page_count INT,
    file_url TEXT,
    file_size_kb INT,
    status VARCHAR(50) DEFAULT 'unread', -- 'unread', 'read', 'processed', 'archived'
    assigned_to UUID REFERENCES staff(id) ON DELETE SET NULL,
    patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
    document_type VARCHAR(100), -- 'medical_records', 'lab_results', 'referral', 'prior_auth', 'other'
    ai_extracted_data JSONB,
    ai_confidence_score DECIMAL(3,2),
    processed_by_ai BOOLEAN DEFAULT false,
    processed_date TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fax_outbox (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    recipient_fax_number VARCHAR(20) NOT NULL,
    recipient_name VARCHAR(255),
    sent_by UUID REFERENCES staff(id) ON DELETE SET NULL,
    sent_at TIMESTAMP DEFAULT NOW(),
    page_count INT,
    file_url TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'sent', 'delivered', 'failed'
    delivery_confirmation VARCHAR(100),
    patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
    document_type VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sms_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    direction VARCHAR(20), -- 'inbound', 'outbound'
    phone_number VARCHAR(20),
    message_body TEXT,
    sent_at TIMESTAMP DEFAULT NOW(),
    delivered BOOLEAN DEFAULT false,
    delivery_status VARCHAR(50),
    status VARCHAR(50) DEFAULT 'sent',
    twilio_message_id VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS appointment_reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    reminder_type VARCHAR(50), -- 'sms', 'email', 'call'
    scheduled_send_time TIMESTAMP NOT NULL,
    sent_at TIMESTAMP,
    status VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'sent', 'delivered', 'failed', 'cancelled'
    message_content TEXT,
    patient_confirmed BOOLEAN DEFAULT false,
    confirmation_time TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pdmp_queries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    queried_by UUID REFERENCES providers(id) ON DELETE CASCADE,
    query_date TIMESTAMP DEFAULT NOW(),
    state VARCHAR(2),
    query_reason VARCHAR(100),
    results JSONB,
    red_flags TEXT[],
    risk_level VARCHAR(50), -- 'low', 'moderate', 'high'
    action_taken TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_document_processing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    source_type VARCHAR(50), -- 'fax', 'upload', 'scan'
    source_id UUID, -- References fax_inbox.id or other source
    document_type VARCHAR(100),
    file_url TEXT,
    processing_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    ocr_text TEXT,
    extracted_data JSONB,
    confidence_score DECIMAL(3,2),
    patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
    auto_filed BOOLEAN DEFAULT false,
    filed_location VARCHAR(255),
    requires_review BOOLEAN DEFAULT true,
    reviewed_by UUID REFERENCES staff(id) ON DELETE SET NULL,
    reviewed_date TIMESTAMP,
    processing_time_ms INT,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- MIPS QUALITY MEASURES & CLINICAL DECISION SUPPORT
-- ============================================================================

CREATE TABLE IF NOT EXISTS quality_measures (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    measure_id VARCHAR(20) UNIQUE NOT NULL,
    measure_name VARCHAR(255) NOT NULL,
    measure_type VARCHAR(50), -- 'process', 'outcome', 'structure'
    specialty VARCHAR(100),
    description TEXT,
    numerator_criteria TEXT,
    denominator_criteria TEXT,
    exclusion_criteria TEXT,
    high_priority BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quality_measure_tracking (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    measure_id UUID REFERENCES quality_measures(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    reporting_year INT NOT NULL,
    in_denominator BOOLEAN DEFAULT false,
    in_numerator BOOLEAN DEFAULT false,
    excluded BOOLEAN DEFAULT false,
    exclusion_reason TEXT,
    performance_met BOOLEAN DEFAULT false,
    encounter_id UUID REFERENCES encounters(id) ON DELETE SET NULL,
    recorded_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clinical_decision_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    rule_name VARCHAR(255) NOT NULL,
    rule_type VARCHAR(100), -- 'drug_interaction', 'allergy', 'duplicate_therapy', 'preventive_care'
    severity VARCHAR(50), -- 'critical', 'warning', 'info'
    condition TEXT NOT NULL,
    alert_message TEXT NOT NULL,
    recommendation TEXT,
    evidence_source TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS clinical_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    alert_type VARCHAR(100),
    severity VARCHAR(50),
    alert_message TEXT NOT NULL,
    triggered_by VARCHAR(255), -- What action triggered the alert
    rule_id UUID REFERENCES clinical_decision_rules(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'acknowledged', 'dismissed', 'resolved'
    acknowledged_by UUID REFERENCES staff(id) ON DELETE SET NULL,
    acknowledged_at TIMESTAMP,
    resolution_notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- INSURANCE VERIFICATION & PRIOR AUTHORIZATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS insurance_verifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    verification_date TIMESTAMP DEFAULT NOW(),
    payer_name VARCHAR(255),
    policy_number VARCHAR(100),
    group_number VARCHAR(100),
    verification_method VARCHAR(50), -- 'real_time', 'manual', 'phone'
    eligibility_status VARCHAR(50), -- 'active', 'inactive', 'unknown'
    coverage_start_date DATE,
    coverage_end_date DATE,
    copay_amount DECIMAL(10,2),
    deductible_amount DECIMAL(10,2),
    deductible_met_amount DECIMAL(10,2),
    out_of_pocket_max DECIMAL(10,2),
    out_of_pocket_met DECIMAL(10,2),
    benefits JSONB,
    verified_by UUID REFERENCES staff(id) ON DELETE SET NULL,
    next_verification_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prior_authorizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES providers(id) ON DELETE CASCADE,
    service_type VARCHAR(100), -- 'medication', 'procedure', 'dme', 'imaging', 'specialist_referral'
    requested_service TEXT NOT NULL,
    procedure_codes TEXT[],
    diagnosis_codes TEXT[],
    request_date DATE NOT NULL,
    urgency VARCHAR(50) DEFAULT 'routine', -- 'routine', 'urgent', 'emergent'
    payer_name VARCHAR(255),
    authorization_number VARCHAR(100),
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'denied', 'expired'
    approved_date DATE,
    approval_start_date DATE,
    approval_end_date DATE,
    approved_units INT,
    denial_reason TEXT,
    appeal_filed BOOLEAN DEFAULT false,
    appeal_date DATE,
    clinical_notes TEXT,
    submitted_by UUID REFERENCES staff(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- STAFF EDUCATION & PROVIDER COLLABORATION
-- ============================================================================

CREATE TABLE IF NOT EXISTS training_modules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    module_title VARCHAR(255) NOT NULL,
    category VARCHAR(100), -- 'clinical', 'compliance', 'billing', 'technology'
    description TEXT,
    content TEXT,
    video_url TEXT,
    duration_minutes INT,
    required_for_roles TEXT[],
    ceu_credits DECIMAL(3,1),
    created_by UUID REFERENCES staff(id) ON DELETE SET NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS staff_training_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
    training_module_id UUID REFERENCES training_modules(id) ON DELETE CASCADE,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    progress_percentage INT DEFAULT 0,
    quiz_score INT,
    passed BOOLEAN DEFAULT false,
    certificate_url TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS regulatory_updates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    update_title VARCHAR(255) NOT NULL,
    agency VARCHAR(100), -- 'SAMHSA', 'DEA', 'CMS', 'FDA', 'State'
    category VARCHAR(100),
    effective_date DATE,
    summary TEXT,
    full_content TEXT,
    document_url TEXT,
    action_required TEXT,
    deadline DATE,
    acknowledged_by JSONB, -- Array of staff_ids who acknowledged
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS provider_collaboration_network (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider_name VARCHAR(255) NOT NULL,
    organization_name VARCHAR(255),
    specialty VARCHAR(100),
    npi VARCHAR(10),
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    accepts_medicaid BOOLEAN DEFAULT false,
    accepts_uninsured BOOLEAN DEFAULT false,
    services_offered TEXT[],
    avg_wait_time_days INT,
    is_preferred BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS community_referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    referring_provider UUID REFERENCES providers(id) ON DELETE CASCADE,
    community_provider_id UUID REFERENCES provider_collaboration_network(id) ON DELETE SET NULL,
    referral_date DATE NOT NULL,
    referral_reason TEXT,
    service_needed VARCHAR(255),
    urgency VARCHAR(50) DEFAULT 'routine',
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'accepted', 'declined', 'completed'
    appointment_scheduled BOOLEAN DEFAULT false,
    appointment_date DATE,
    consent_signed BOOLEAN DEFAULT false,
    records_sent BOOLEAN DEFAULT false,
    follow_up_received BOOLEAN DEFAULT false,
    outcome TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- CHW (COMMUNITY HEALTH WORKER) ENCOUNTERS
-- ============================================================================

CREATE TABLE IF NOT EXISTS chw_staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    staff_id UUID REFERENCES staff(id) ON DELETE CASCADE,
    certification_number VARCHAR(50),
    certification_expiration DATE,
    languages_spoken TEXT[],
    service_area VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chw_encounters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    chw_id UUID REFERENCES chw_staff(id) ON DELETE CASCADE,
    encounter_date DATE NOT NULL,
    encounter_type VARCHAR(100), -- 'home_visit', 'phone', 'community', 'clinic'
    location TEXT,
    duration_minutes INT,
    services_provided TEXT[],
    sdoh_screening JSONB,
    referrals_made TEXT[],
    barriers_identified TEXT[],
    action_plan TEXT,
    follow_up_needed BOOLEAN DEFAULT false,
    follow_up_date DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chw_sdoh_assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    chw_encounter_id UUID REFERENCES chw_encounters(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    assessment_date DATE NOT NULL,
    housing_stability VARCHAR(50),
    food_security VARCHAR(50),
    transportation VARCHAR(50),
    utility_assistance_needed BOOLEAN,
    employment_status VARCHAR(50),
    financial_strain VARCHAR(50),
    social_isolation VARCHAR(50),
    safety_concerns TEXT,
    resources_provided TEXT[],
    created_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- WAITLIST & OCCUPANCY MANAGEMENT
-- ============================================================================

CREATE TABLE IF NOT EXISTS appointment_waitlist (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    provider_id UUID REFERENCES providers(id) ON DELETE SET NULL,
    appointment_type VARCHAR(100),
    preferred_days TEXT[], -- ['Monday', 'Wednesday', 'Friday']
    preferred_times TEXT[], -- ['morning', 'afternoon', 'evening']
    priority VARCHAR(50) DEFAULT 'routine', -- 'urgent', 'routine', 'flexible'
    added_date DATE NOT NULL DEFAULT CURRENT_DATE,
    reason TEXT,
    notified_count INT DEFAULT 0,
    last_notified_date DATE,
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'scheduled', 'removed'
    scheduled_appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS facility_rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    room_number VARCHAR(50) NOT NULL,
    room_type VARCHAR(100), -- 'private', 'semi_private', 'exam', 'treatment', 'observation'
    bed_count INT DEFAULT 1,
    floor INT,
    wing VARCHAR(50),
    amenities TEXT[],
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bed_assignments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    room_id UUID REFERENCES facility_rooms(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    admission_date TIMESTAMP NOT NULL DEFAULT NOW(),
    discharge_date TIMESTAMP,
    admission_type VARCHAR(100),
    status VARCHAR(50) DEFAULT 'occupied', -- 'occupied', 'discharged', 'transferred'
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- CHART CHECK & COMPLIANCE TRACKING
-- ============================================================================

CREATE TABLE IF NOT EXISTS chart_requirements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    requirement_name VARCHAR(255) NOT NULL,
    requirement_type VARCHAR(100), -- 'admission', 'annual', 'quarterly', 'as_needed'
    applies_to_programs TEXT[], -- ['OTP', 'Outpatient', 'All']
    description TEXT,
    frequency_days INT,
    is_mandatory BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patient_chart_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    requirement_id UUID REFERENCES chart_requirements(id) ON DELETE CASCADE,
    due_date DATE NOT NULL,
    completed_date DATE,
    completed_by UUID REFERENCES staff(id) ON DELETE SET NULL,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'completed', 'overdue', 'not_applicable'
    document_url TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Patient indexes
CREATE INDEX IF NOT EXISTS idx_patients_organization ON patients(organization_id);
CREATE INDEX IF NOT EXISTS idx_patients_mrn ON patients(mrn);
CREATE INDEX IF NOT EXISTS idx_patients_dob ON patients(date_of_birth);
CREATE INDEX IF NOT EXISTS idx_patients_name ON patients(last_name, first_name);

-- Appointments & Encounters
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_provider ON appointments(provider_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_encounters_patient ON encounters(patient_id);
CREATE INDEX IF NOT EXISTS idx_encounters_provider ON encounters(provider_id);
CREATE INDEX IF NOT EXISTS idx_encounters_date ON encounters(encounter_date);

-- Medications
CREATE INDEX IF NOT EXISTS idx_medications_patient ON medications(patient_id);
CREATE INDEX IF NOT EXISTS idx_medications_status ON medications(status);

-- Claims & Billing
CREATE INDEX IF NOT EXISTS idx_claims_patient ON claims(patient_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON claims(status);

-- OTP/MAT
CREATE INDEX IF NOT EXISTS idx_dosing_log_patient ON dosing_log(patient_id);
CREATE INDEX IF NOT EXISTS idx_dosing_log_date ON dosing_log(dose_date);
CREATE INDEX IF NOT EXISTS idx_uds_patient ON urine_drug_screens(patient_id);
CREATE INDEX IF NOT EXISTS idx_uds_date ON urine_drug_screens(collection_date);

-- Vaccinations
CREATE INDEX IF NOT EXISTS idx_vaccinations_patient ON vaccinations(patient_id);
CREATE INDEX IF NOT EXISTS idx_vaccinations_date ON vaccinations(administration_date);

-- HIE Network
CREATE INDEX IF NOT EXISTS idx_hie_consents_patient ON hie_patient_consents(patient_id);
CREATE INDEX IF NOT EXISTS idx_hie_requests_patient ON hie_data_requests(patient_id);

-- Multi-tenant
CREATE INDEX IF NOT EXISTS idx_user_accounts_org ON user_accounts(organization_id);
CREATE INDEX IF NOT EXISTS idx_user_accounts_email ON user_accounts(email);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE encounters ENABLE ROW LEVEL SECURITY;
ALTER TABLE medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE claims ENABLE ROW LEVEL SECURITY;

-- Example RLS policy for patients (you'll need to adjust based on your auth setup)
-- CREATE POLICY patient_org_isolation ON patients
--   USING (organization_id = current_setting('app.current_org_id')::UUID);

-- ============================================================================
-- COMPLETION MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'MASE BEHAVIORAL HEALTH EMR DATABASE SETUP COMPLETE!';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Total Tables Created: 100+';
  RAISE NOTICE 'Features Enabled:';
  RAISE NOTICE '  - Multi-Tenant System with Super Admin';
  RAISE NOTICE '  - 13 Medical Specialties';
  RAISE NOTICE '  - OTP/MAT Programs';
  RAISE NOTICE '  - Vaccinations & Public Health';
  RAISE NOTICE '  - DME, Toxicology, Rehabilitation';
  RAISE NOTICE '  - Home Exercise Programs (HEP) with RTM';
  RAISE NOTICE '  - PIHP & Health Department Portals';
  RAISE NOTICE '  - County Health System';
  RAISE NOTICE '  - MASE HIE Network';
  RAISE NOTICE '  - Advanced Integrations (Vonage, Twilio, PDMP)';
  RAISE NOTICE '  - MIPS Quality Measures';
  RAISE NOTICE '  - Clinical Decision Support';
  RAISE NOTICE '  - Insurance Verification';
  RAISE NOTICE '  - Staff Education & Training';
  RAISE NOTICE '  - AI Document Processing';
  RAISE NOTICE '============================================================================';
  RAISE NOTICE 'Next Steps:';
  RAISE NOTICE '1. Login as Super Admin: admin@mase-emr.com / Admin@123';
  RAISE NOTICE '2. Create your first clinic through onboarding';
  RAISE NOTICE '3. Configure integrations in Settings';
  RAISE NOTICE '============================================================================';
END $$;
