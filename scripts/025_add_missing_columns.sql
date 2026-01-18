-- =====================================================
-- Add Missing Columns to medication tables
-- Run this script on Supabase SQL Editor
-- =====================================================

-- =====================================================
-- patient_medications table
-- =====================================================
ALTER TABLE patient_medications 
ADD COLUMN IF NOT EXISTS pharmacy_id UUID REFERENCES pharmacies(id);

ALTER TABLE patient_medications 
ADD COLUMN IF NOT EXISTS generic_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS medication_type VARCHAR(20) DEFAULT 'regular',
ADD COLUMN IF NOT EXISTS ndc_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS refills_remaining INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS discontinuation_reason TEXT,
ADD COLUMN IF NOT EXISTS discontinued_by UUID REFERENCES providers(id),
ADD COLUMN IF NOT EXISTS discontinued_at TIMESTAMP WITH TIME ZONE;

-- =====================================================
-- prescriptions table
-- =====================================================
ALTER TABLE prescriptions
ADD COLUMN IF NOT EXISTS cancelled_reason TEXT,
ADD COLUMN IF NOT EXISTS cancelled_by UUID REFERENCES providers(id),
ADD COLUMN IF NOT EXISTS cancelled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS prescribed_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS sent_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS filled_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS transmission_status VARCHAR(50),
ADD COLUMN IF NOT EXISTS is_controlled_substance BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS dea_schedule VARCHAR(10);

-- =====================================================
-- Done!
-- =====================================================
