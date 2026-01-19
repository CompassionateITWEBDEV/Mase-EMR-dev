-- ============================================================================
-- PATIENTS SOFT DELETE MIGRATION
-- Phase 4.1 of Primary Care Refactoring Roadmap
-- ============================================================================
-- This migration adds soft deletion fields to the patients table
-- ============================================================================

-- Add soft deletion fields
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS deactivated_by UUID REFERENCES auth.users(id);

-- Add status column if it doesn't exist (for patient status: active, inactive, discharged, intake, on-hold)
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS status TEXT;

-- Update existing rows to set is_active=true
UPDATE patients 
SET is_active = true 
WHERE is_active IS NULL;

-- Set default status for existing patients if status is NULL
UPDATE patients 
SET status = 'active' 
WHERE status IS NULL;

-- Add index on is_active for efficient filtering
CREATE INDEX IF NOT EXISTS idx_patients_is_active 
    ON patients(is_active) 
    WHERE is_active = true;

-- Add index on deactivated_at for queries
CREATE INDEX IF NOT EXISTS idx_patients_deactivated_at 
    ON patients(deactivated_at) 
    WHERE deactivated_at IS NOT NULL;

-- Add composite index for active patients queries
CREATE INDEX IF NOT EXISTS idx_patients_active_status 
    ON patients(is_active, status) 
    WHERE is_active = true;

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN patients.is_active IS 'Whether the patient is active (false = soft deleted)';
COMMENT ON COLUMN patients.deactivated_at IS 'Timestamp when patient was deactivated';
COMMENT ON COLUMN patients.deactivated_by IS 'User ID who deactivated the patient';
COMMENT ON COLUMN patients.status IS 'Patient status: active, inactive, discharged, intake, on-hold';

