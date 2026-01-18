-- Pharmacies table for prescription management
CREATE TABLE IF NOT EXISTS pharmacies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(2),
  zip_code VARCHAR(10),
  phone VARCHAR(20),
  fax VARCHAR(20),
  email VARCHAR(255),
  ncpdp_id VARCHAR(20), -- National Council for Prescription Drug Programs ID
  npi VARCHAR(10), -- National Provider Identifier
  is_active BOOLEAN DEFAULT true,
  accepts_e_prescribing BOOLEAN DEFAULT false,
  hours_of_operation JSONB,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Patient medications table
CREATE TABLE IF NOT EXISTS patient_medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  medication_name VARCHAR(255) NOT NULL,
  generic_name VARCHAR(255),
  dosage VARCHAR(100) NOT NULL,
  frequency VARCHAR(100) NOT NULL,
  route VARCHAR(50) NOT NULL DEFAULT 'oral',
  start_date DATE NOT NULL,
  end_date DATE,
  prescribed_by UUID REFERENCES staff(id),
  medication_type VARCHAR(20) NOT NULL DEFAULT 'regular', -- regular, prn, controlled
  ndc_number VARCHAR(20), -- National Drug Code
  pharmacy_id UUID REFERENCES pharmacies(id),
  refills_remaining INTEGER DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, discontinued, completed
  discontinuation_reason TEXT,
  discontinued_by UUID REFERENCES staff(id),
  discontinued_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prescriptions table for e-prescribing
CREATE TABLE IF NOT EXISTS prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  medication_id UUID REFERENCES patient_medications(id),
  medication_name VARCHAR(255) NOT NULL,
  strength VARCHAR(100) NOT NULL,
  dosage_form VARCHAR(100), -- tablet, capsule, liquid, etc.
  quantity INTEGER NOT NULL,
  days_supply INTEGER NOT NULL,
  directions TEXT NOT NULL,
  refills INTEGER DEFAULT 0,
  prescribed_by UUID NOT NULL REFERENCES staff(id),
  pharmacy_id UUID REFERENCES pharmacies(id),
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, sent, filled, cancelled, error
  transmission_status VARCHAR(50), -- queued, transmitted, acknowledged, rejected
  transmission_date TIMESTAMP WITH TIME ZONE,
  transmission_error TEXT,
  filled_date TIMESTAMP WITH TIME ZONE,
  cancelled_reason TEXT,
  cancelled_by UUID REFERENCES staff(id),
  cancelled_at TIMESTAMP WITH TIME ZONE,
  is_controlled_substance BOOLEAN DEFAULT false,
  dea_schedule VARCHAR(10),
  diagnosis_codes TEXT[], -- ICD-10 codes
  prior_authorization_required BOOLEAN DEFAULT false,
  prior_authorization_number VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- E-prescribing transmission logs
CREATE TABLE IF NOT EXISTS e_prescribing_transmissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  transmission_type VARCHAR(50) NOT NULL, -- new_rx, refill_request, cancel_rx, change_rx
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, success, failed, retry
  retry_count INTEGER DEFAULT 0,
  error_message TEXT,
  request_payload JSONB,
  response_payload JSONB,
  transmitted_at TIMESTAMP WITH TIME ZONE,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Medication reconciliation sessions
CREATE TABLE IF NOT EXISTS medication_reconciliation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  session_type VARCHAR(20) NOT NULL, -- admission, discharge, transfer, routine
  status VARCHAR(20) NOT NULL DEFAULT 'in_progress', -- in_progress, completed, reviewed
  created_by UUID NOT NULL REFERENCES staff(id),
  completed_by UUID REFERENCES staff(id),
  reviewed_by UUID REFERENCES staff(id),
  reconciliation_notes TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Medication reconciliation items
CREATE TABLE IF NOT EXISTS medication_reconciliation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES medication_reconciliation_sessions(id) ON DELETE CASCADE,
  medication_name VARCHAR(255) NOT NULL,
  dosage VARCHAR(100) NOT NULL,
  frequency VARCHAR(100) NOT NULL,
  route VARCHAR(50) NOT NULL,
  source VARCHAR(20) NOT NULL, -- home, hospital, provider, pharmacy
  verified BOOLEAN DEFAULT false,
  action VARCHAR(20) NOT NULL DEFAULT 'pending', -- continue, discontinue, modify, new, pending
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Drug interactions tracking
CREATE TABLE IF NOT EXISTS drug_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medication1_name VARCHAR(255) NOT NULL,
  medication2_name VARCHAR(255) NOT NULL,
  severity VARCHAR(20) NOT NULL, -- minor, moderate, major, contraindicated
  description TEXT NOT NULL,
  clinical_effects TEXT,
  management_recommendations TEXT,
  source VARCHAR(100), -- data source
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(medication1_name, medication2_name)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_patient_medications_patient_id ON patient_medications(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_medications_status ON patient_medications(status);
CREATE INDEX IF NOT EXISTS idx_patient_medications_prescribed_by ON patient_medications(prescribed_by);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON prescriptions(status);
CREATE INDEX IF NOT EXISTS idx_prescriptions_prescribed_by ON prescriptions(prescribed_by);
CREATE INDEX IF NOT EXISTS idx_prescriptions_pharmacy_id ON prescriptions(pharmacy_id);
CREATE INDEX IF NOT EXISTS idx_e_prescribing_transmissions_prescription_id ON e_prescribing_transmissions(prescription_id);
CREATE INDEX IF NOT EXISTS idx_medication_reconciliation_sessions_patient_id ON medication_reconciliation_sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_medication_reconciliation_items_session_id ON medication_reconciliation_items(session_id);

-- Row Level Security Policies
ALTER TABLE pharmacies ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE e_prescribing_transmissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_reconciliation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_reconciliation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE drug_interactions ENABLE ROW LEVEL SECURITY;

-- Pharmacies policies (all authenticated users can read)
CREATE POLICY "Allow authenticated users to read pharmacies"
  ON pharmacies FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow staff to manage pharmacies"
  ON pharmacies FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' IN ('admin', 'clinical_director', 'provider'));

-- Patient medications policies
CREATE POLICY "Allow staff to read patient medications"
  ON patient_medications FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow providers to manage patient medications"
  ON patient_medications FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' IN ('admin', 'clinical_director', 'provider', 'nurse'));

-- Prescriptions policies
CREATE POLICY "Allow staff to read prescriptions"
  ON prescriptions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow providers to create prescriptions"
  ON prescriptions FOR INSERT
  TO authenticated
  WITH CHECK (auth.jwt() ->> 'role' IN ('admin', 'clinical_director', 'provider'));

CREATE POLICY "Allow providers to update prescriptions"
  ON prescriptions FOR UPDATE
  TO authenticated
  USING (auth.jwt() ->> 'role' IN ('admin', 'clinical_director', 'provider'));

-- E-prescribing transmissions policies
CREATE POLICY "Allow staff to read transmissions"
  ON e_prescribing_transmissions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow system to manage transmissions"
  ON e_prescribing_transmissions FOR ALL
  TO authenticated
  USING (true);

-- Medication reconciliation policies
CREATE POLICY "Allow staff to read reconciliation sessions"
  ON medication_reconciliation_sessions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow clinical staff to manage reconciliation sessions"
  ON medication_reconciliation_sessions FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' IN ('admin', 'clinical_director', 'provider', 'nurse'));

CREATE POLICY "Allow staff to read reconciliation items"
  ON medication_reconciliation_items FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow clinical staff to manage reconciliation items"
  ON medication_reconciliation_items FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' IN ('admin', 'clinical_director', 'provider', 'nurse'));

-- Drug interactions policies (read-only for all authenticated users)
CREATE POLICY "Allow authenticated users to read drug interactions"
  ON drug_interactions FOR SELECT
  TO authenticated
  USING (true);

-- Insert some sample pharmacies
INSERT INTO pharmacies (name, address, city, state, zip_code, phone, accepts_e_prescribing, is_active) VALUES
  ('CVS Pharmacy', '123 Main St', 'Springfield', 'IL', '62701', '(555) 123-4567', true, true),
  ('Walgreens', '456 Oak Ave', 'Springfield', 'IL', '62702', '(555) 234-5678', true, true),
  ('Rite Aid', '789 Elm St', 'Springfield', 'IL', '62703', '(555) 345-6789', true, true),
  ('Walmart Pharmacy', '321 Pine Rd', 'Springfield', 'IL', '62704', '(555) 456-7890', true, true)
ON CONFLICT DO NOTHING;
