-- GPS Tracking centralized view
CREATE TABLE IF NOT EXISTS gps_tracking_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  organization_id UUID NOT NULL,
  event_type VARCHAR(50) NOT NULL, -- 'bottle_dispensing', 'bottle_consumption', 'offsite_transport', 'takehome_scan'
  entity_id UUID NOT NULL, -- bottle_id, kit_id, scan_id
  patient_id UUID,
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  accuracy_meters NUMERIC,
  address_resolved TEXT,
  geofence_status VARCHAR(50),
  event_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
  device_info JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_gps_tracking_patient ON gps_tracking_events(patient_id);
CREATE INDEX idx_gps_tracking_timestamp ON gps_tracking_events(event_timestamp);
CREATE INDEX idx_gps_tracking_type ON gps_tracking_events(event_type);

-- Enable RLS
ALTER TABLE gps_tracking_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "gps_tracking_service_role" ON gps_tracking_events FOR ALL USING (true);
