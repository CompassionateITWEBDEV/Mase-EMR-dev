-- Migration: Add ASAM level columns to treatment_plans table
-- This migration adds columns to store the ASAM level of care and link to the source assessment

-- Add asam_level column to store the ASAM level of care (e.g., "1.0", "2.1", "3.7")
ALTER TABLE treatment_plans
ADD COLUMN IF NOT EXISTS asam_level VARCHAR(10);

-- Add asam_assessment_id to link to the source ASAM assessment
ALTER TABLE treatment_plans
ADD COLUMN IF NOT EXISTS asam_assessment_id UUID REFERENCES assessments(id);

-- Add index for faster lookups by ASAM level
CREATE INDEX IF NOT EXISTS idx_treatment_plans_asam_level 
ON treatment_plans(asam_level);

-- Add index for looking up treatment plans by assessment
CREATE INDEX IF NOT EXISTS idx_treatment_plans_asam_assessment_id 
ON treatment_plans(asam_assessment_id);

-- Add comment to document the column purpose
COMMENT ON COLUMN treatment_plans.asam_level IS 'ASAM Level of Care (0.5, 1.0, 2.1, 2.5, 3.1, 3.3, 3.5, 3.7, 4.0)';
COMMENT ON COLUMN treatment_plans.asam_assessment_id IS 'Reference to the ASAM assessment that determined this level of care';

-- Verify the columns were added
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'treatment_plans' AND column_name = 'asam_level'
  ) THEN
    RAISE NOTICE 'Column asam_level successfully added to treatment_plans';
  ELSE
    RAISE WARNING 'Column asam_level was NOT added to treatment_plans';
  END IF;
  
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'treatment_plans' AND column_name = 'asam_assessment_id'
  ) THEN
    RAISE NOTICE 'Column asam_assessment_id successfully added to treatment_plans';
  ELSE
    RAISE WARNING 'Column asam_assessment_id was NOT added to treatment_plans';
  END IF;
END $$;
