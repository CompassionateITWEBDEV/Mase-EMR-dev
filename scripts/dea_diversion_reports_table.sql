-- DEA Diversion Reports Table for syncing with DEA Portal
-- This table stores all diversion-related events for DEA reporting

CREATE TABLE IF NOT EXISTS dea_diversion_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL, -- 'exception_created', 'biometric_enrolled', 'alert_resolved', 'address_registered', 'violation_detected'
  event_data JSONB NOT NULL,
  reported_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sync_status TEXT DEFAULT 'pending', -- 'pending', 'synced', 'failed'
  synced_at TIMESTAMPTZ,
  dea_reference_number TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient querying
CREATE INDEX IF NOT EXISTS idx_dea_diversion_reports_event_type ON dea_diversion_reports(event_type);
CREATE INDEX IF NOT EXISTS idx_dea_diversion_reports_sync_status ON dea_diversion_reports(sync_status);
CREATE INDEX IF NOT EXISTS idx_dea_diversion_reports_reported_at ON dea_diversion_reports(reported_at);

-- Enable RLS
ALTER TABLE dea_diversion_reports ENABLE ROW LEVEL SECURITY;

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'DEA Diversion Reports table created successfully';
END $$;
