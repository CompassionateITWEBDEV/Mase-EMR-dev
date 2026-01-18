-- Create nursing assessments table
CREATE TABLE IF NOT EXISTS nursing_assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  assessment_type VARCHAR(50) NOT NULL, -- 'rn-intake', 'hep-tb-tests', 'blood-work', 'uds-collection', 'results'
  vital_signs JSONB,
  physical_exam JSONB,
  pain_assessment JSONB,
  medical_history JSONB,
  assessment_data JSONB, -- Flexible field for different assessment types
  assessed_by VARCHAR(255),
  assessment_date TIMESTAMPTZ DEFAULT NOW(),
  signed_locked BOOLEAN DEFAULT FALSE,
  signed_by VARCHAR(255),
  signed_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create lab tests table
CREATE TABLE IF NOT EXISTS lab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  test_type VARCHAR(100) NOT NULL, -- 'hepatitis-a', 'hepatitis-b', 'hepatitis-c', 'tb-ppd', 'tb-quantiferon', etc.
  test_status VARCHAR(50) NOT NULL, -- 'ordered', 'collected', 'sent', 'pending', 'completed'
  collection_date TIMESTAMPTZ,
  collected_by VARCHAR(255),
  result VARCHAR(50), -- 'negative', 'positive', 'immune', 'pending', etc.
  result_date TIMESTAMPTZ,
  reviewed_by VARCHAR(255),
  review_date TIMESTAMPTZ,
  notes TEXT,
  lab_order_number VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create UDS (Urine Drug Screen) table
CREATE TABLE IF NOT EXISTS uds_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  specimen_id VARCHAR(100) UNIQUE NOT NULL,
  collection_date TIMESTAMPTZ NOT NULL,
  collected_by VARCHAR(255) NOT NULL,
  observed_collection BOOLEAN DEFAULT FALSE,
  specimen_temperature DECIMAL(4,1),
  instant_results JSONB, -- Store instant cup results as JSON
  pregnancy_test VARCHAR(50), -- 'not-applicable', 'negative', 'positive', 'invalid'
  confirmation_testing BOOLEAN DEFAULT FALSE,
  confirmation_lab VARCHAR(100),
  chain_of_custody_number VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create blood work orders table
CREATE TABLE IF NOT EXISTS blood_work_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  tests_ordered JSONB NOT NULL, -- Array of test names
  collection_date TIMESTAMPTZ,
  phlebotomist VARCHAR(255),
  lab_order_number VARCHAR(100),
  notes TEXT,
  status VARCHAR(50) DEFAULT 'ordered', -- 'ordered', 'collected', 'sent', 'completed'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_nursing_assessments_patient ON nursing_assessments(patient_id);
CREATE INDEX IF NOT EXISTS idx_nursing_assessments_date ON nursing_assessments(assessment_date);
CREATE INDEX IF NOT EXISTS idx_lab_tests_patient ON lab_tests(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_tests_type ON lab_tests(test_type);
CREATE INDEX IF NOT EXISTS idx_uds_tests_patient ON uds_tests(patient_id);
CREATE INDEX IF NOT EXISTS idx_uds_tests_collection ON uds_tests(collection_date);
CREATE INDEX IF NOT EXISTS idx_blood_work_orders_patient ON blood_work_orders(patient_id);

-- Enable Row Level Security
ALTER TABLE nursing_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lab_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE uds_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE blood_work_orders ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (adjust based on your auth setup)
-- Drop existing policies if they exist to make this script idempotent
DROP POLICY IF EXISTS "Staff can view all nursing assessments" ON nursing_assessments;
CREATE POLICY "Staff can view all nursing assessments" ON nursing_assessments
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Staff can insert nursing assessments" ON nursing_assessments;
CREATE POLICY "Staff can insert nursing assessments" ON nursing_assessments
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Staff can update nursing assessments" ON nursing_assessments;
CREATE POLICY "Staff can update nursing assessments" ON nursing_assessments
  FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Staff can view all lab tests" ON lab_tests;
CREATE POLICY "Staff can view all lab tests" ON lab_tests
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Staff can insert lab tests" ON lab_tests;
CREATE POLICY "Staff can insert lab tests" ON lab_tests
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Staff can update lab tests" ON lab_tests;
CREATE POLICY "Staff can update lab tests" ON lab_tests
  FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Staff can view all UDS tests" ON uds_tests;
CREATE POLICY "Staff can view all UDS tests" ON uds_tests
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Staff can insert UDS tests" ON uds_tests;
CREATE POLICY "Staff can insert UDS tests" ON uds_tests
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Staff can update UDS tests" ON uds_tests;
CREATE POLICY "Staff can update UDS tests" ON uds_tests
  FOR UPDATE USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Staff can view all blood work orders" ON blood_work_orders;
CREATE POLICY "Staff can view all blood work orders" ON blood_work_orders
  FOR SELECT USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Staff can insert blood work orders" ON blood_work_orders;
CREATE POLICY "Staff can insert blood work orders" ON blood_work_orders
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Staff can update blood work orders" ON blood_work_orders;
CREATE POLICY "Staff can update blood work orders" ON blood_work_orders
  FOR UPDATE USING (auth.role() = 'authenticated');
