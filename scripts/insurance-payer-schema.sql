-- Insurance Payers and Billing Management Schema
-- Version 1.0

-- Insurance Payers table
CREATE TABLE IF NOT EXISTS insurance_payers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payer_name VARCHAR(255) NOT NULL,
    payer_id VARCHAR(50) UNIQUE NOT NULL, -- Insurance company ID
    contact_name VARCHAR(255),
    contact_phone VARCHAR(20),
    contact_email VARCHAR(255),
    billing_address TEXT,
    electronic_payer_id VARCHAR(50), -- For electronic claims
    claim_submission_method VARCHAR(50) DEFAULT 'electronic', -- electronic, paper, both
    prior_auth_required BOOLEAN DEFAULT false,
    copay_required BOOLEAN DEFAULT false,
    deductible_applies BOOLEAN DEFAULT true,
    network_type VARCHAR(50), -- in-network, out-of-network, both
    claim_timely_filing_days INTEGER DEFAULT 365,
    appeal_timely_filing_days INTEGER DEFAULT 180,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Patient Insurance table (linking patients to their insurance)
CREATE TABLE IF NOT EXISTS patient_insurance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    payer_id UUID NOT NULL REFERENCES insurance_payers(id),
    policy_number VARCHAR(100) NOT NULL,
    group_number VARCHAR(100),
    subscriber_name VARCHAR(255),
    subscriber_dob DATE,
    relationship_to_subscriber VARCHAR(50) DEFAULT 'self', -- self, spouse, child, other
    effective_date DATE NOT NULL,
    termination_date DATE,
    copay_amount DECIMAL(10,2),
    deductible_amount DECIMAL(10,2),
    deductible_met_amount DECIMAL(10,2) DEFAULT 0,
    out_of_pocket_max DECIMAL(10,2),
    out_of_pocket_met DECIMAL(10,2) DEFAULT 0,
    priority_order INTEGER DEFAULT 1, -- 1=primary, 2=secondary, etc.
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(patient_id, priority_order, is_active)
);

-- Claims table for billing management
CREATE TABLE IF NOT EXISTS insurance_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_number VARCHAR(100) UNIQUE NOT NULL,
    patient_id UUID NOT NULL REFERENCES patients(id),
    payer_id UUID NOT NULL REFERENCES insurance_payers(id),
    patient_insurance_id UUID NOT NULL REFERENCES patient_insurance(id),
    provider_id UUID NOT NULL REFERENCES providers(id),
    service_date DATE NOT NULL,
    submission_date DATE,
    claim_type VARCHAR(50) DEFAULT 'professional', -- professional, institutional
    claim_status VARCHAR(50) DEFAULT 'pending', -- pending, submitted, paid, denied, appealed
    total_charges DECIMAL(10,2) NOT NULL,
    allowed_amount DECIMAL(10,2),
    paid_amount DECIMAL(10,2),
    patient_responsibility DECIMAL(10,2),
    denial_reason TEXT,
    appeal_date DATE,
    appeal_status VARCHAR(50),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- NPI and License Verification tables
CREATE TABLE IF NOT EXISTS provider_npi_verification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES providers(id),
    npi_number VARCHAR(10) NOT NULL, -- NPI is always 10 digits
    npi_type INTEGER NOT NULL CHECK (npi_type IN (1, 2)), -- 1=Individual, 2=Organization
    verification_status VARCHAR(50) DEFAULT 'pending', -- pending, verified, invalid, expired
    verification_date DATE,
    verification_source VARCHAR(100), -- NPPES, manual, etc.
    provider_name_on_npi VARCHAR(255),
    taxonomy_code VARCHAR(10),
    taxonomy_description TEXT,
    practice_address TEXT,
    phone_number VARCHAR(20),
    last_updated_npi DATE, -- Last update in NPPES
    deactivation_date DATE,
    reactivation_date DATE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(provider_id, npi_number)
);

-- License verification tracking
CREATE TABLE IF NOT EXISTS provider_license_verification (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES providers(id),
    license_number VARCHAR(100) NOT NULL,
    license_type VARCHAR(100) NOT NULL, -- MD, DO, NP, PA, etc.
    issuing_state VARCHAR(2) NOT NULL, -- State code
    issue_date DATE,
    expiration_date DATE NOT NULL,
    verification_status VARCHAR(50) DEFAULT 'pending', -- pending, verified, expired, suspended, revoked
    verification_date DATE,
    verification_source VARCHAR(100), -- State board website, manual, etc.
    disciplinary_actions TEXT,
    restrictions TEXT,
    renewal_required_by DATE,
    cme_requirements TEXT,
    last_verification_attempt DATE,
    next_verification_due DATE,
    auto_verify_enabled BOOLEAN DEFAULT true,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(provider_id, license_number, issuing_state)
);

-- Billing center configuration
CREATE TABLE IF NOT EXISTS billing_center_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    facility_name VARCHAR(255) NOT NULL,
    facility_npi VARCHAR(10) NOT NULL,
    facility_tax_id VARCHAR(20) NOT NULL,
    billing_address TEXT NOT NULL,
    contact_phone VARCHAR(20),
    contact_email VARCHAR(255),
    clearinghouse_name VARCHAR(255),
    clearinghouse_id VARCHAR(100),
    default_place_of_service VARCHAR(2) DEFAULT '11', -- Office
    claim_frequency VARCHAR(10) DEFAULT 'daily', -- daily, weekly, monthly
    auto_submit_claims BOOLEAN DEFAULT false,
    require_prior_auth_check BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_insurance_payers_active ON insurance_payers(is_active);
CREATE INDEX IF NOT EXISTS idx_patient_insurance_patient ON patient_insurance(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_insurance_active ON patient_insurance(is_active, priority_order);
CREATE INDEX IF NOT EXISTS idx_claims_patient ON insurance_claims(patient_id);
CREATE INDEX IF NOT EXISTS idx_claims_status ON insurance_claims(claim_status);
CREATE INDEX IF NOT EXISTS idx_claims_service_date ON insurance_claims(service_date);
CREATE INDEX IF NOT EXISTS idx_npi_verification_provider ON provider_npi_verification(provider_id);
CREATE INDEX IF NOT EXISTS idx_npi_verification_status ON provider_npi_verification(verification_status);
CREATE INDEX IF NOT EXISTS idx_license_verification_provider ON provider_license_verification(provider_id);
CREATE INDEX IF NOT EXISTS idx_license_verification_expiration ON provider_license_verification(expiration_date);

-- Insert default billing center configuration
INSERT INTO billing_center_config (
    facility_name,
    facility_npi,
    facility_tax_id,
    billing_address,
    contact_phone,
    contact_email
) VALUES (
    'MASE Behavioral Health Center',
    '1234567890',
    '12-3456789',
    '123 Healthcare Drive, Medical City, MC 12345',
    '(555) 123-4567',
    'billing@masebehavioral.com'
) ON CONFLICT DO NOTHING;

-- Insert sample insurance payers
INSERT INTO insurance_payers (payer_name, payer_id, contact_phone, contact_email, electronic_payer_id, network_type) VALUES
('Blue Cross Blue Shield', 'BCBS001', '(800) 555-0001', 'provider@bcbs.com', 'BCBS', 'in-network'),
('Aetna', 'AETNA001', '(800) 555-0002', 'provider@aetna.com', 'AETNA', 'in-network'),
('UnitedHealthcare', 'UHC001', '(800) 555-0003', 'provider@uhc.com', 'UHC', 'in-network'),
('Cigna', 'CIGNA001', '(800) 555-0004', 'provider@cigna.com', 'CIGNA', 'in-network'),
('Medicare', 'MEDICARE001', '(800) 555-0005', 'provider@medicare.gov', 'MEDICARE', 'in-network'),
('Medicaid', 'MEDICAID001', '(800) 555-0006', 'provider@medicaid.gov', 'MEDICAID', 'in-network')
ON CONFLICT (payer_id) DO NOTHING;
