-- ============================================================================
-- FIX MISSING COLUMNS MIGRATION
-- Adds missing columns: clinical_alerts.alert_type, clinical_alerts.severity, 
-- clinical_alerts.alert_message, clinical_alerts.triggered_by, clinical_alerts.status,
-- encounters.cpt_codes, providers.is_active
-- ============================================================================
-- This migration fixes database schema errors:
-- 1. clinical_alerts table missing alert_type column
-- 2. clinical_alerts table missing severity column
-- 3. clinical_alerts table missing alert_message column (may have 'message' instead)
-- 4. clinical_alerts table missing triggered_by column
-- 5. clinical_alerts table missing status column
-- 6. encounters table missing cpt_codes column (or needs alias for procedure_codes)
-- 7. providers table missing is_active column
-- ============================================================================

-- ============================================================================
-- 1. ADD alert_type, severity, alert_message, triggered_by, AND status TO clinical_alerts TABLE
-- ============================================================================

-- Add alert_type column if it doesn't exist
ALTER TABLE clinical_alerts 
ADD COLUMN IF NOT EXISTS alert_type VARCHAR(100);

-- Add severity column if it doesn't exist (required by API)
ALTER TABLE clinical_alerts 
ADD COLUMN IF NOT EXISTS severity VARCHAR(50);

-- Add alert_message column if it doesn't exist (required by API)
-- Note: Some schemas use 'message' instead of 'alert_message'
ALTER TABLE clinical_alerts 
ADD COLUMN IF NOT EXISTS alert_message TEXT;

-- Add triggered_by column if it doesn't exist (required by API)
ALTER TABLE clinical_alerts 
ADD COLUMN IF NOT EXISTS triggered_by VARCHAR(255);

-- Add status column if it doesn't exist (required by API)
ALTER TABLE clinical_alerts 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';

-- Sync data from 'message' to 'alert_message' if 'message' exists and 'alert_message' is NULL
DO $$
BEGIN
    -- Check if 'message' column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'clinical_alerts' AND column_name = 'message'
    ) THEN
        -- Copy message to alert_message for rows where alert_message is NULL
        UPDATE clinical_alerts 
        SET alert_message = message 
        WHERE alert_message IS NULL AND message IS NOT NULL;
        
        RAISE NOTICE 'Synced message column to alert_message for existing alerts';
    END IF;
END $$;

-- Set default severity for existing rows if NULL
UPDATE clinical_alerts 
SET severity = 'medium' 
WHERE severity IS NULL;

-- Set default status for existing rows if NULL
UPDATE clinical_alerts 
SET status = 'active' 
WHERE status IS NULL;

-- Make alert_message NOT NULL if it's still NULL (set a default)
UPDATE clinical_alerts 
SET alert_message = 'No message provided' 
WHERE alert_message IS NULL;

-- Now make it NOT NULL (if we want to enforce it)
-- Note: We'll keep it nullable for backward compatibility, but ensure it has values

-- Add comments
COMMENT ON COLUMN clinical_alerts.alert_type IS 'Type of alert (e.g., medication, lab, preventive_care, general)';
COMMENT ON COLUMN clinical_alerts.severity IS 'Alert severity: critical, high, medium, low';
COMMENT ON COLUMN clinical_alerts.alert_message IS 'Alert message content (synonym for message column)';
COMMENT ON COLUMN clinical_alerts.triggered_by IS 'What action triggered the alert (e.g., manual, pmp_system, cds_rule, etc.)';
COMMENT ON COLUMN clinical_alerts.status IS 'Alert status: active, acknowledged, dismissed, resolved';

-- Create indexes for filtering
CREATE INDEX IF NOT EXISTS idx_clinical_alerts_alert_type 
    ON clinical_alerts(alert_type) 
    WHERE alert_type IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_clinical_alerts_severity 
    ON clinical_alerts(severity) 
    WHERE severity IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_clinical_alerts_triggered_by 
    ON clinical_alerts(triggered_by) 
    WHERE triggered_by IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_clinical_alerts_status 
    ON clinical_alerts(status) 
    WHERE status IS NOT NULL;

-- ============================================================================
-- 2. ADD cpt_codes TO encounters TABLE (alias for procedure_codes)
-- ============================================================================

-- Ensure the text array type is available (should be built-in, but verify)
-- PostgreSQL has built-in array types, but we need to use proper syntax

-- Add cpt_codes as a separate column
-- Use ARRAY type explicitly to avoid "could not find array type" errors
ALTER TABLE encounters 
ADD COLUMN IF NOT EXISTS cpt_codes text[];

-- Add comment
COMMENT ON COLUMN encounters.cpt_codes IS 'CPT codes for billing (synonym for procedure_codes)';

-- Create GIN index for array queries (only if column has data)
-- Note: GIN indexes work with array types in PostgreSQL
DO $$
BEGIN
    -- Only create index if there are rows with non-null cpt_codes
    IF EXISTS (SELECT 1 FROM encounters WHERE cpt_codes IS NOT NULL LIMIT 1) THEN
        CREATE INDEX IF NOT EXISTS idx_encounters_cpt_codes 
            ON encounters USING gin(cpt_codes);
    ELSE
        -- Create index anyway for future use
        CREATE INDEX IF NOT EXISTS idx_encounters_cpt_codes 
            ON encounters USING gin(cpt_codes)
            WHERE cpt_codes IS NOT NULL;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        -- If index creation fails, log but continue
        RAISE NOTICE 'Could not create GIN index on cpt_codes: %', SQLERRM;
END $$;

-- If procedure_codes exists, sync existing data to cpt_codes
DO $$
BEGIN
    -- Check if procedure_codes column exists
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'encounters' AND column_name = 'procedure_codes'
    ) THEN
        -- Copy procedure_codes to cpt_codes for existing rows
        UPDATE encounters 
        SET cpt_codes = procedure_codes 
        WHERE cpt_codes IS NULL AND procedure_codes IS NOT NULL;
        
        RAISE NOTICE 'Synced procedure_codes to cpt_codes for existing encounters';
    END IF;
END $$;

-- ============================================================================
-- 3. ADD is_active TO providers TABLE
-- ============================================================================

-- Add is_active column if it doesn't exist
ALTER TABLE providers 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Update existing rows to set is_active=true if NULL
UPDATE providers 
SET is_active = true 
WHERE is_active IS NULL;

-- Add comment
COMMENT ON COLUMN providers.is_active IS 'Whether the provider is active (false = inactive/deactivated)';

-- Create index for filtering active providers
CREATE INDEX IF NOT EXISTS idx_providers_is_active 
    ON providers(is_active) 
    WHERE is_active = true;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify all columns were added successfully
-- Run these queries to confirm:

-- Verify clinical_alerts columns
-- SELECT column_name, data_type, character_maximum_length, is_nullable
-- FROM information_schema.columns 
-- WHERE table_name = 'clinical_alerts' 
-- AND column_name IN ('alert_type', 'severity', 'alert_message', 'triggered_by', 'status')
-- ORDER BY column_name;

-- Verify encounters.cpt_codes
-- SELECT column_name, data_type, udt_name, is_nullable
-- FROM information_schema.columns 
-- WHERE table_name = 'encounters' AND column_name = 'cpt_codes';

-- Verify providers.is_active
-- SELECT column_name, data_type, column_default, is_nullable
-- FROM information_schema.columns 
-- WHERE table_name = 'providers' AND column_name = 'is_active';

-- Quick verification query (returns count of columns found)
-- SELECT 
--   (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'clinical_alerts' AND column_name = 'alert_type') as has_alert_type,
--   (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'clinical_alerts' AND column_name = 'severity') as has_severity,
--   (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'clinical_alerts' AND column_name = 'alert_message') as has_alert_message,
--   (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'clinical_alerts' AND column_name = 'triggered_by') as has_triggered_by,
--   (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'clinical_alerts' AND column_name = 'status') as has_status,
--   (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'encounters' AND column_name = 'cpt_codes') as has_cpt_codes,
--   (SELECT COUNT(*) FROM information_schema.columns WHERE table_name = 'providers' AND column_name = 'is_active') as has_is_active;

