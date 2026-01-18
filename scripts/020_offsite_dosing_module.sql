-- Off-Site Dosing Module for Nursing Homes and Inpatient Facilities
-- Tracks pre-dispensed bottles transported by nurses to facilities
-- Tracks daily administration by facility nurses

-- Off-site dosing locations (nursing homes, inpatient facilities)
CREATE TABLE IF NOT EXISTS offsite_dosing_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  
  -- Facility Information
  facility_name VARCHAR(255) NOT NULL,
  facility_type VARCHAR(50) NOT NULL, -- 'nursing_home', 'inpatient_facility', 'assisted_living', 'hospital'
  facility_license_number VARCHAR(100),
  
  -- Contact Information
  address TEXT NOT NULL,
  city VARCHAR(100) NOT NULL,
  state VARCHAR(2) NOT NULL,
  zip_code VARCHAR(10) NOT NULL,
  phone VARCHAR(20),
  fax VARCHAR(20),
  contact_person_name VARCHAR(255),
  contact_person_title VARCHAR(100),
  contact_person_email VARCHAR(255),
  
  -- Dosing Configuration
  dosing_room_location TEXT,
  medication_storage_location TEXT,
  refrigeration_available BOOLEAN DEFAULT false,
  locked_storage_available BOOLEAN DEFAULT true,
  
  -- Geolocation for compliance
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  geofence_radius_meters INTEGER DEFAULT 100,
  
  -- Facility Staff
  authorized_facility_nurses JSONB, -- Array of {name, license_number, credentials}
  
  -- Agreement & Compliance
  agreement_signed BOOLEAN DEFAULT false,
  agreement_signed_date DATE,
  agreement_document_url TEXT,
  dea_notification_sent BOOLEAN DEFAULT false,
  state_notification_sent BOOLEAN DEFAULT false,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  activation_date DATE,
  deactivation_date DATE,
  deactivation_reason TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES providers(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES providers(id),
  notes TEXT
);

-- Pre-dispensed bottle kits prepared for transport to nursing homes
CREATE TABLE IF NOT EXISTS offsite_bottle_kits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  kit_number VARCHAR(50) UNIQUE NOT NULL,
  
  -- Patient Information
  patient_id UUID NOT NULL REFERENCES patients(id),
  offsite_location_id UUID NOT NULL REFERENCES offsite_dosing_locations(id),
  
  -- Kit Details
  medication_name VARCHAR(255) NOT NULL,
  dose_amount NUMERIC NOT NULL,
  dose_unit VARCHAR(20) NOT NULL DEFAULT 'mg',
  concentration VARCHAR(50), -- e.g., "10mg/ml"
  
  -- Bottles in Kit
  number_of_bottles INTEGER NOT NULL,
  bottle_serial_numbers TEXT[], -- Array of bottle serial numbers from bottle table
  total_ml_in_kit NUMERIC NOT NULL,
  
  -- Dispensing Information
  dispensed_by UUID NOT NULL REFERENCES providers(id),
  dispensed_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  witnessed_by UUID REFERENCES providers(id),
  source_bottle_id INTEGER REFERENCES bottle(id),
  
  -- Transport Information
  transported_by UUID NOT NULL REFERENCES providers(id), -- OTP nurse who transports
  transport_vehicle VARCHAR(100),
  departed_clinic_at TIMESTAMPTZ,
  arrived_facility_at TIMESTAMPTZ,
  transport_temperature_log JSONB, -- [{time, temp_celsius}]
  
  -- Received by Facility
  received_by_facility_nurse VARCHAR(255),
  received_facility_nurse_license VARCHAR(100),
  received_at TIMESTAMPTZ,
  seal_intact_confirmed BOOLEAN,
  storage_location_confirmed BOOLEAN,
  
  -- Schedule
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  scheduled_dose_times TIME[], -- e.g., ['08:00:00', '20:00:00'] for BID dosing
  
  -- Status
  kit_status VARCHAR(50) NOT NULL DEFAULT 'prepared', 
  -- 'prepared', 'in_transit', 'delivered', 'in_use', 'depleted', 'recalled', 'returned'
  
  -- DEA Compliance
  dea_form_106_required BOOLEAN DEFAULT false,
  dea_form_106_number VARCHAR(100),
  dea_222_line_number VARCHAR(50),
  
  -- Return Information
  returned_by_facility_nurse VARCHAR(255),
  returned_at TIMESTAMPTZ,
  return_received_by UUID REFERENCES providers(id),
  return_bottles_count INTEGER,
  return_remaining_ml NUMERIC,
  destruction_required BOOLEAN DEFAULT false,
  destruction_witnessed_at TIMESTAMPTZ,
  destruction_witness_1 UUID REFERENCES providers(id),
  destruction_witness_2 UUID REFERENCES providers(id),
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT,
  
  CONSTRAINT valid_dates CHECK (end_date >= start_date)
);

-- Daily administration log by facility nurses
CREATE TABLE IF NOT EXISTS offsite_dose_administration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  
  -- Kit & Patient
  bottle_kit_id UUID NOT NULL REFERENCES offsite_bottle_kits(id),
  patient_id UUID NOT NULL REFERENCES patients(id),
  offsite_location_id UUID NOT NULL REFERENCES offsite_dosing_locations(id),
  
  -- Scheduled vs Actual
  scheduled_dose_date DATE NOT NULL,
  scheduled_dose_time TIME NOT NULL,
  actual_administration_date DATE,
  actual_administration_time TIME,
  
  -- Dose Information
  bottle_number INTEGER NOT NULL, -- Which bottle from the kit (1, 2, 3, etc.)
  bottle_serial_number VARCHAR(50),
  dose_amount NUMERIC NOT NULL,
  dose_unit VARCHAR(20) NOT NULL DEFAULT 'mg',
  volume_ml NUMERIC NOT NULL,
  
  -- Administered By (Facility Nurse)
  administered_by_name VARCHAR(255) NOT NULL,
  administered_by_license VARCHAR(100) NOT NULL,
  administered_by_credentials VARCHAR(50),
  
  -- Witnessed By (Another Facility Nurse if required)
  witnessed_by_name VARCHAR(255),
  witnessed_by_license VARCHAR(100),
  
  -- Administration Details
  administration_method VARCHAR(50) DEFAULT 'oral', -- 'oral', 'observed'
  patient_response TEXT,
  adverse_events TEXT,
  refused_dose BOOLEAN DEFAULT false,
  refusal_reason TEXT,
  
  -- Compliance Verification
  patient_id_verified BOOLEAN NOT NULL DEFAULT true,
  dose_observed BOOLEAN DEFAULT true,
  observation_duration_minutes INTEGER DEFAULT 0,
  
  -- Status
  administration_status VARCHAR(50) NOT NULL DEFAULT 'scheduled',
  -- 'scheduled', 'administered', 'missed', 'refused', 'held'
  
  -- OTP Notification
  otp_notified BOOLEAN DEFAULT false,
  otp_notified_at TIMESTAMPTZ,
  missed_dose_alert_sent BOOLEAN DEFAULT false,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID, -- Can be null for facility-entered data
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

-- Transport logs for accountability
CREATE TABLE IF NOT EXISTS offsite_transport_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bottle_kit_id UUID NOT NULL REFERENCES offsite_bottle_kits(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  
  -- Transport Event
  event_type VARCHAR(50) NOT NULL, -- 'departure', 'arrival', 'temperature_check', 'incident', 'return'
  event_timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Location
  location_lat NUMERIC(10, 7),
  location_lng NUMERIC(10, 7),
  location_description TEXT,
  
  -- Personnel
  transported_by UUID REFERENCES providers(id),
  transporter_name VARCHAR(255),
  
  -- Details
  temperature_celsius NUMERIC(5, 2),
  seal_status VARCHAR(50), -- 'intact', 'broken', 'tampered'
  vehicle_id VARCHAR(100),
  odometer_reading VARCHAR(50),
  
  -- Incidents
  incident_reported BOOLEAN DEFAULT false,
  incident_description TEXT,
  incident_reported_to VARCHAR(255), -- DEA, State Board, etc.
  
  -- Documentation
  photo_url TEXT,
  signature_data TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Facility nurse access portal (simplified user management for facility staff)
CREATE TABLE IF NOT EXISTS offsite_facility_nurse_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  offsite_location_id UUID NOT NULL REFERENCES offsite_dosing_locations(id),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  
  -- Nurse Information
  nurse_name VARCHAR(255) NOT NULL,
  nurse_email VARCHAR(255) UNIQUE NOT NULL,
  nurse_license_number VARCHAR(100) NOT NULL,
  nurse_license_state VARCHAR(2) NOT NULL,
  nurse_credentials VARCHAR(100), -- 'RN', 'LPN', 'LVN'
  
  -- Access
  access_code VARCHAR(10) UNIQUE, -- Simple PIN for quick login
  last_login_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  
  -- Training
  training_completed BOOLEAN DEFAULT false,
  training_completed_date DATE,
  training_certificate_url TEXT,
  
  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES providers(id),
  deactivated_at TIMESTAMPTZ,
  deactivated_reason TEXT
);

-- Compliance and reporting
CREATE TABLE IF NOT EXISTS offsite_compliance_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  offsite_location_id UUID REFERENCES offsite_dosing_locations(id),
  
  -- Report Period
  report_period_start DATE NOT NULL,
  report_period_end DATE NOT NULL,
  report_type VARCHAR(50) NOT NULL, -- 'monthly', 'quarterly', 'annual', 'incident', 'dea'
  
  -- Metrics
  total_kits_delivered INTEGER DEFAULT 0,
  total_doses_administered INTEGER DEFAULT 0,
  doses_administered_on_time INTEGER DEFAULT 0,
  doses_missed INTEGER DEFAULT 0,
  doses_refused INTEGER DEFAULT 0,
  adverse_events_count INTEGER DEFAULT 0,
  transport_incidents INTEGER DEFAULT 0,
  
  -- Compliance Rates
  on_time_administration_rate NUMERIC(5, 2),
  dose_accountability_rate NUMERIC(5, 2),
  documentation_compliance_rate NUMERIC(5, 2),
  
  -- Details
  report_data JSONB,
  findings TEXT,
  corrective_actions TEXT,
  
  -- Submission
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  generated_by UUID REFERENCES providers(id),
  submitted_to_dea BOOLEAN DEFAULT false,
  submitted_to_state BOOLEAN DEFAULT false,
  submission_date DATE,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_offsite_locations_org ON offsite_dosing_locations(organization_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_offsite_locations_type ON offsite_dosing_locations(facility_type);
CREATE INDEX IF NOT EXISTS idx_bottle_kits_patient ON offsite_bottle_kits(patient_id);
CREATE INDEX IF NOT EXISTS idx_bottle_kits_location ON offsite_bottle_kits(offsite_location_id);
CREATE INDEX IF NOT EXISTS idx_bottle_kits_status ON offsite_bottle_kits(kit_status);
CREATE INDEX IF NOT EXISTS idx_bottle_kits_dates ON offsite_bottle_kits(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_dose_admin_kit ON offsite_dose_administration(bottle_kit_id);
CREATE INDEX IF NOT EXISTS idx_dose_admin_patient ON offsite_dose_administration(patient_id);
CREATE INDEX IF NOT EXISTS idx_dose_admin_scheduled ON offsite_dose_administration(scheduled_dose_date, scheduled_dose_time);
CREATE INDEX IF NOT EXISTS idx_dose_admin_status ON offsite_dose_administration(administration_status);
CREATE INDEX IF NOT EXISTS idx_transport_log_kit ON offsite_transport_log(bottle_kit_id);
CREATE INDEX IF NOT EXISTS idx_facility_nurse_location ON offsite_facility_nurse_access(offsite_location_id) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_compliance_reports_location ON offsite_compliance_reports(offsite_location_id);

-- Row Level Security
ALTER TABLE offsite_dosing_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE offsite_bottle_kits ENABLE ROW LEVEL SECURITY;
ALTER TABLE offsite_dose_administration ENABLE ROW LEVEL SECURITY;
ALTER TABLE offsite_transport_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE offsite_facility_nurse_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE offsite_compliance_reports ENABLE ROW LEVEL SECURITY;

-- Policies (service role has full access)
CREATE POLICY offsite_locations_service_role ON offsite_dosing_locations FOR ALL USING (true);
CREATE POLICY offsite_kits_service_role ON offsite_bottle_kits FOR ALL USING (true);
CREATE POLICY offsite_admin_service_role ON offsite_dose_administration FOR ALL USING (true);
CREATE POLICY offsite_transport_service_role ON offsite_transport_log FOR ALL USING (true);
CREATE POLICY offsite_nurse_access_service_role ON offsite_facility_nurse_access FOR ALL USING (true);
CREATE POLICY offsite_compliance_service_role ON offsite_compliance_reports FOR ALL USING (true);

COMMENT ON TABLE offsite_dosing_locations IS 'Nursing homes and inpatient facilities approved for off-site medication dosing';
COMMENT ON TABLE offsite_bottle_kits IS 'Pre-dispensed medication bottles prepared and transported to off-site locations';
COMMENT ON TABLE offsite_dose_administration IS 'Daily medication administration log completed by facility nurses';
COMMENT ON TABLE offsite_transport_log IS 'Transport events and chain of custody tracking for medication bottles';
COMMENT ON TABLE offsite_facility_nurse_access IS 'Authorized facility nurses with access to administer and document doses';
COMMENT ON TABLE offsite_compliance_reports IS 'Regulatory compliance reports for off-site dosing programs';
