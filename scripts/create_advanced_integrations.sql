-- Vonage Fax Integration Tables
CREATE TABLE IF NOT EXISTS fax_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  vonage_api_key TEXT,
  vonage_api_secret TEXT,
  vonage_fax_number VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fax_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  patient_id UUID REFERENCES patients(id),
  direction VARCHAR(10) CHECK (direction IN ('inbound', 'outbound')),
  fax_number VARCHAR(20),
  recipient_fax VARCHAR(20),
  subject VARCHAR(255),
  status VARCHAR(50), -- pending, sent, received, failed, processing
  page_count INTEGER,
  file_url TEXT,
  processed_data JSONB, -- AI-extracted data
  vonage_message_id VARCHAR(255),
  sent_at TIMESTAMPTZ,
  received_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fax_attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fax_message_id UUID REFERENCES fax_messages(id) ON DELETE CASCADE,
  file_name VARCHAR(255),
  file_type VARCHAR(50),
  file_size BIGINT,
  file_url TEXT,
  ocr_text TEXT, -- Extracted text via OCR
  ai_processed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Twilio SMS/Voice Integration
CREATE TABLE IF NOT EXISTS twilio_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  twilio_account_sid VARCHAR(255),
  twilio_auth_token TEXT,
  twilio_phone_number VARCHAR(20),
  enable_sms BOOLEAN DEFAULT true,
  enable_voice BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS sms_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  patient_id UUID REFERENCES patients(id),
  direction VARCHAR(10) CHECK (direction IN ('inbound', 'outbound')),
  from_number VARCHAR(20),
  to_number VARCHAR(20),
  message_body TEXT,
  status VARCHAR(50), -- queued, sent, delivered, failed, received
  twilio_sid VARCHAR(255),
  error_code VARCHAR(50),
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- State PDMP (Prescription Drug Monitoring Program) Integration
CREATE TABLE IF NOT EXISTS pdmp_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  state_code VARCHAR(2),
  pdmp_username VARCHAR(255),
  pdmp_password_encrypted TEXT,
  pdmp_api_key TEXT,
  pdmp_endpoint VARCHAR(500),
  auto_check_controlled_rx BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pdmp_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  patient_id UUID REFERENCES patients(id),
  provider_id UUID REFERENCES providers(id),
  request_type VARCHAR(50), -- routine, urgent, opioid_check
  request_status VARCHAR(50), -- pending, completed, failed, expired
  state_requested VARCHAR(2),
  request_date TIMESTAMPTZ DEFAULT NOW(),
  response_date TIMESTAMPTZ,
  pdmp_report JSONB, -- Full PDMP report data
  red_flags JSONB, -- Doctor shopping, overlapping prescriptions, etc.
  alert_level VARCHAR(20), -- none, low, medium, high, critical
  reviewed_by UUID REFERENCES providers(id),
  reviewed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS pdmp_prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pdmp_request_id UUID REFERENCES pdmp_requests(id) ON DELETE CASCADE,
  medication_name VARCHAR(255),
  dea_schedule VARCHAR(10),
  ndc_code VARCHAR(20),
  quantity NUMERIC,
  days_supply INTEGER,
  prescriber_name VARCHAR(255),
  prescriber_npi VARCHAR(20),
  prescriber_dea VARCHAR(20),
  pharmacy_name VARCHAR(255),
  pharmacy_npi VARCHAR(20),
  fill_date DATE,
  written_date DATE,
  morphine_equivalent_dose NUMERIC,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Surescripts E-Prescribing Network
CREATE TABLE IF NOT EXISTS surescripts_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  surescripts_account_id VARCHAR(255),
  surescripts_site_id VARCHAR(255),
  surescripts_user_id VARCHAR(255),
  surescripts_password_encrypted TEXT,
  certification_status VARCHAR(50), -- test, certified, production
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS surescripts_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  prescription_id UUID REFERENCES prescriptions(id),
  transaction_type VARCHAR(50), -- newrx, refillrequest, cancel, change
  transaction_status VARCHAR(50), -- pending, approved, denied, error
  pharmacy_ncpdp_id VARCHAR(20),
  pharmacy_name VARCHAR(255),
  surescripts_message_id VARCHAR(255),
  request_data JSONB,
  response_data JSONB,
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Document Processing
CREATE TABLE IF NOT EXISTS ai_document_processing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  patient_id UUID REFERENCES patients(id),
  source_type VARCHAR(50), -- fax, upload, scan, email
  source_id UUID, -- Reference to fax_messages, etc.
  document_type VARCHAR(50), -- medical_records, lab_results, referral, prior_auth
  file_url TEXT,
  ocr_text TEXT,
  extracted_data JSONB, -- Structured data extracted by AI
  confidence_score NUMERIC(3,2), -- 0.00 to 1.00
  processing_status VARCHAR(50), -- pending, processing, completed, failed, review_needed
  ai_model_used VARCHAR(100),
  processing_time_ms INTEGER,
  review_required BOOLEAN DEFAULT false,
  reviewed_by UUID REFERENCES providers(id),
  reviewed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_extracted_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID REFERENCES ai_document_processing(id) ON DELETE CASCADE,
  field_name VARCHAR(100), -- patient_name, dob, diagnosis, medication, etc.
  field_value TEXT,
  confidence_score NUMERIC(3,2),
  needs_verification BOOLEAN DEFAULT false,
  verified_by UUID REFERENCES providers(id),
  verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Integration Activity Log
CREATE TABLE IF NOT EXISTS integration_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  integration_type VARCHAR(50), -- vonage_fax, twilio_sms, pdmp, surescripts, ai_processing
  action VARCHAR(100),
  status VARCHAR(50),
  request_data JSONB,
  response_data JSONB,
  error_message TEXT,
  processing_time_ms INTEGER,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_fax_messages_patient ON fax_messages(patient_id);
CREATE INDEX idx_fax_messages_status ON fax_messages(status);
CREATE INDEX idx_sms_messages_patient ON sms_messages(patient_id);
CREATE INDEX idx_pdmp_requests_patient ON pdmp_requests(patient_id);
CREATE INDEX idx_pdmp_requests_status ON pdmp_requests(request_status);
CREATE INDEX idx_ai_processing_patient ON ai_document_processing(patient_id);
CREATE INDEX idx_ai_processing_status ON ai_document_processing(processing_status);
