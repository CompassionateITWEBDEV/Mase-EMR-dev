-- ============================================================================
-- ADD MRN COLUMN TO PATIENTS TABLE
-- Migration to add missing Medical Record Number (MRN) column
-- ============================================================================
-- This migration adds the mrn column to the patients table if it doesn't exist.
-- The mrn column is referenced in multiple API routes and UI components.
-- ============================================================================

-- Add mrn column if it doesn't exist
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS mrn VARCHAR(50);

-- Add unique constraint on mrn if it doesn't exist
-- Note: This will fail if there are duplicate NULL values, but that's okay
-- as NULL values are considered distinct in unique constraints
DO $$
BEGIN
    -- Check if unique constraint already exists
    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'patients_mrn_key' 
        AND conrelid = 'patients'::regclass
    ) THEN
        -- Add unique constraint (allowing NULL values)
        ALTER TABLE patients 
        ADD CONSTRAINT patients_mrn_key UNIQUE (mrn);
    END IF;
END $$;

-- Create index on mrn for faster lookups (if it doesn't exist)
CREATE INDEX IF NOT EXISTS idx_patients_mrn 
    ON patients(mrn) 
    WHERE mrn IS NOT NULL;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN patients.mrn IS 'Medical Record Number - Unique identifier for the patient record';

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
-- Run this query to verify the column was added:
-- SELECT column_name, data_type, is_nullable, column_default
-- FROM information_schema.columns 
-- WHERE table_name = 'patients' AND column_name = 'mrn';

