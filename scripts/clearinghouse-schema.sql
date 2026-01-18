-- Clearinghouse and EDI Transaction Management Schema
-- Version 1.0

-- Clearinghouse connections and configuration
CREATE TABLE IF NOT EXISTS clearinghouse_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clearinghouse_name VARCHAR(255) NOT NULL,
    clearinghouse_id VARCHAR(100) UNIQUE NOT NULL,
    connection_type VARCHAR(50) DEFAULT 'api', -- api, sftp, direct
    api_endpoint VARCHAR(500),
    api_key_encrypted TEXT,
    sftp_host VARCHAR(255),
    sftp_port INTEGER DEFAULT 22,
    sftp_username VARCHAR(100),
    sftp_password_encrypted TEXT,
    submitter_id VARCHAR(100),
    receiver_id VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    is_production BOOLEAN DEFAULT false, -- false = test mode
    last_connection_test TIMESTAMP WITH TIME ZONE,
    connection_status VARCHAR(50) DEFAULT 'pending', -- pending, connected, failed, disconnected
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- EDI transaction types and templates
CREATE TABLE IF NOT EXISTS edi_transaction_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transaction_code VARCHAR(10) NOT NULL UNIQUE, -- 837, 835, 270, 271, 276, 277, 278, 997, 999
    transaction_name VARCHAR(255) NOT NULL,
    transaction_description TEXT,
    direction VARCHAR(20) NOT NULL, -- outbound, inbound, bidirectional
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Batch claim submissions
CREATE TABLE IF NOT EXISTS claim_batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    batch_number VARCHAR(100) UNIQUE NOT NULL,
    clearinghouse_id UUID NOT NULL REFERENCES clearinghouse_connections(id),
    batch_type VARCHAR(50) DEFAULT '837P', -- 837P (Professional), 837I (Institutional)
    submission_method VARCHAR(50) DEFAULT 'electronic', -- electronic, paper
    total_claims INTEGER DEFAULT 0,
    total_charges DECIMAL(12,2) DEFAULT 0,
    batch_status VARCHAR(50) DEFAULT 'pending', -- pending, submitted, acknowledged, rejected, processed
    created_by UUID REFERENCES providers(id),
    submitted_at TIMESTAMP WITH TIME ZONE,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    acknowledgment_code VARCHAR(10), -- 997/999 acknowledgment
    interchange_control_number VARCHAR(50),
    group_control_number VARCHAR(50),
    edi_file_path TEXT,
    edi_file_size INTEGER,
    validation_errors TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Individual claim submissions within batches
CREATE TABLE IF NOT EXISTS claim_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id UUID NOT NULL REFERENCES insurance_claims(id),
    batch_id UUID REFERENCES claim_batches(id),
    clearinghouse_id UUID NOT NULL REFERENCES clearinghouse_connections(id),
    submission_number VARCHAR(100),
    transaction_control_number VARCHAR(50),
    submission_status VARCHAR(50) DEFAULT 'pending', -- pending, submitted, accepted, rejected, paid, denied
    edi_segment_data JSONB, -- Store EDI segments for reference
    validation_status VARCHAR(50) DEFAULT 'pending', -- pending, passed, failed
    validation_errors JSONB,
    scrubbing_status VARCHAR(50) DEFAULT 'pending', -- pending, passed, failed, corrected
    scrubbing_errors JSONB,
    clearinghouse_claim_id VARCHAR(100),
    payer_claim_id VARCHAR(100),
    submitted_at TIMESTAMP WITH TIME ZONE,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    payer_received_at TIMESTAMP WITH TIME ZONE,
    adjudicated_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Electronic Remittance Advice (835 ERA) tracking
CREATE TABLE IF NOT EXISTS electronic_remittance_advice (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    era_number VARCHAR(100) UNIQUE NOT NULL,
    clearinghouse_id UUID NOT NULL REFERENCES clearinghouse_connections(id),
    payer_id UUID NOT NULL REFERENCES insurance_payers(id),
    check_eft_number VARCHAR(100),
    payment_method VARCHAR(50), -- check, eft, credit_card
    payment_date DATE NOT NULL,
    total_payment_amount DECIMAL(12,2) NOT NULL,
    total_claims_count INTEGER DEFAULT 0,
    edi_file_path TEXT,
    edi_835_data JSONB, -- Store full 835 data
    processing_status VARCHAR(50) DEFAULT 'pending', -- pending, processing, posted, error
    posted_at TIMESTAMP WITH TIME ZONE,
    posted_by UUID REFERENCES providers(id),
    reconciliation_status VARCHAR(50) DEFAULT 'pending', -- pending, matched, unmatched, partial
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ERA claim-level details
CREATE TABLE IF NOT EXISTS era_claim_payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    era_id UUID NOT NULL REFERENCES electronic_remittance_advice(id) ON DELETE CASCADE,
    claim_id UUID REFERENCES insurance_claims(id),
    claim_submission_id UUID REFERENCES claim_submissions(id),
    patient_account_number VARCHAR(100),
    claim_status_code VARCHAR(10), -- 1=processed, 2=processed with adjustments, 3=denied, etc.
    total_charge_amount DECIMAL(10,2),
    payment_amount DECIMAL(10,2),
    patient_responsibility DECIMAL(10,2),
    adjustment_amount DECIMAL(10,2),
    adjustment_reason_codes JSONB, -- Array of reason codes
    remark_codes JSONB,
    service_date_from DATE,
    service_date_to DATE,
    posting_status VARCHAR(50) DEFAULT 'pending', -- pending, posted, error
    posted_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Eligibility verification requests (270/271)
CREATE TABLE IF NOT EXISTS eligibility_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_number VARCHAR(100) UNIQUE NOT NULL,
    clearinghouse_id UUID NOT NULL REFERENCES clearinghouse_connections(id),
    patient_id UUID NOT NULL REFERENCES patients(id),
    payer_id UUID NOT NULL REFERENCES insurance_payers(id),
    patient_insurance_id UUID REFERENCES patient_insurance(id),
    request_type VARCHAR(50) DEFAULT 'real-time', -- real-time, batch
    service_type_codes VARCHAR(255), -- 30=health benefit plan coverage, etc.
    request_status VARCHAR(50) DEFAULT 'pending', -- pending, sent, received, error
    edi_270_data JSONB,
    edi_271_data JSONB,
    eligibility_status VARCHAR(50), -- active, inactive, unknown
    coverage_details JSONB,
    copay_amount DECIMAL(10,2),
    deductible_amount DECIMAL(10,2),
    deductible_remaining DECIMAL(10,2),
    out_of_pocket_max DECIMAL(10,2),
    out_of_pocket_remaining DECIMAL(10,2),
    benefits_summary JSONB,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Claim status inquiry (276/277)
CREATE TABLE IF NOT EXISTS claim_status_inquiries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inquiry_number VARCHAR(100) UNIQUE NOT NULL,
    clearinghouse_id UUID NOT NULL REFERENCES clearinghouse_connections(id),
    claim_id UUID NOT NULL REFERENCES insurance_claims(id),
    claim_submission_id UUID REFERENCES claim_submissions(id),
    inquiry_type VARCHAR(50) DEFAULT 'claim_status', -- claim_status, payment_status
    edi_276_data JSONB,
    edi_277_data JSONB,
    claim_status_code VARCHAR(10),
    claim_status_description TEXT,
    payer_claim_control_number VARCHAR(100),
    check_eft_number VARCHAR(100),
    payment_date DATE,
    payment_amount DECIMAL(10,2),
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prior authorization requests (278)
CREATE TABLE IF NOT EXISTS prior_auth_requests_edi (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_number VARCHAR(100) UNIQUE NOT NULL,
    clearinghouse_id UUID NOT NULL REFERENCES clearinghouse_connections(id),
    patient_id UUID NOT NULL REFERENCES patients(id),
    payer_id UUID NOT NULL REFERENCES insurance_payers(id),
    provider_id UUID NOT NULL REFERENCES providers(id),
    service_type VARCHAR(255) NOT NULL,
    diagnosis_codes JSONB,
    procedure_codes JSONB,
    request_type VARCHAR(50) DEFAULT 'initial', -- initial, recertification, appeal
    urgency_level VARCHAR(50) DEFAULT 'routine', -- routine, urgent, emergent
    edi_278_request_data JSONB,
    edi_278_response_data JSONB,
    auth_status VARCHAR(50) DEFAULT 'pending', -- pending, approved, denied, pended
    auth_number VARCHAR(100),
    approved_units INTEGER,
    approved_amount DECIMAL(10,2),
    effective_date DATE,
    expiration_date DATE,
    denial_reason TEXT,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    responded_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clearinghouse transaction log
CREATE TABLE IF NOT EXISTS clearinghouse_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clearinghouse_id UUID NOT NULL REFERENCES clearinghouse_connections(id),
    transaction_type VARCHAR(10) NOT NULL, -- 837, 835, 270, 271, 276, 277, 278, 997, 999
    direction VARCHAR(20) NOT NULL, -- outbound, inbound
    transaction_id VARCHAR(100),
    reference_id UUID, -- Reference to related record (claim_id, era_id, etc.)
    reference_type VARCHAR(50), -- claim, era, eligibility, status_inquiry, prior_auth
    file_name VARCHAR(255),
    file_path TEXT,
    file_size INTEGER,
    transmission_method VARCHAR(50), -- api, sftp, direct
    transmission_status VARCHAR(50) DEFAULT 'pending', -- pending, sent, received, failed
    http_status_code INTEGER,
    response_data JSONB,
    error_message TEXT,
    transmitted_at TIMESTAMP WITH TIME ZONE,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    processing_time_ms INTEGER,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Denial and rejection tracking
CREATE TABLE IF NOT EXISTS claim_denials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_id UUID NOT NULL REFERENCES insurance_claims(id),
    claim_submission_id UUID REFERENCES claim_submissions(id),
    era_id UUID REFERENCES electronic_remittance_advice(id),
    denial_type VARCHAR(50) NOT NULL, -- technical, clinical, administrative
    denial_category VARCHAR(50), -- coding_error, missing_info, not_covered, timely_filing, etc.
    denial_reason_code VARCHAR(10),
    denial_reason_description TEXT,
    remark_codes JSONB,
    is_appealable BOOLEAN DEFAULT true,
    appeal_deadline DATE,
    appeal_status VARCHAR(50) DEFAULT 'not_started', -- not_started, in_progress, submitted, won, lost
    appeal_submitted_at TIMESTAMP WITH TIME ZONE,
    appeal_decision_at TIMESTAMP WITH TIME ZONE,
    corrective_action TEXT,
    assigned_to UUID REFERENCES providers(id),
    priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, urgent
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clearinghouse performance metrics
CREATE TABLE IF NOT EXISTS clearinghouse_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clearinghouse_id UUID NOT NULL REFERENCES clearinghouse_connections(id),
    metric_date DATE NOT NULL,
    claims_submitted INTEGER DEFAULT 0,
    claims_accepted INTEGER DEFAULT 0,
    claims_rejected INTEGER DEFAULT 0,
    acceptance_rate DECIMAL(5,2),
    average_response_time_ms INTEGER,
    total_charges_submitted DECIMAL(12,2) DEFAULT 0,
    total_payments_received DECIMAL(12,2) DEFAULT 0,
    eligibility_requests INTEGER DEFAULT 0,
    eligibility_success_rate DECIMAL(5,2),
    prior_auth_requests INTEGER DEFAULT 0,
    prior_auth_approval_rate DECIMAL(5,2),
    system_uptime_percentage DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(clearinghouse_id, metric_date)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_claim_batches_status ON claim_batches(batch_status);
CREATE INDEX IF NOT EXISTS idx_claim_batches_submitted ON claim_batches(submitted_at);
CREATE INDEX IF NOT EXISTS idx_claim_submissions_claim ON claim_submissions(claim_id);
CREATE INDEX IF NOT EXISTS idx_claim_submissions_batch ON claim_submissions(batch_id);
CREATE INDEX IF NOT EXISTS idx_claim_submissions_status ON claim_submissions(submission_status);
CREATE INDEX IF NOT EXISTS idx_era_payer ON electronic_remittance_advice(payer_id);
CREATE INDEX IF NOT EXISTS idx_era_payment_date ON electronic_remittance_advice(payment_date);
CREATE INDEX IF NOT EXISTS idx_era_processing_status ON electronic_remittance_advice(processing_status);
CREATE INDEX IF NOT EXISTS idx_era_claim_payments_era ON era_claim_payments(era_id);
CREATE INDEX IF NOT EXISTS idx_era_claim_payments_claim ON era_claim_payments(claim_id);
CREATE INDEX IF NOT EXISTS idx_eligibility_requests_patient ON eligibility_requests(patient_id);
CREATE INDEX IF NOT EXISTS idx_eligibility_requests_status ON eligibility_requests(request_status);
CREATE INDEX IF NOT EXISTS idx_claim_status_inquiries_claim ON claim_status_inquiries(claim_id);
CREATE INDEX IF NOT EXISTS idx_prior_auth_edi_patient ON prior_auth_requests_edi(patient_id);
CREATE INDEX IF NOT EXISTS idx_prior_auth_edi_status ON prior_auth_requests_edi(auth_status);
CREATE INDEX IF NOT EXISTS idx_clearinghouse_transactions_type ON clearinghouse_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_clearinghouse_transactions_status ON clearinghouse_transactions(transmission_status);
CREATE INDEX IF NOT EXISTS idx_claim_denials_claim ON claim_denials(claim_id);
CREATE INDEX IF NOT EXISTS idx_claim_denials_appeal_status ON claim_denials(appeal_status);
CREATE INDEX IF NOT EXISTS idx_clearinghouse_metrics_date ON clearinghouse_metrics(metric_date);

-- Insert default EDI transaction types
INSERT INTO edi_transaction_types (transaction_code, transaction_name, transaction_description, direction) VALUES
('837', 'Health Care Claim', 'Professional/Institutional claim submission', 'outbound'),
('835', 'Health Care Claim Payment/Advice', 'Electronic Remittance Advice (ERA)', 'inbound'),
('270', 'Eligibility Inquiry', 'Request for eligibility and benefits information', 'outbound'),
('271', 'Eligibility Response', 'Response to eligibility inquiry', 'inbound'),
('276', 'Claim Status Inquiry', 'Request for claim status', 'outbound'),
('277', 'Claim Status Response', 'Response to claim status inquiry', 'inbound'),
('278', 'Health Care Services Review', 'Prior authorization request/response', 'bidirectional'),
('997', 'Functional Acknowledgment', 'Acknowledgment of received transaction', 'inbound'),
('999', 'Implementation Acknowledgment', 'Enhanced acknowledgment with error details', 'inbound')
ON CONFLICT (transaction_code) DO NOTHING;

-- Insert default clearinghouse connection (Change Healthcare)
INSERT INTO clearinghouse_connections (
    clearinghouse_name,
    clearinghouse_id,
    connection_type,
    submitter_id,
    receiver_id,
    is_active,
    is_production,
    connection_status
) VALUES (
    'Change Healthcare',
    'CHC001',
    'api',
    'MASE001',
    'CHC',
    true,
    false,
    'connected'
) ON CONFLICT (clearinghouse_id) DO NOTHING;
