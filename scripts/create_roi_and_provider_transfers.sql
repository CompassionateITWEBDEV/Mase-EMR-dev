-- Release of Information (ROI) consents tracking
CREATE TABLE IF NOT EXISTS patient_release_of_information (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Facility requesting records
  requesting_facility_name TEXT NOT NULL,
  requesting_facility_address TEXT,
  requesting_facility_phone TEXT,
  requesting_facility_fax TEXT,
  requesting_contact_name TEXT,
  
  -- Purpose of disclosure
  purpose TEXT NOT NULL, -- continuing_care, transfer, insurance, legal, other
  purpose_description TEXT,
  
  -- Information types authorized
  share_demographics BOOLEAN DEFAULT false,
  share_medications BOOLEAN DEFAULT false,
  share_lab_results BOOLEAN DEFAULT false,
  share_uds_results BOOLEAN DEFAULT false,
  share_diagnoses BOOLEAN DEFAULT false,
  share_treatment_plans BOOLEAN DEFAULT false,
  share_clinical_notes BOOLEAN DEFAULT false,
  share_mental_health_records BOOLEAN DEFAULT false, -- 42 CFR Part 2 protected
  share_substance_use_records BOOLEAN DEFAULT false, -- 42 CFR Part 2 protected
  
  -- Consent details
  patient_signature TEXT NOT NULL,
  patient_initials TEXT NOT NULL,
  signed_date DATE NOT NULL,
  witness_name TEXT,
  witness_signature TEXT,
  
  -- Validity period
  effective_date DATE NOT NULL,
  expiration_date DATE,
  
  -- Status
  status TEXT DEFAULT 'active', -- active, expired, revoked
  revoked_at TIMESTAMP WITH TIME ZONE,
  revoked_by UUID REFERENCES staff(id),
  revocation_reason TEXT,
  
  -- Audit
  created_by UUID REFERENCES staff(id),
  consent_form_url TEXT -- PDF of signed consent
);

-- External provider transfer submissions
CREATE TABLE IF NOT EXISTS external_transfer_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Submitting provider/facility info
  facility_name TEXT NOT NULL,
  facility_npi TEXT,
  provider_name TEXT NOT NULL,
  provider_title TEXT,
  provider_phone TEXT,
  provider_email TEXT,
  
  -- Patient information
  patient_first_name TEXT NOT NULL,
  patient_last_name TEXT NOT NULL,
  patient_dob DATE NOT NULL,
  patient_mrn TEXT, -- Their facility's MRN
  
  -- Transfer details
  transfer_reason TEXT NOT NULL,
  current_medications TEXT,
  current_mat_dose TEXT,
  last_dose_date DATE,
  additional_clinical_info TEXT,
  
  -- Documents
  documents JSONB, -- Array of {filename, url, type, uploaded_at}
  
  -- Compliance
  hipaa_consent_confirmed BOOLEAN DEFAULT false,
  provider_verification_confirmed BOOLEAN DEFAULT false,
  
  -- Status tracking
  submission_status TEXT DEFAULT 'pending', -- pending, reviewed, accepted, rejected
  reviewed_by UUID REFERENCES staff(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  
  -- Matched patient in our system
  matched_patient_id UUID REFERENCES patients(id),
  intake_created BOOLEAN DEFAULT false,
  intake_id UUID
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_roi_patient ON patient_release_of_information(patient_id);
CREATE INDEX IF NOT EXISTS idx_roi_status ON patient_release_of_information(status);
CREATE INDEX IF NOT EXISTS idx_external_transfer_status ON external_transfer_submissions(submission_status);
CREATE INDEX IF NOT EXISTS idx_external_transfer_dob ON external_transfer_submissions(patient_dob);

-- Enable RLS
ALTER TABLE patient_release_of_information ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_transfer_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Staff can view ROI consents"
  ON patient_release_of_information FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Staff can create ROI consents"
  ON patient_release_of_information FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Allow public to submit transfer documents"
  ON external_transfer_submissions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Staff can view transfer submissions"
  ON external_transfer_submissions FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Staff can update transfer submissions"
  ON external_transfer_submissions FOR UPDATE
  USING (auth.role() = 'authenticated');
