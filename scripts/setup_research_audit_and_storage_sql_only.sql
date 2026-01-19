-- ============================================================================
-- RESEARCH STUDIES SETUP SCRIPT
-- ============================================================================
-- This script sets up the audit trail table for Research Studies feature
-- Run this in Supabase SQL Editor or via psql
-- ============================================================================

-- Step 1: Create Audit Trail Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS research_study_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    study_id UUID,
    participant_id UUID,
    action VARCHAR(50) NOT NULL CHECK (action IN ('created', 'updated', 'deleted', 'status_changed', 'enrolled', 'withdrawn', 'completed')),
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('study', 'participant')),
    changed_by UUID,
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    old_values JSONB,
    new_values JSONB,
    change_description TEXT,
    
    FOREIGN KEY (study_id) REFERENCES research_studies(id) ON DELETE CASCADE,
    FOREIGN KEY (participant_id) REFERENCES research_study_participants(id) ON DELETE CASCADE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_research_audit_study ON research_study_audit_log(study_id);
CREATE INDEX IF NOT EXISTS idx_research_audit_participant ON research_study_audit_log(participant_id);
CREATE INDEX IF NOT EXISTS idx_research_audit_action ON research_study_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_research_audit_changed_at ON research_study_audit_log(changed_at DESC);

-- Verify table creation
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'research_study_audit_log') THEN
        RAISE NOTICE '✅ Audit table created successfully';
    ELSE
        RAISE EXCEPTION '❌ Failed to create audit table';
    END IF;
END $$;

-- ============================================================================
-- NOTE: Storage bucket must be created manually in Supabase Dashboard
-- ============================================================================
-- To create the storage bucket:
-- 1. Go to Supabase Dashboard > Storage
-- 2. Click "New bucket"
-- 3. Name: research-consents
-- 4. Set to Public
-- 5. File size limit: 10MB
-- 6. Allowed MIME types:
--    - application/pdf
--    - image/jpeg
--    - image/jpg
--    - image/png
--    - application/msword
--    - application/vnd.openxmlformats-officedocument.wordprocessingml.document
-- ============================================================================

