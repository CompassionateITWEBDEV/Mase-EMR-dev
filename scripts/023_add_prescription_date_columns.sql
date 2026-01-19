-- =====================================================
-- Medication Management System Schema
-- Run this script on Supabase SQL Editor
-- =====================================================

-- 1. Pharmacies table for prescription management
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
  ncpdp_id VARCHAR(20),
  npi VARCHAR(10),
  is_active BOOLEAN DEFAULT true,
  accepts_e_prescribing BOOLEAN DEFAULT false,
  hours_of_operation JSONB,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Patient medications table
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
  prescribed_by UUID REFERENCES providers(id),
  medication_type VARCHAR(20) NOT NULL DEFAULT 'regular',
  ndc_number VARCHAR(20),
  pharmacy_id UUID REFERENCES pharmacies(id),
  refills_remaining INTEGER DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  discontinuation_reason TEXT,
  discontinued_by UUID REFERENCES providers(id),
  discontinued_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Prescriptions table for e-prescribing
CREATE TABLE IF NOT EXISTS prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  medication_id UUID REFERENCES patient_medications(id),
  medication_name VARCHAR(255) NOT NULL,
  generic_name VARCHAR(255),
  strength VARCHAR(100),
  dosage VARCHAR(100),
  dosage_form VARCHAR(100),
  quantity INTEGER NOT NULL,
  days_supply INTEGER,
  directions TEXT NOT NULL,
  refills INTEGER DEFAULT 0,
  prescribed_by UUID NOT NULL REFERENCES providers(id),
  pharmacy_id UUID REFERENCES pharmacies(id),
  pharmacy_name VARCHAR(255),
  pharmacy_address TEXT,
  pharmacy_phone VARCHAR(20),
  pharmacy_npi VARCHAR(10),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  transmission_status VARCHAR(50),
  transmission_date TIMESTAMP WITH TIME ZONE,
  transmission_error TEXT,
  prescribed_date TIMESTAMP WITH TIME ZONE,
  sent_date TIMESTAMP WITH TIME ZONE,
  filled_date TIMESTAMP WITH TIME ZONE,
  cancelled_reason TEXT,
  cancelled_by UUID REFERENCES providers(id),
  cancelled_at TIMESTAMP WITH TIME ZONE,
  is_controlled_substance BOOLEAN DEFAULT false,
  dea_schedule VARCHAR(10),
  diagnosis_codes TEXT[],
  prior_authorization_required BOOLEAN DEFAULT false,
  prior_authorization_number VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. E-prescribing transmission logs
CREATE TABLE IF NOT EXISTS e_prescribing_transmissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
  transmission_type VARCHAR(50) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  retry_count INTEGER DEFAULT 0,
  error_message TEXT,
  request_payload JSONB,
  response_payload JSONB,
  transmitted_at TIMESTAMP WITH TIME ZONE,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Medication reconciliation sessions
CREATE TABLE IF NOT EXISTS medication_reconciliation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  session_type VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'in_progress',
  created_by UUID NOT NULL REFERENCES providers(id),
  completed_by UUID REFERENCES providers(id),
  reviewed_by UUID REFERENCES providers(id),
  reconciliation_notes TEXT,
  reconciled_medications JSONB DEFAULT '[]'::jsonb,
  notes TEXT,
  completed_at TIMESTAMP WITH TIME ZONE,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Medication reconciliation items
CREATE TABLE IF NOT EXISTS medication_reconciliation_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES medication_reconciliation_sessions(id) ON DELETE CASCADE,
  medication_name VARCHAR(255) NOT NULL,
  dosage VARCHAR(100) NOT NULL,
  frequency VARCHAR(100) NOT NULL,
  route VARCHAR(50) NOT NULL,
  source VARCHAR(20) NOT NULL,
  verified BOOLEAN DEFAULT false,
  action VARCHAR(20) NOT NULL DEFAULT 'pending',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Drug interactions tracking
CREATE TABLE IF NOT EXISTS drug_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medication1_name VARCHAR(255) NOT NULL,
  medication2_name VARCHAR(255) NOT NULL,
  severity VARCHAR(20) NOT NULL,
  description TEXT NOT NULL,
  clinical_effects TEXT,
  management_recommendations TEXT,
  source VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(medication1_name, medication2_name)
);

-- =====================================================
-- INDEXES for performance
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_patient_medications_patient_id ON patient_medications(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_medications_status ON patient_medications(status);
CREATE INDEX IF NOT EXISTS idx_patient_medications_medication_name ON patient_medications(medication_name);

CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON prescriptions(status);
CREATE INDEX IF NOT EXISTS idx_prescriptions_prescribed_by ON prescriptions(prescribed_by);
CREATE INDEX IF NOT EXISTS idx_prescriptions_prescribed_date ON prescriptions(prescribed_date);
CREATE INDEX IF NOT EXISTS idx_prescriptions_sent_date ON prescriptions(sent_date);
CREATE INDEX IF NOT EXISTS idx_prescriptions_filled_date ON prescriptions(filled_date);

CREATE INDEX IF NOT EXISTS idx_e_prescribing_transmissions_prescription_id ON e_prescribing_transmissions(prescription_id);
CREATE INDEX IF NOT EXISTS idx_e_prescribing_transmissions_status ON e_prescribing_transmissions(status);

CREATE INDEX IF NOT EXISTS idx_medication_reconciliation_sessions_patient_id ON medication_reconciliation_sessions(patient_id);
CREATE INDEX IF NOT EXISTS idx_medication_reconciliation_items_session_id ON medication_reconciliation_items(session_id);

CREATE INDEX IF NOT EXISTS idx_pharmacies_is_active ON pharmacies(is_active);
CREATE INDEX IF NOT EXISTS idx_pharmacies_name ON pharmacies(name);

-- =====================================================
-- ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE pharmacies ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE e_prescribing_transmissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_reconciliation_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE medication_reconciliation_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE drug_interactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow authenticated users - adjust as needed for your security model)
-- Pharmacies
DROP POLICY IF EXISTS "Allow authenticated to read pharmacies" ON pharmacies;
CREATE POLICY "Allow authenticated to read pharmacies" ON pharmacies FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated to manage pharmacies" ON pharmacies;
CREATE POLICY "Allow authenticated to manage pharmacies" ON pharmacies FOR ALL TO authenticated USING (true);

-- Patient Medications
DROP POLICY IF EXISTS "Allow authenticated to read patient_medications" ON patient_medications;
CREATE POLICY "Allow authenticated to read patient_medications" ON patient_medications FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated to manage patient_medications" ON patient_medications;
CREATE POLICY "Allow authenticated to manage patient_medications" ON patient_medications FOR ALL TO authenticated USING (true);

-- Prescriptions
DROP POLICY IF EXISTS "Allow authenticated to read prescriptions" ON prescriptions;
CREATE POLICY "Allow authenticated to read prescriptions" ON prescriptions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated to manage prescriptions" ON prescriptions;
CREATE POLICY "Allow authenticated to manage prescriptions" ON prescriptions FOR ALL TO authenticated USING (true);

-- E-Prescribing Transmissions
DROP POLICY IF EXISTS "Allow authenticated to read transmissions" ON e_prescribing_transmissions;
CREATE POLICY "Allow authenticated to read transmissions" ON e_prescribing_transmissions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated to manage transmissions" ON e_prescribing_transmissions;
CREATE POLICY "Allow authenticated to manage transmissions" ON e_prescribing_transmissions FOR ALL TO authenticated USING (true);

-- Medication Reconciliation Sessions
DROP POLICY IF EXISTS "Allow authenticated to read reconciliation_sessions" ON medication_reconciliation_sessions;
CREATE POLICY "Allow authenticated to read reconciliation_sessions" ON medication_reconciliation_sessions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated to manage reconciliation_sessions" ON medication_reconciliation_sessions;
CREATE POLICY "Allow authenticated to manage reconciliation_sessions" ON medication_reconciliation_sessions FOR ALL TO authenticated USING (true);

-- Medication Reconciliation Items
DROP POLICY IF EXISTS "Allow authenticated to read reconciliation_items" ON medication_reconciliation_items;
CREATE POLICY "Allow authenticated to read reconciliation_items" ON medication_reconciliation_items FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated to manage reconciliation_items" ON medication_reconciliation_items;
CREATE POLICY "Allow authenticated to manage reconciliation_items" ON medication_reconciliation_items FOR ALL TO authenticated USING (true);

-- Drug Interactions
DROP POLICY IF EXISTS "Allow authenticated to read drug_interactions" ON drug_interactions;
CREATE POLICY "Allow authenticated to read drug_interactions" ON drug_interactions FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Allow authenticated to manage drug_interactions" ON drug_interactions;
CREATE POLICY "Allow authenticated to manage drug_interactions" ON drug_interactions FOR ALL TO authenticated USING (true);

-- =====================================================
-- SEED DATA - Sample Pharmacies
-- =====================================================

INSERT INTO pharmacies (name, address, city, state, zip_code, phone, accepts_e_prescribing, is_active) VALUES
  ('CVS Pharmacy', '123 Main St', 'Springfield', 'IL', '62701', '(555) 123-4567', true, true),
  ('Walgreens', '456 Oak Ave', 'Springfield', 'IL', '62702', '(555) 234-5678', true, true),
  ('Rite Aid', '789 Elm St', 'Springfield', 'IL', '62703', '(555) 345-6789', true, true),
  ('Walmart Pharmacy', '321 Pine Rd', 'Springfield', 'IL', '62704', '(555) 456-7890', true, true),
  ('Kroger Pharmacy', '654 Maple Dr', 'Springfield', 'IL', '62705', '(555) 567-8901', true, true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- SEED DATA - Common Drug Interactions
-- =====================================================

INSERT INTO drug_interactions (medication1_name, medication2_name, severity, description, clinical_effects, management_recommendations, source) VALUES
  ('Warfarin', 'Aspirin', 'major', 'Increased risk of bleeding', 'Combined use significantly increases bleeding risk', 'Avoid combination or monitor closely with frequent INR checks', 'FDA'),
  ('Metformin', 'Contrast Dye', 'major', 'Risk of lactic acidosis', 'IV contrast can cause acute kidney injury, increasing metformin toxicity risk', 'Hold metformin 48 hours before and after contrast procedures', 'ACR Guidelines'),
  ('SSRIs', 'MAOIs', 'contraindicated', 'Serotonin syndrome risk', 'Life-threatening serotonin syndrome can occur', 'Do not use within 14 days of each other', 'FDA Black Box'),
  ('Methotrexate', 'NSAIDs', 'major', 'Increased methotrexate toxicity', 'NSAIDs reduce renal clearance of methotrexate', 'Avoid combination or reduce methotrexate dose', 'Clinical Guidelines'),
  ('Digoxin', 'Amiodarone', 'major', 'Increased digoxin levels', 'Amiodarone inhibits P-glycoprotein increasing digoxin concentration', 'Reduce digoxin dose by 50% and monitor levels', 'Drug Interaction Database'),
  ('Simvastatin', 'Grapefruit', 'moderate', 'Increased statin levels', 'Grapefruit inhibits CYP3A4 metabolism of simvastatin', 'Avoid grapefruit consumption or switch to pravastatin', 'FDA'),
  ('Lisinopril', 'Potassium', 'moderate', 'Hyperkalemia risk', 'ACE inhibitors reduce potassium excretion', 'Monitor potassium levels regularly', 'Clinical Guidelines'),
  ('Fluoxetine', 'Tramadol', 'major', 'Serotonin syndrome and seizure risk', 'Both increase serotonin; tramadol lowers seizure threshold', 'Use alternative analgesic or antidepressant', 'FDA'),
  ('Ciprofloxacin', 'Theophylline', 'major', 'Increased theophylline toxicity', 'Ciprofloxacin inhibits theophylline metabolism', 'Reduce theophylline dose by 30-50% and monitor levels', 'Drug Interaction Database'),
  ('Clopidogrel', 'Omeprazole', 'moderate', 'Reduced antiplatelet effect', 'Omeprazole inhibits CYP2C19 activation of clopidogrel', 'Use pantoprazole instead or H2 blocker', 'FDA')
ON CONFLICT (medication1_name, medication2_name) DO NOTHING;

-- =====================================================
-- Done! All tables, indexes, RLS policies, and seed data created.
-- =====================================================
