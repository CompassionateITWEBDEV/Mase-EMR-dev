-- MASE EMR: DME Suppliers, Toxicology Labs, and Rehabilitation Services
-- Creates comprehensive system for equipment orders, drug screening, and therapy documentation

-- ============================================================================
-- DME (Durable Medical Equipment) Suppliers System
-- ============================================================================

CREATE TABLE IF NOT EXISTS dme_suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    supplier_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(255),
    fax VARCHAR(20),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(2),
    zip VARCHAR(10),
    npi VARCHAR(10),
    tax_id VARCHAR(20),
    medicare_supplier_number VARCHAR(50),
    accreditation_status VARCHAR(50), -- 'Accredited', 'Pending', 'Expired'
    accreditation_body VARCHAR(100), -- 'ACHC', 'Joint Commission', 'CHAP'
    specialties TEXT[], -- Array: 'Mobility', 'Respiratory', 'Diabetic', 'Wound Care'
    insurance_accepted TEXT[], -- Array of insurance plan IDs
    delivery_area TEXT[], -- Array of zip codes
    turnaround_time_days INTEGER,
    preferred_status BOOLEAN DEFAULT false,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dme_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    patient_id UUID REFERENCES patients(id),
    provider_id UUID REFERENCES providers(id),
    supplier_id UUID REFERENCES dme_suppliers(id),
    order_date DATE NOT NULL,
    order_number VARCHAR(50) UNIQUE,
    urgency VARCHAR(20), -- 'Routine', 'Urgent', 'Emergency'
    
    -- Equipment Details
    equipment_category VARCHAR(100), -- 'Mobility', 'Respiratory', 'Diabetic', 'CPAP', 'Wound Care'
    equipment_name VARCHAR(255) NOT NULL,
    hcpcs_code VARCHAR(20), -- E0601, E0676, etc.
    quantity INTEGER DEFAULT 1,
    duration_months INTEGER,
    rental_or_purchase VARCHAR(20), -- 'Rental', 'Purchase', 'Rent-to-Own'
    
    -- Clinical Justification
    diagnosis_codes TEXT[], -- Array of ICD-10 codes
    clinical_indication TEXT,
    medical_necessity_notes TEXT,
    
    -- Insurance & Authorization
    insurance_plan_id UUID,
    prior_auth_required BOOLEAN DEFAULT false,
    prior_auth_number VARCHAR(50),
    prior_auth_status VARCHAR(50), -- 'Pending', 'Approved', 'Denied', 'Not Required'
    estimated_cost DECIMAL(10,2),
    patient_copay DECIMAL(10,2),
    
    -- Delivery & Status
    delivery_address TEXT,
    delivery_instructions TEXT,
    delivery_date DATE,
    tracking_number VARCHAR(100),
    delivery_status VARCHAR(50), -- 'Ordered', 'Processing', 'Shipped', 'Delivered', 'Completed'
    
    -- Patient Training
    training_required BOOLEAN DEFAULT false,
    training_completed_date DATE,
    training_staff_id UUID REFERENCES staff(id),
    
    status VARCHAR(20) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Toxicology Lab Integration System
-- ============================================================================

CREATE TABLE IF NOT EXISTS toxicology_labs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    lab_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(2),
    zip VARCHAR(10),
    clia_number VARCHAR(50) NOT NULL, -- Clinical Laboratory Improvement Amendments
    cap_accredited BOOLEAN DEFAULT false, -- College of American Pathologists
    samhsa_certified BOOLEAN DEFAULT false, -- Required for federal workplace testing
    
    -- Test Panels Offered
    test_panels_offered TEXT[], -- 'Basic UDS', 'Extended Panel', 'Alcohol', 'Synthetic', 'Confirmation'
    substances_tested TEXT[], -- Array of substances
    
    -- Integration Details
    hl7_endpoint VARCHAR(500), -- For automated result delivery
    api_key VARCHAR(255),
    result_delivery_method VARCHAR(50), -- 'HL7', 'API', 'Fax', 'Portal'
    average_turnaround_hours INTEGER,
    stat_available BOOLEAN DEFAULT false,
    
    -- Pricing
    insurance_accepted TEXT[],
    cash_price DECIMAL(10,2),
    
    preferred_status BOOLEAN DEFAULT false,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS toxicology_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    patient_id UUID REFERENCES patients(id),
    provider_id UUID REFERENCES providers(id),
    lab_id UUID REFERENCES toxicology_labs(id),
    
    -- Order Details
    order_date TIMESTAMPTZ NOT NULL,
    order_number VARCHAR(50) UNIQUE,
    collection_date TIMESTAMPTZ,
    collection_method VARCHAR(50), -- 'Urine', 'Oral', 'Hair', 'Blood'
    collection_staff_id UUID REFERENCES staff(id),
    
    -- Test Panel
    test_panel VARCHAR(100), -- 'Basic 5-Panel', '10-Panel', 'Extended', 'Alcohol ETG'
    substances_to_test TEXT[], -- Specific substances requested
    reason_for_testing VARCHAR(100), -- 'Routine Monitoring', 'Random', 'Reasonable Suspicion', 'Baseline'
    test_urgency VARCHAR(20), -- 'Routine', 'Stat'
    
    -- Specimen Details
    specimen_id VARCHAR(100),
    temperature_check BOOLEAN,
    specimen_integrity VARCHAR(50), -- 'Valid', 'Dilute', 'Substituted', 'Invalid'
    observed_collection BOOLEAN DEFAULT false,
    
    -- Chain of Custody
    chain_of_custody_number VARCHAR(100),
    custody_sealed BOOLEAN DEFAULT false,
    
    -- Results
    result_received_date TIMESTAMPTZ,
    overall_result VARCHAR(50), -- 'Negative', 'Positive', 'Inconclusive', 'Invalid'
    
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'collected', 'in-lab', 'resulted', 'confirmed'
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS toxicology_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES toxicology_orders(id) ON DELETE CASCADE,
    
    -- Substance Results
    substance_name VARCHAR(100) NOT NULL,
    substance_class VARCHAR(50), -- 'Opioid', 'Benzodiazepine', 'Stimulant', 'Cannabis', etc.
    result VARCHAR(20), -- 'Negative', 'Positive', 'Inconclusive'
    cutoff_level VARCHAR(50), -- '300 ng/mL'
    concentration VARCHAR(50), -- Actual detected level
    
    -- Confirmation Testing
    confirmation_required BOOLEAN DEFAULT false,
    confirmation_result VARCHAR(20),
    confirmation_method VARCHAR(50), -- 'GC/MS', 'LC/MS/MS'
    
    -- Clinical Interpretation
    expected_based_on_rx BOOLEAN, -- Is this substance prescribed?
    medication_id UUID REFERENCES medications(id),
    
    result_date TIMESTAMPTZ DEFAULT NOW(),
    reviewed_by_provider_id UUID REFERENCES providers(id),
    reviewed_date TIMESTAMPTZ,
    clinical_notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Rehabilitation Services (PT/OT/Speech Therapy)
-- ============================================================================

CREATE TABLE IF NOT EXISTS rehab_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    provider_id UUID REFERENCES providers(id), -- Link to providers table if internal
    
    -- Provider Details (if external)
    external_clinic_name VARCHAR(255),
    therapist_name VARCHAR(255) NOT NULL,
    credentials VARCHAR(100), -- 'PT, DPT', 'OTR/L', 'SLP, CCC'
    specialty_type VARCHAR(50) NOT NULL, -- 'Physical Therapy', 'Occupational Therapy', 'Speech Therapy'
    subspecialties TEXT[], -- 'Orthopedic', 'Neuro', 'Pediatric', 'Geriatric', 'Hand Therapy'
    
    phone VARCHAR(20),
    email VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    state VARCHAR(2),
    zip VARCHAR(10),
    
    license_number VARCHAR(50) NOT NULL,
    license_state VARCHAR(2),
    license_expiration DATE,
    npi VARCHAR(10),
    
    accepts_new_patients BOOLEAN DEFAULT true,
    age_groups_served TEXT[], -- 'Pediatric', 'Adult', 'Geriatric'
    languages TEXT[],
    
    preferred_status BOOLEAN DEFAULT false,
    notes TEXT,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rehab_referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    patient_id UUID REFERENCES patients(id),
    referring_provider_id UUID REFERENCES providers(id),
    rehab_provider_id UUID REFERENCES rehab_providers(id),
    
    -- Referral Details
    referral_date DATE NOT NULL,
    referral_number VARCHAR(50) UNIQUE,
    therapy_type VARCHAR(50) NOT NULL, -- 'PT', 'OT', 'Speech'
    urgency VARCHAR(20), -- 'Routine', 'Urgent'
    
    -- Clinical Information
    diagnosis_codes TEXT[] NOT NULL,
    primary_complaint TEXT,
    onset_date DATE,
    mechanism_of_injury TEXT,
    surgical_history TEXT,
    current_medications TEXT,
    precautions TEXT, -- 'Weight-bearing restrictions', 'Cardiac precautions'
    
    -- Functional Status
    current_functional_level TEXT,
    prior_functional_level TEXT,
    functional_goals TEXT,
    
    -- Treatment Plan
    requested_frequency VARCHAR(50), -- '3x/week', '2x/week'
    requested_duration VARCHAR(50), -- '4 weeks', '8 weeks'
    specific_requests TEXT,
    
    -- Authorization
    insurance_plan_id UUID,
    prior_auth_required BOOLEAN DEFAULT false,
    prior_auth_number VARCHAR(50),
    authorized_visits INTEGER,
    
    -- Status & Follow-up
    referral_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'scheduled', 'in-progress', 'completed', 'discontinued'
    first_appointment_date DATE,
    last_visit_date DATE,
    discharge_date DATE,
    
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rehab_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referral_id UUID REFERENCES rehab_referrals(id),
    patient_id UUID REFERENCES patients(id),
    therapist_id UUID REFERENCES rehab_providers(id),
    
    -- Evaluation Details
    evaluation_date DATE NOT NULL,
    evaluation_type VARCHAR(50), -- 'Initial', 'Re-evaluation', 'Discharge'
    
    -- Subjective
    chief_complaint TEXT,
    patient_goals TEXT,
    pain_level INTEGER, -- 0-10 scale
    pain_location TEXT,
    aggravating_factors TEXT,
    relieving_factors TEXT,
    
    -- Objective Assessments
    range_of_motion JSONB, -- {joint: {flexion: 90, extension: 0}}
    strength_testing JSONB, -- {muscle_group: '4/5'}
    balance_assessment TEXT,
    gait_analysis TEXT,
    functional_mobility_tests JSONB,
    
    -- For OT: ADL Assessment
    adl_scores JSONB, -- Activities of Daily Living scores
    iadl_scores JSONB, -- Instrumental ADLs
    cognitive_assessment TEXT,
    
    -- For Speech: Communication Assessment
    speech_intelligibility VARCHAR(50),
    language_comprehension TEXT,
    swallowing_assessment TEXT,
    
    -- Assessment & Plan
    clinical_impression TEXT,
    short_term_goals TEXT,
    long_term_goals TEXT,
    treatment_plan TEXT,
    frequency_duration VARCHAR(100),
    prognosis VARCHAR(50), -- 'Good', 'Fair', 'Poor', 'Excellent'
    
    -- Progress (for follow-up evals)
    progress_toward_goals TEXT,
    barriers_to_progress TEXT,
    
    therapist_signature VARCHAR(255),
    evaluation_status VARCHAR(20) DEFAULT 'draft',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rehab_treatment_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referral_id UUID REFERENCES rehab_referrals(id),
    patient_id UUID REFERENCES patients(id),
    therapist_id UUID REFERENCES rehab_providers(id),
    
    -- Visit Details
    treatment_date DATE NOT NULL,
    session_number INTEGER,
    session_duration_minutes INTEGER,
    
    -- Subjective
    patient_report TEXT,
    pain_level_pre INTEGER, -- 0-10
    pain_level_post INTEGER,
    
    -- Interventions Provided
    interventions_performed TEXT[], -- 'Therapeutic Exercise', 'Manual Therapy', 'Modalities'
    exercises_assigned TEXT,
    home_exercise_program_updated BOOLEAN DEFAULT false,
    
    -- Objective Response
    patient_response TEXT,
    functional_improvements TEXT,
    
    -- Assessment & Plan
    progress_status VARCHAR(50), -- 'Progressing as expected', 'Plateau', 'Regression'
    plan_for_next_visit TEXT,
    continue_current_plan BOOLEAN DEFAULT true,
    
    -- Billing
    cpt_codes TEXT[], -- '97110', '97140', '97530'
    billable_units INTEGER,
    
    therapist_signature VARCHAR(255),
    note_status VARCHAR(20) DEFAULT 'draft',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- Indexes for Performance
-- ============================================================================

CREATE INDEX idx_dme_orders_patient ON dme_orders(patient_id);
CREATE INDEX idx_dme_orders_status ON dme_orders(status);
CREATE INDEX idx_tox_orders_patient ON toxicology_orders(patient_id);
CREATE INDEX idx_tox_orders_status ON toxicology_orders(status);
CREATE INDEX idx_tox_results_order ON toxicology_results(order_id);
CREATE INDEX idx_rehab_referrals_patient ON rehab_referrals(patient_id);
CREATE INDEX idx_rehab_referrals_status ON rehab_referrals(referral_status);
CREATE INDEX idx_rehab_evals_referral ON rehab_evaluations(referral_id);
CREATE INDEX idx_rehab_notes_referral ON rehab_treatment_notes(referral_id);

-- ============================================================================
-- Add to HIE Network for Data Sharing
-- ============================================================================

-- Allow DME orders to be shared across HIE
ALTER TABLE dme_orders ADD COLUMN IF NOT EXISTS shared_on_hie BOOLEAN DEFAULT false;
ALTER TABLE dme_orders ADD COLUMN IF NOT EXISTS hie_shared_date TIMESTAMPTZ;

-- Allow tox results to be shared (with patient consent)
ALTER TABLE toxicology_results ADD COLUMN IF NOT EXISTS shared_on_hie BOOLEAN DEFAULT false;
ALTER TABLE toxicology_results ADD COLUMN IF NOT EXISTS hie_shared_date TIMESTAMPTZ;

-- Allow rehab progress to be shared
ALTER TABLE rehab_treatment_notes ADD COLUMN IF NOT EXISTS shared_on_hie BOOLEAN DEFAULT false;
ALTER TABLE rehab_treatment_notes ADD COLUMN IF NOT EXISTS hie_shared_date TIMESTAMPTZ;
