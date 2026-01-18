-- ============================================================================
-- CLINICAL ALERTS TABLE
-- Phase 5.2 of Primary Care Refactoring Roadmap
-- ============================================================================
-- This migration creates the clinical_alerts table matching the ClinicalAlert
-- TypeScript type from types/clinical.ts for patient clinical alerts.
-- ============================================================================

-- Create the clinical_alerts table
CREATE TABLE IF NOT EXISTS clinical_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Patient information
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    patient VARCHAR(255) NOT NULL,  -- Patient name for display
    
    -- Alert content
    message TEXT NOT NULL,
    
    -- Priority: high, medium, low
    priority VARCHAR(20) NOT NULL DEFAULT 'medium' 
        CHECK (priority IN ('high', 'medium', 'low')),
    
    -- Alert type for styling: destructive, warning, info, default
    type VARCHAR(20) DEFAULT 'default'
        CHECK (type IN ('destructive', 'warning', 'info', 'default')),
    
    -- Time information
    time VARCHAR(50),  -- Relative time display (e.g., "2 hours ago")
    alert_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Acknowledgment tracking
    is_acknowledged BOOLEAN DEFAULT false,
    acknowledged_by UUID REFERENCES staff(id),
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    acknowledgment_notes TEXT,
    
    -- Alert categorization
    category VARCHAR(100),  -- e.g., 'lab_result', 'medication', 'preventive_care'
    source VARCHAR(100),    -- e.g., 'system', 'provider', 'lab_interface'
    
    -- Urgency and expiration
    expires_at TIMESTAMP WITH TIME ZONE,
    auto_dismiss BOOLEAN DEFAULT false,
    
    -- Related entities (optional links)
    encounter_id UUID,
    order_id UUID,
    
    -- Metadata
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Primary query pattern: alerts by patient
CREATE INDEX IF NOT EXISTS idx_clinical_alerts_patient 
    ON clinical_alerts(patient_id);

-- Filter by priority for urgent alerts
CREATE INDEX IF NOT EXISTS idx_clinical_alerts_priority 
    ON clinical_alerts(priority);

-- Filter by acknowledgment status
CREATE INDEX IF NOT EXISTS idx_clinical_alerts_acknowledged 
    ON clinical_alerts(is_acknowledged);

-- Recent alerts (time-based queries)
CREATE INDEX IF NOT EXISTS idx_clinical_alerts_timestamp 
    ON clinical_alerts(alert_timestamp DESC);

-- Composite: unacknowledged + priority (common dashboard query)
CREATE INDEX IF NOT EXISTS idx_clinical_alerts_unack_priority 
    ON clinical_alerts(is_acknowledged, priority) 
    WHERE is_acknowledged = false;

-- Category-based filtering
CREATE INDEX IF NOT EXISTS idx_clinical_alerts_category 
    ON clinical_alerts(category);

-- Composite: patient + unacknowledged for patient-specific views
CREATE INDEX IF NOT EXISTS idx_clinical_alerts_patient_unack 
    ON clinical_alerts(patient_id, is_acknowledged) 
    WHERE is_acknowledged = false;

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on the table
ALTER TABLE clinical_alerts ENABLE ROW LEVEL SECURITY;

-- Policy: Allow authenticated users to read alerts
CREATE POLICY "Allow authenticated read access to clinical_alerts" 
    ON clinical_alerts 
    FOR SELECT 
    TO authenticated 
    USING (true);

-- Policy: Allow service role full access
CREATE POLICY "Allow service role full access to clinical_alerts" 
    ON clinical_alerts 
    FOR ALL 
    TO service_role 
    USING (true) 
    WITH CHECK (true);

-- Policy: Allow staff to insert/update alerts
CREATE POLICY "Allow staff write access to clinical_alerts" 
    ON clinical_alerts 
    FOR ALL 
    USING (
        auth.jwt() ->> 'role' IN ('admin', 'provider', 'nurse', 'staff', 'super_admin')
    )
    WITH CHECK (
        auth.jwt() ->> 'role' IN ('admin', 'provider', 'nurse', 'staff', 'super_admin')
    );

-- ============================================================================
-- TRIGGER FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_clinical_alerts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_clinical_alerts_updated_at ON clinical_alerts;
CREATE TRIGGER trigger_clinical_alerts_updated_at
    BEFORE UPDATE ON clinical_alerts
    FOR EACH ROW
    EXECUTE FUNCTION update_clinical_alerts_updated_at();

-- ============================================================================
-- TABLE COMMENTS
-- ============================================================================

COMMENT ON TABLE clinical_alerts IS 'Stores clinical alerts for patients displayed on dashboards';
COMMENT ON COLUMN clinical_alerts.patient IS 'Patient name for display purposes';
COMMENT ON COLUMN clinical_alerts.priority IS 'Alert priority: high, medium, or low';
COMMENT ON COLUMN clinical_alerts.type IS 'Alert styling type: destructive, warning, info, default';
COMMENT ON COLUMN clinical_alerts.time IS 'Relative time display string (e.g., "2 hours ago")';
COMMENT ON COLUMN clinical_alerts.is_acknowledged IS 'Whether the alert has been acknowledged';

