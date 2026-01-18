-- ============================================================================
-- PATIENTS SEARCH OPTIMIZATION MIGRATION
-- Phase 8.3 of Primary Care Refactoring Roadmap
-- ============================================================================
-- This migration adds full_name computed column and GIN index for faster searches
-- ============================================================================

-- Enable pg_trgm extension for trigram matching (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Add computed full_name column
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS full_name TEXT 
GENERATED ALWAYS AS (
    LOWER(COALESCE(first_name, '') || ' ' || COALESCE(last_name, ''))
) STORED;

-- Create GIN index on full_name for fast text search
CREATE INDEX IF NOT EXISTS idx_patients_full_name_gin 
    ON patients USING gin(full_name gin_trgm_ops);

-- Create GIN index on phone for fast phone number search
CREATE INDEX IF NOT EXISTS idx_patients_phone_gin 
    ON patients USING gin(phone gin_trgm_ops) 
    WHERE phone IS NOT NULL;

-- Create composite GIN index for full_name + phone search
CREATE INDEX IF NOT EXISTS idx_patients_search_gin 
    ON patients USING gin(full_name gin_trgm_ops, phone gin_trgm_ops);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON COLUMN patients.full_name IS 'Computed column: lowercase concatenation of first_name and last_name for search optimization';

