-- MASE Health Information Exchange (HIE) Network
-- Connects all MASE EMR clinics for patient data sharing

-- Registry of all MASE EMR installations
CREATE TABLE IF NOT EXISTS mase_clinic_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  clinic_name VARCHAR(255) NOT NULL,
  clinic_code VARCHAR(50) UNIQUE NOT NULL, -- Unique identifier for each clinic
  facility_type VARCHAR(100),
  npi_number VARCHAR(20),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(2),
  zip_code VARCHAR(10),
  phone VARCHAR(20),
  email VARCHAR(255),
  admin_contact_name VARCHAR(255),
  admin_contact_email VARCHAR(255),
  admin_contact_phone VARCHAR(20),
  
  -- HIE Network Status
  hie_enabled BOOLEAN DEFAULT true,
  network_status VARCHAR(50) DEFAULT 'active', -- active, suspended, pending
  joined_network_at TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Specialties and Services
  specialties JSONB DEFAULT '[]',
  services_offered JSONB DEFAULT '[]',
  
  -- Security & Compliance
  hipaa_compliant BOOLEAN DEFAULT true,
  cfr_part_2_compliant BOOLEAN DEFAULT true,
  encryption_enabled BOOLEAN DEFAULT true,
  
  -- API Configuration
  api_endpoint VARCHAR(500),
  api_version VARCHAR(20) DEFAULT '1.0',
  public_key TEXT, -- For encrypted data exchange
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Patient consent for inter-clinic data sharing
CREATE TABLE IF NOT EXISTS hie_patient_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  source_clinic_id UUID REFERENCES mase_clinic_registry(id),
  
  -- Consent Details
  consent_type VARCHAR(50) NOT NULL, -- full_access, limited, emergency_only
  consent_status VARCHAR(50) DEFAULT 'active', -- active, revoked, expired
  
  -- What can be shared
  share_demographics BOOLEAN DEFAULT true,
  share_medications BOOLEAN DEFAULT true,
  share_diagnoses BOOLEAN DEFAULT true,
  share_lab_results BOOLEAN DEFAULT true,
  share_treatment_plans BOOLEAN DEFAULT true,
  share_clinical_notes BOOLEAN DEFAULT false,
  share_mental_health_records BOOLEAN DEFAULT false, -- Requires specific consent
  share_substance_use_records BOOLEAN DEFAULT false, -- 42 CFR Part 2
  
  -- Authorized Clinics (array of clinic IDs patient authorizes)
  authorized_clinics UUID[] DEFAULT '{}',
  
  -- Consent Documentation
  consent_form_signed BOOLEAN DEFAULT false,
  consent_form_url TEXT,
  signed_date DATE,
  witness_name VARCHAR(255),
  
  -- Expiration
  effective_date DATE NOT NULL,
  expiration_date DATE,
  
  -- Revocation
  revoked_at TIMESTAMPTZ,
  revoked_by UUID,
  revocation_reason TEXT,
  
  -- Audit
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Data exchange requests between clinics
CREATE TABLE IF NOT EXISTS hie_data_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_number VARCHAR(50) UNIQUE NOT NULL,
  
  -- Clinics Involved
  requesting_clinic_id UUID REFERENCES mase_clinic_registry(id),
  source_clinic_id UUID REFERENCES mase_clinic_registry(id),
  
  -- Patient & Provider Info
  patient_id UUID REFERENCES patients(id),
  requesting_provider_id UUID,
  requesting_provider_name VARCHAR(255),
  requesting_provider_npi VARCHAR(20),
  
  -- Request Details
  request_type VARCHAR(50) NOT NULL, -- referral, consultation, records_transfer, emergency
  request_reason TEXT NOT NULL,
  urgency VARCHAR(20) DEFAULT 'routine', -- emergency, urgent, routine
  
  -- What data is requested
  data_types_requested JSONB NOT NULL, -- ["medications", "lab_results", "treatment_plans"]
  date_range_start DATE,
  date_range_end DATE,
  
  -- Authorization
  patient_consent_id UUID REFERENCES hie_patient_consents(id),
  consent_verified BOOLEAN DEFAULT false,
  
  -- Status
  request_status VARCHAR(50) DEFAULT 'pending', -- pending, approved, denied, completed, cancelled
  status_reason TEXT,
  
  -- Response
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  denied_by UUID,
  denied_at TIMESTAMPTZ,
  denial_reason TEXT,
  
  -- Data Transfer
  data_package_id UUID, -- Reference to the actual data sent
  data_sent_at TIMESTAMPTZ,
  data_received_at TIMESTAMPTZ,
  
  -- Security
  encryption_method VARCHAR(50) DEFAULT 'AES-256',
  access_expires_at TIMESTAMPTZ,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Actual data packages exchanged
CREATE TABLE IF NOT EXISTS hie_data_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  data_request_id UUID REFERENCES hie_data_requests(id),
  
  -- Package Info
  package_number VARCHAR(50) UNIQUE NOT NULL,
  package_type VARCHAR(50) NOT NULL, -- patient_summary, full_records, specific_data
  
  -- Data Content (encrypted JSON)
  patient_demographics JSONB,
  medications JSONB,
  diagnoses JSONB,
  lab_results JSONB,
  vital_signs JSONB,
  treatment_plans JSONB,
  clinical_notes JSONB, -- Only if consented
  allergies JSONB,
  immunizations JSONB,
  
  -- Attachments (URLs to encrypted files)
  attachments JSONB, -- [{type: "pdf", url: "...", description: "Lab Report"}]
  
  -- Metadata
  total_records_count INTEGER,
  data_size_bytes BIGINT,
  
  -- Security
  is_encrypted BOOLEAN DEFAULT true,
  encryption_key_id VARCHAR(255),
  checksum VARCHAR(255), -- For integrity verification
  
  -- Access Control
  accessed_at TIMESTAMPTZ,
  accessed_by UUID,
  download_count INTEGER DEFAULT 0,
  
  -- Compliance
  cfr_part_2_disclaimer TEXT, -- Required for SUD records
  hipaa_notice TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- Inter-clinic referrals
CREATE TABLE IF NOT EXISTS hie_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_number VARCHAR(50) UNIQUE NOT NULL,
  
  -- Clinics
  referring_clinic_id UUID REFERENCES mase_clinic_registry(id),
  receiving_clinic_id UUID REFERENCES mase_clinic_registry(id),
  
  -- Patient
  patient_id UUID REFERENCES patients(id),
  patient_consent_id UUID REFERENCES hie_patient_consents(id),
  
  -- Providers
  referring_provider_id UUID,
  referring_provider_name VARCHAR(255),
  referring_provider_npi VARCHAR(20),
  receiving_provider_id UUID,
  receiving_provider_name VARCHAR(255),
  receiving_provider_specialty VARCHAR(100),
  
  -- Referral Details
  referral_type VARCHAR(50) NOT NULL, -- specialist, primary_care, mental_health, substance_use
  referral_reason TEXT NOT NULL,
  chief_complaint TEXT,
  diagnosis_codes TEXT[],
  clinical_summary TEXT,
  urgency VARCHAR(20) DEFAULT 'routine',
  
  -- Scheduling
  preferred_appointment_date DATE,
  appointment_scheduled_date TIMESTAMPTZ,
  appointment_completed_date TIMESTAMPTZ,
  
  -- Status
  referral_status VARCHAR(50) DEFAULT 'pending', -- pending, accepted, declined, scheduled, completed, cancelled
  status_notes TEXT,
  
  -- Follow-up
  follow_up_required BOOLEAN DEFAULT false,
  follow_up_notes TEXT,
  follow_up_completed BOOLEAN DEFAULT false,
  
  -- Data Shared
  data_package_id UUID REFERENCES hie_data_packages(id),
  
  -- Response from receiving clinic
  receiving_clinic_response TEXT,
  response_received_at TIMESTAMPTZ,
  
  -- Outcome
  outcome_summary TEXT,
  outcome_date DATE,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Network activity log for compliance
CREATE TABLE IF NOT EXISTS hie_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Who
  clinic_id UUID REFERENCES mase_clinic_registry(id),
  user_id UUID,
  user_name VARCHAR(255),
  user_role VARCHAR(50),
  
  -- What
  action VARCHAR(100) NOT NULL, -- data_request, data_shared, consent_verified, referral_created
  resource_type VARCHAR(50), -- patient, data_package, referral
  resource_id UUID,
  
  -- Patient (for PHI access tracking)
  patient_id UUID REFERENCES patients(id),
  
  -- Details
  action_details TEXT,
  data_accessed JSONB, -- What specific data was accessed
  
  -- Technical
  ip_address INET,
  user_agent TEXT,
  
  -- Compliance
  authorization_verified BOOLEAN,
  consent_id UUID REFERENCES hie_patient_consents(id),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clinic directory search (public-facing)
CREATE TABLE IF NOT EXISTS hie_clinic_directory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES mase_clinic_registry(id),
  
  -- Public Information
  display_name VARCHAR(255) NOT NULL,
  description TEXT,
  specialties VARCHAR(100)[],
  services VARCHAR(100)[],
  
  -- Contact
  public_phone VARCHAR(20),
  public_email VARCHAR(255),
  website VARCHAR(500),
  
  -- Location
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(2),
  zip_code VARCHAR(10),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Availability
  accepting_new_patients BOOLEAN DEFAULT true,
  accepts_referrals BOOLEAN DEFAULT true,
  insurance_accepted TEXT[],
  languages_spoken VARCHAR(50)[],
  
  -- Hours
  operating_hours JSONB,
  
  -- Ratings (optional)
  average_rating DECIMAL(3, 2),
  total_reviews INTEGER DEFAULT 0,
  
  -- Visibility
  is_visible BOOLEAN DEFAULT true,
  
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_hie_patient_consents_patient ON hie_patient_consents(patient_id);
CREATE INDEX idx_hie_patient_consents_clinic ON hie_patient_consents(source_clinic_id);
CREATE INDEX idx_hie_data_requests_patient ON hie_data_requests(patient_id);
CREATE INDEX idx_hie_data_requests_status ON hie_data_requests(request_status);
CREATE INDEX idx_hie_referrals_patient ON hie_referrals(patient_id);
CREATE INDEX idx_hie_referrals_status ON hie_referrals(referral_status);
CREATE INDEX idx_hie_audit_log_patient ON hie_audit_log(patient_id);
CREATE INDEX idx_hie_audit_log_clinic ON hie_audit_log(clinic_id);
CREATE INDEX idx_hie_clinic_directory_city_state ON hie_clinic_directory(city, state);

-- Insert current clinic into registry (example)
INSERT INTO mase_clinic_registry (
  clinic_code,
  clinic_name,
  facility_type,
  specialties,
  hie_enabled,
  network_status
) VALUES (
  'MASE-001',
  'Primary Behavioral Health Clinic',
  'Behavioral Health',
  '["Behavioral Health", "Primary Care", "MAT", "OTP"]',
  true,
  'active'
) ON CONFLICT (clinic_code) DO NOTHING;
