-- ============================================================================
-- ADD TITLE COLUMN TO PROVIDERS TABLE (OPTIONAL)
-- Migration to add optional title column for provider credentials/designation
-- ============================================================================
-- This migration adds the title column to the providers table if it doesn't exist.
-- The title column can store provider credentials like "MD", "NP", "PA", "DO", etc.
-- This is OPTIONAL - the application works without it, but adding it enables
-- better display of provider information in the UI.
-- ============================================================================

-- Add title column if it doesn't exist
ALTER TABLE providers 
ADD COLUMN IF NOT EXISTS title VARCHAR(50);

-- Add comment
COMMENT ON COLUMN providers.title IS 'Provider title/credentials (e.g., MD, NP, PA, DO, PhD, LCSW)';

-- ============================================================================
-- VERIFICATION QUERY
-- ============================================================================
-- Run this query to verify the column was added:
-- SELECT column_name, data_type, character_maximum_length, is_nullable
-- FROM information_schema.columns 
-- WHERE table_name = 'providers' AND column_name = 'title';

