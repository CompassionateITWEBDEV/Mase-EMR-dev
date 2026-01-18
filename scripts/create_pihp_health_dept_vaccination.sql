-- PIHP Portal Tables
CREATE TABLE IF NOT EXISTS pihp_organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pihp_name VARCHAR(255) NOT NULL,
    pihp_code VARCHAR(50) UNIQUE NOT NULL,
    state VARCHAR(2) NOT NULL,
    region VARCHAR(100),
    contact_name VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pihp_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pihp_org_id UUID REFERENCES pihp_organizations(id),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    title VARCHAR(100),
    phone VARCHAR(20),
    role VARCHAR(50) NOT NULL, -- 'administrator', 'analyst', 'reviewer'
    permissions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pihp_access_agreements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pihp_org_id UUID REFERENCES pihp_organizations(id),
    organization_id UUID REFERENCES organizations(id),
    agreement_type VARCHAR(50) NOT NULL, -- 'mental_health', 'otp', 'sud', 'full'
    start_date DATE NOT NULL,
    end_date DATE,
    data_access_scope JSONB NOT NULL, -- What data they can access
    is_active BOOLEAN DEFAULT true,
    signed_by UUID REFERENCES user_accounts(id),
    signed_at TIMESTAMPTZ,
    agreement_document_url TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pihp_data_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pihp_user_id UUID REFERENCES pihp_users(id),
    pihp_org_id UUID REFERENCES pihp_organizations(id),
    request_type VARCHAR(50) NOT NULL, -- 'patient_roster', 'utilization', 'outcomes', 'quality_measures'
    request_description TEXT,
    date_range_start DATE NOT NULL,
    date_range_end DATE NOT NULL,
    filters JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'denied', 'completed'
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID REFERENCES user_accounts(id),
    completed_at TIMESTAMPTZ,
    denial_reason TEXT,
    data_export_url TEXT,
    records_count INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pihp_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pihp_user_id UUID REFERENCES pihp_users(id),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    patient_ids UUID[],
    ip_address INET,
    user_agent TEXT,
    action_details TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- City Health Department Tables
CREATE TABLE IF NOT EXISTS health_departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_name VARCHAR(255) NOT NULL,
    department_code VARCHAR(50) UNIQUE NOT NULL,
    jurisdiction_type VARCHAR(50) NOT NULL, -- 'city', 'county', 'state'
    jurisdiction_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    address TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS health_dept_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    health_dept_id UUID REFERENCES health_departments(id),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    title VARCHAR(100),
    phone VARCHAR(20),
    role VARCHAR(50) NOT NULL, -- 'epidemiologist', 'nurse', 'administrator', 'data_analyst'
    permissions JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS health_dept_access (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    health_dept_id UUID REFERENCES health_departments(id),
    organization_id UUID REFERENCES organizations(id),
    access_type VARCHAR(50) NOT NULL, -- 'immunizations', 'reportable_diseases', 'public_health_data', 'covid_reporting'
    start_date DATE NOT NULL,
    end_date DATE,
    data_sharing_agreement_url TEXT,
    is_active BOOLEAN DEFAULT true,
    signed_by UUID REFERENCES user_accounts(id),
    signed_at TIMESTAMPTZ,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS health_dept_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    health_dept_user_id UUID REFERENCES health_dept_users(id),
    health_dept_id UUID REFERENCES health_departments(id),
    report_type VARCHAR(50) NOT NULL, -- 'immunization_coverage', 'disease_surveillance', 'outbreak_tracking', 'vaccine_inventory'
    report_title VARCHAR(255) NOT NULL,
    date_range_start DATE NOT NULL,
    date_range_end DATE NOT NULL,
    filters JSONB DEFAULT '{}',
    status VARCHAR(50) DEFAULT 'generating',
    report_data JSONB,
    report_file_url TEXT,
    generated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vaccination Records System
CREATE TABLE IF NOT EXISTS vaccine_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    vaccine_name VARCHAR(255) NOT NULL,
    vaccine_code VARCHAR(50) NOT NULL, -- CVX code
    manufacturer VARCHAR(255),
    lot_number VARCHAR(100) NOT NULL,
    ndc_number VARCHAR(20),
    expiration_date DATE NOT NULL,
    quantity_received INTEGER NOT NULL,
    quantity_remaining INTEGER NOT NULL,
    quantity_administered INTEGER DEFAULT 0,
    quantity_wasted INTEGER DEFAULT 0,
    storage_location VARCHAR(255),
    temperature_range VARCHAR(50),
    vfc_eligible BOOLEAN DEFAULT false, -- Vaccines for Children program
    status VARCHAR(50) DEFAULT 'active', -- 'active', 'expired', 'recalled', 'depleted'
    received_date DATE NOT NULL,
    received_by UUID REFERENCES user_accounts(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patient_vaccinations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id) NOT NULL,
    vaccine_name VARCHAR(255) NOT NULL,
    vaccine_code VARCHAR(50) NOT NULL, -- CVX code
    vaccine_group VARCHAR(100), -- 'COVID-19', 'Influenza', 'Hepatitis', etc.
    dose_number INTEGER,
    total_doses_in_series INTEGER,
    manufacturer VARCHAR(255),
    lot_number VARCHAR(100),
    ndc_number VARCHAR(20),
    expiration_date DATE,
    administration_date DATE NOT NULL,
    administration_time TIME,
    administered_by UUID REFERENCES providers(id),
    administration_site VARCHAR(100), -- 'left_deltoid', 'right_deltoid', 'left_thigh', etc.
    administration_route VARCHAR(50), -- 'intramuscular', 'subcutaneous', 'intranasal', 'oral'
    dose_quantity DECIMAL(10,2),
    dose_unit VARCHAR(20),
    vis_provided BOOLEAN DEFAULT true, -- Vaccine Information Statement
    vis_date DATE,
    funding_source VARCHAR(50), -- 'private', 'vfc', 'state', 'federal'
    adverse_reaction BOOLEAN DEFAULT false,
    adverse_reaction_details TEXT,
    next_dose_due_date DATE,
    completion_status VARCHAR(50), -- 'complete', 'incomplete', 'in_progress'
    reported_to_registry BOOLEAN DEFAULT false,
    registry_reported_at TIMESTAMPTZ,
    registry_name VARCHAR(255),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vaccination_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vaccine_name VARCHAR(255) NOT NULL,
    vaccine_code VARCHAR(50) NOT NULL,
    age_group VARCHAR(50) NOT NULL, -- 'infant', 'child', 'adolescent', 'adult', 'elderly'
    recommended_age_months INTEGER,
    minimum_age_months INTEGER,
    dose_number INTEGER NOT NULL,
    total_doses INTEGER NOT NULL,
    interval_from_previous_dose_days INTEGER,
    is_required BOOLEAN DEFAULT false,
    acip_recommendation TEXT, -- CDC Advisory Committee on Immunization Practices
    contraindications JSONB,
    precautions JSONB,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS immunization_registry_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_vaccination_id UUID REFERENCES patient_vaccinations(id),
    registry_name VARCHAR(255) NOT NULL, -- State immunization registry name
    submission_type VARCHAR(50) NOT NULL, -- 'initial', 'update', 'historical'
    submission_status VARCHAR(50) DEFAULT 'pending',
    hl7_message TEXT,
    submission_date TIMESTAMPTZ DEFAULT NOW(),
    acknowledgment_received_at TIMESTAMPTZ,
    acknowledgment_code VARCHAR(50),
    error_message TEXT,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS vaccine_adverse_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_vaccination_id UUID REFERENCES patient_vaccinations(id),
    patient_id UUID REFERENCES patients(id),
    event_description TEXT NOT NULL,
    onset_date DATE NOT NULL,
    onset_time TIME,
    severity VARCHAR(50) NOT NULL, -- 'mild', 'moderate', 'severe', 'life_threatening'
    event_type VARCHAR(100), -- 'allergic_reaction', 'fever', 'injection_site_reaction', etc.
    treatment_provided TEXT,
    outcome VARCHAR(50), -- 'recovered', 'recovering', 'not_recovered', 'hospitalized', 'fatal'
    reported_to_vaers BOOLEAN DEFAULT false, -- Vaccine Adverse Event Reporting System
    vaers_id VARCHAR(100),
    vaers_reported_at TIMESTAMPTZ,
    reported_by UUID REFERENCES providers(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_pihp_data_requests_status ON pihp_data_requests(status);
CREATE INDEX IF NOT EXISTS idx_patient_vaccinations_patient_id ON patient_vaccinations(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_vaccinations_vaccine_code ON patient_vaccinations(vaccine_code);
CREATE INDEX IF NOT EXISTS idx_patient_vaccinations_admin_date ON patient_vaccinations(administration_date);
CREATE INDEX IF NOT EXISTS idx_vaccine_inventory_org_id ON vaccine_inventory(organization_id);
CREATE INDEX IF NOT EXISTS idx_vaccine_inventory_expiration ON vaccine_inventory(expiration_date);
CREATE INDEX IF NOT EXISTS idx_health_dept_reports_type ON health_dept_reports(report_type);

COMMENT ON TABLE pihp_organizations IS 'Prepaid Inpatient Health Plan organizations with access to mental health/OTP data';
COMMENT ON TABLE health_departments IS 'City, county, and state health departments for public health reporting';
COMMENT ON TABLE patient_vaccinations IS 'Complete vaccination records for patients with registry reporting';
COMMENT ON TABLE vaccine_inventory IS 'Vaccine inventory management with lot tracking and expiration monitoring';
