-- Regulatory Compliance & DEA Portal
CREATE TABLE IF NOT EXISTS dea_compliance_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  dea_registration_number TEXT NOT NULL,
  dea_expiration_date DATE NOT NULL,
  compliance_status TEXT, -- 'compliant', 'warning', 'violation'
  last_audit_date DATE,
  next_audit_due DATE,
  registration_type TEXT, -- 'OTP', 'Retail', 'Hospital', etc.
  controlled_substances JSONB, -- list of authorized substances
  annual_report_submitted BOOLEAN DEFAULT FALSE,
  annual_report_submit_date DATE,
  red_flags_count INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dea_regulatory_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  update_type TEXT, -- 'policy_change', 'enforcement_action', 'new_requirement'
  title TEXT NOT NULL,
  description TEXT,
  effective_date DATE,
  deadline_date DATE,
  impact_level TEXT, -- 'critical', 'high', 'medium', 'low'
  action_required TEXT,
  status TEXT, -- 'pending_review', 'acknowledged', 'in_progress', 'completed'
  acknowledged_by UUID,
  acknowledged_at TIMESTAMP,
  completed_by UUID,
  completed_at TIMESTAMP,
  source TEXT, -- 'DEA', 'SAMHSA', 'State Board'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Diversion Control & Bottle Tracking with GPS & Biometrics
CREATE TABLE IF NOT EXISTS medication_bottle_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  patient_id UUID NOT NULL,
  bottle_number TEXT NOT NULL,
  medication_name TEXT,
  medication_strength TEXT,
  quantity_dispensed NUMERIC,
  unit TEXT,
  lot_number TEXT,
  expiration_date DATE,
  dispensed_date TIMESTAMP,
  dispensed_by UUID,
  gps_latitude_dispensed NUMERIC,
  gps_longitude_dispensed NUMERIC,
  gps_accuracy_dispensed NUMERIC,
  facial_biometric_verified_dispensed BOOLEAN,
  facial_biometric_confidence_dispensed NUMERIC,
  consumption_gps_latitude NUMERIC,
  consumption_gps_longitude NUMERIC,
  consumption_gps_accuracy NUMERIC,
  consumption_timestamp TIMESTAMP,
  consumption_verified BOOLEAN,
  facial_biometric_verified_consumption BOOLEAN,
  facial_biometric_confidence_consumption NUMERIC,
  seal_verified BOOLEAN,
  seal_photo_url TEXT,
  tamper_detected BOOLEAN,
  tamper_reason TEXT,
  status TEXT, -- 'dispensed', 'in_use', 'consumed', 'returned', 'missing', 'tampered'
  callback_required BOOLEAN DEFAULT FALSE,
  callback_scheduled_date DATE,
  callback_completed BOOLEAN DEFAULT FALSE,
  callback_completion_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- County & PIHP Portal Integration
CREATE TABLE IF NOT EXISTS county_pihp_portal_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  county_name TEXT,
  pihp_name TEXT,
  pihp_id UUID,
  access_type TEXT, -- 'read_only', 'read_write', 'reporting'
  data_access_scope JSONB, -- what data they can access
  portal_login TEXT,
  portal_password_encrypted TEXT,
  portal_api_key TEXT,
  api_endpoint TEXT,
  connection_status TEXT, -- 'connected', 'disconnected', 'error'
  last_sync_date TIMESTAMP,
  sync_frequency TEXT, -- 'real_time', 'daily', 'weekly'
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS county_pihp_data_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  county_pihp_access_id UUID REFERENCES county_pihp_portal_access(id),
  export_type TEXT, -- 'claims', 'patient_data', 'compliance_report'
  export_date TIMESTAMP,
  data_records_count INTEGER,
  file_size_bytes BIGINT,
  file_path TEXT,
  export_status TEXT, -- 'pending', 'processing', 'completed', 'failed'
  error_message TEXT,
  requested_by UUID,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Health Information Exchange (HIE)
CREATE TABLE IF NOT EXISTS hie_network_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  hie_network_name TEXT NOT NULL,
  hie_endpoint TEXT,
  hie_api_key TEXT,
  hie_user_id TEXT,
  connection_status TEXT, -- 'active', 'inactive', 'test', 'error'
  last_connection_test TIMESTAMP,
  supported_transaction_types TEXT[] DEFAULT '{CCD, CDA, FHIR}',
  encryption_standard TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hie_patient_record_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  patient_id UUID,
  receiving_organization_id UUID,
  request_type TEXT, -- 'query', 'pull', 'push'
  document_types_requested TEXT[],
  request_status TEXT, -- 'pending', 'in_progress', 'completed', 'error'
  records_received INTEGER,
  requested_date TIMESTAMP,
  completed_date TIMESTAMP,
  error_message TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Community Collaboration Tracking
CREATE TABLE IF NOT EXISTS community_collaboration_organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  partner_organization_name TEXT NOT NULL,
  partner_type TEXT, -- 'treatment_provider', 'social_services', 'housing', 'food_bank', 'legal'
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  collaboration_type TEXT[] DEFAULT '{referrals, data_sharing, joint_programs}',
  mou_signed BOOLEAN DEFAULT FALSE,
  mou_date DATE,
  mou_expires DATE,
  is_active BOOLEAN DEFAULT TRUE,
  referrals_sent_30_days INTEGER DEFAULT 0,
  referrals_received_30_days INTEGER DEFAULT 0,
  successful_collaborations INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- State Callback Policy Management
CREATE TABLE IF NOT EXISTS state_callback_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  state_name TEXT,
  policy_type TEXT, -- 'missed_dose', 'location_violation', 'biometric_fail', 'tamper'
  max_failures_allowed INTEGER,
  callback_requirement BOOLEAN DEFAULT TRUE,
  callback_window_hours INTEGER,
  callback_method TEXT[], -- 'phone', 'sms', 'app_notification'
  escalation_required BOOLEAN DEFAULT FALSE,
  escalation_contact TEXT,
  documentation_required BOOLEAN DEFAULT TRUE,
  policy_source TEXT,
  effective_date DATE,
  expiration_date DATE,
  is_active BOOLEAN DEFAULT TRUE,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS state_callback_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  patient_id UUID NOT NULL,
  callback_policy_id UUID REFERENCES state_callback_policies(id),
  trigger_event TEXT, -- what caused the callback
  callback_scheduled_date DATE,
  callback_completed BOOLEAN DEFAULT FALSE,
  callback_completion_time TIMESTAMP,
  outcome TEXT, -- 'successful', 'rescheduled', 'no_answer', 'declined'
  staff_notes TEXT,
  callback_initiated_by UUID,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Patient Biometric Enrollment (extended for GPS & medication tracking)
CREATE TABLE IF NOT EXISTS patient_medication_gps_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  bottle_id UUID REFERENCES medication_bottle_tracking(id),
  tracking_point_number INTEGER,
  event_type TEXT, -- 'dispensed', 'in_transit', 'consumed', 'checkpoint'
  gps_latitude NUMERIC,
  gps_longitude NUMERIC,
  gps_accuracy_meters NUMERIC,
  location_address TEXT,
  location_verified BOOLEAN,
  geofence_status TEXT, -- 'within_home', 'within_work', 'outside_geofence'
  facial_biometric_verified BOOLEAN,
  facial_confidence NUMERIC,
  timestamp TIMESTAMP,
  device_id TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_dea_org ON dea_compliance_tracking(organization_id);
CREATE INDEX idx_bottle_patient ON medication_bottle_tracking(patient_id);
CREATE INDEX idx_bottle_status ON medication_bottle_tracking(status);
CREATE INDEX idx_county_access ON county_pihp_portal_access(organization_id);
CREATE INDEX idx_hie_network ON hie_network_connections(organization_id);
CREATE INDEX idx_collaboration_org ON community_collaboration_organizations(organization_id);
CREATE INDEX idx_callback_policy ON state_callback_policies(organization_id);
CREATE INDEX idx_callback_log ON state_callback_log(patient_id);
CREATE INDEX idx_gps_tracking ON patient_medication_gps_tracking(patient_id);
