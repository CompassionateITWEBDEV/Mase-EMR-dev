-- ============================================================================
-- ENCOUNTER NOTE ENHANCEMENTS
-- Migration: 024
-- Description: Adds edit tracking and alert system for encounter notes
-- ============================================================================
-- This migration:
-- 1. Adds edit tracking columns to progress_notes table
-- 2. Creates encounter_note_alerts table for traceable notifications
-- 3. Backfills original_created_at for existing notes
-- ============================================================================

-- Add edit tracking columns to progress_notes table
ALTER TABLE progress_notes
ADD COLUMN IF NOT EXISTS last_edited_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_edited_by UUID REFERENCES staff(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS edit_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS original_created_at TIMESTAMP WITH TIME ZONE;

-- Backfill original_created_at for existing notes
UPDATE progress_notes
SET original_created_at = created_at
WHERE original_created_at IS NULL;

-- Set default for original_created_at to created_at for new records
ALTER TABLE progress_notes
ALTER COLUMN original_created_at SET DEFAULT NOW();

-- Create encounter_note_alerts table
CREATE TABLE IF NOT EXISTS encounter_note_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    encounter_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    progress_note_id UUID REFERENCES progress_notes(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) DEFAULT 'note_edited',
    message TEXT NOT NULL,
    editor_id UUID REFERENCES staff(id) ON DELETE SET NULL,
    editor_name VARCHAR(255),
    editor_role VARCHAR(100),
    encounter_reference VARCHAR(255),
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    read_by UUID REFERENCES staff(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_encounter_note_alerts_patient ON encounter_note_alerts(patient_id);
CREATE INDEX IF NOT EXISTS idx_encounter_note_alerts_encounter ON encounter_note_alerts(encounter_id);
CREATE INDEX IF NOT EXISTS idx_encounter_note_alerts_note ON encounter_note_alerts(progress_note_id);
CREATE INDEX IF NOT EXISTS idx_encounter_note_alerts_timestamp ON encounter_note_alerts(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_encounter_note_alerts_unread ON encounter_note_alerts(patient_id, is_read) WHERE is_read = false;
CREATE INDEX IF NOT EXISTS idx_progress_notes_last_edited ON progress_notes(last_edited_at);
CREATE INDEX IF NOT EXISTS idx_progress_notes_last_edited_by ON progress_notes(last_edited_by);

-- Add comments for documentation
COMMENT ON COLUMN progress_notes.last_edited_at IS 'Timestamp of the last edit to this note';
COMMENT ON COLUMN progress_notes.last_edited_by IS 'Staff member who made the last edit';
COMMENT ON COLUMN progress_notes.edit_count IS 'Total number of times this note has been edited';
COMMENT ON COLUMN progress_notes.original_created_at IS 'Original creation timestamp, preserved even after edits';

COMMENT ON TABLE encounter_note_alerts IS 'Alerts generated when encounter notes are edited, displayed in Patient Chart';
COMMENT ON COLUMN encounter_note_alerts.alert_type IS 'Type of alert (e.g., note_edited, note_signed)';
COMMENT ON COLUMN encounter_note_alerts.encounter_reference IS 'Human-readable reference to the encounter (e.g., "Encounter on 2024-01-15 - Office Visit")';
COMMENT ON COLUMN encounter_note_alerts.metadata IS 'Additional context stored as JSON (e.g., changes made, reason for edit)';

-- Enable RLS on encounter_note_alerts
ALTER TABLE encounter_note_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies for encounter_note_alerts
-- Staff can view alerts for patients they have access to
CREATE POLICY "Staff can view encounter note alerts"
ON encounter_note_alerts
FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM staff
        WHERE staff.id::text = current_setting('app.current_user_id', true)
    )
);

-- Staff can insert alerts (system-generated)
CREATE POLICY "Staff can insert encounter note alerts"
ON encounter_note_alerts
FOR INSERT
WITH CHECK (
    EXISTS (
        SELECT 1 FROM staff
        WHERE staff.id::text = current_setting('app.current_user_id', true)
    )
);

-- Staff can update alerts (mark as read)
CREATE POLICY "Staff can update encounter note alerts"
ON encounter_note_alerts
FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM staff
        WHERE staff.id::text = current_setting('app.current_user_id', true)
    )
);
