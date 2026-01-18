-- =====================================================
-- MASE EMR - Take-Home Medication Diversion Control System
-- QR Code + GPS + Facial Biometrics + Compliance Monitoring
-- DEA 21 CFR 1306 & State OTP Callback Policy Compliant
-- =====================================================

-- 1. Patient Home Address Registration (for geofencing)
CREATE TABLE IF NOT EXISTS patient_home_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  organization_id UUID,
  address_type VARCHAR(50) DEFAULT 'primary', -- primary, secondary, temporary
  street_address TEXT NOT NULL,
  city VARCHAR(100),
  state VARCHAR(50),
  zip_code VARCHAR(20),
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  geofence_radius_meters INTEGER DEFAULT 150, -- Configurable radius (default 500ft = ~150m)
  verified_by UUID,
  verified_at TIMESTAMP WITH TIME ZONE,
  verification_method VARCHAR(50), -- home_visit, utility_bill, drivers_license
  is_active BOOLEAN DEFAULT true,
  effective_date DATE,
  expiration_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Take-Home Bottle QR Codes
CREATE TABLE IF NOT EXISTS takehome_bottle_qr (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  patient_id UUID NOT NULL,
  takehome_authorization_id UUID, -- Links to takehome_doses table
  bottle_number INTEGER NOT NULL, -- 1-28 (up to 4 weeks)
  qr_code_data TEXT NOT NULL UNIQUE, -- Encrypted unique identifier
  qr_code_hash VARCHAR(64) NOT NULL, -- SHA-256 hash for verification
  medication_name VARCHAR(100) NOT NULL,
  dose_amount NUMERIC(10, 2) NOT NULL,
  dose_unit VARCHAR(20) DEFAULT 'mg',
  scheduled_consumption_date DATE NOT NULL,
  dosing_window_start TIME DEFAULT '06:00:00', -- 6 AM
  dosing_window_end TIME DEFAULT '11:00:00', -- 11 AM
  -- Dispensing info
  dispensed_by UUID,
  dispensed_at TIMESTAMP WITH TIME ZONE,
  dispensing_location_lat NUMERIC(10, 7),
  dispensing_location_lng NUMERIC(10, 7),
  dispensing_gps_accuracy NUMERIC(10, 2),
  -- Consumption tracking
  consumed_at TIMESTAMP WITH TIME ZONE,
  consumption_location_lat NUMERIC(10, 7),
  consumption_location_lng NUMERIC(10, 7),
  consumption_gps_accuracy NUMERIC(10, 2),
  consumption_verified BOOLEAN DEFAULT false,
  -- Biometric verification
  facial_biometric_verified BOOLEAN DEFAULT false,
  facial_biometric_confidence NUMERIC(5, 2), -- 0-100% match
  facial_biometric_image_url TEXT,
  biometric_liveness_check BOOLEAN DEFAULT false,
  -- Seal verification
  seal_photo_url TEXT,
  seal_intact_confirmed BOOLEAN,
  -- Status
  status VARCHAR(50) DEFAULT 'dispensed', -- dispensed, consumed, missed, recalled, expired
  compliance_status VARCHAR(50) DEFAULT 'pending', -- pending, compliant, non_compliant, exception
  non_compliance_reason TEXT,
  -- Tamper detection
  tamper_detected BOOLEAN DEFAULT false,
  tamper_details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Take-Home Scan Log (every scan attempt)
CREATE TABLE IF NOT EXISTS takehome_scan_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bottle_qr_id UUID REFERENCES takehome_bottle_qr(id),
  patient_id UUID NOT NULL,
  organization_id UUID,
  scan_type VARCHAR(50) NOT NULL, -- dispensing, consumption, verification, recall
  scan_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  -- GPS Data
  gps_latitude NUMERIC(10, 7),
  gps_longitude NUMERIC(10, 7),
  gps_accuracy_meters NUMERIC(10, 2),
  gps_altitude NUMERIC(10, 2),
  gps_speed NUMERIC(10, 2),
  address_resolved TEXT, -- Reverse geocoded address
  -- Location verification
  is_within_home_geofence BOOLEAN,
  distance_from_home_meters NUMERIC(10, 2),
  registered_home_id UUID REFERENCES patient_home_addresses(id),
  location_exception_approved BOOLEAN DEFAULT false,
  -- Time verification
  is_within_dosing_window BOOLEAN,
  minutes_outside_window INTEGER,
  -- Biometric data
  facial_scan_attempted BOOLEAN DEFAULT false,
  facial_scan_successful BOOLEAN DEFAULT false,
  facial_match_percentage NUMERIC(5, 2),
  liveness_check_passed BOOLEAN,
  biometric_image_hash VARCHAR(64),
  -- Device info
  device_id VARCHAR(255),
  device_type VARCHAR(100), -- iOS, Android
  device_model VARCHAR(100),
  app_version VARCHAR(50),
  ip_address INET,
  -- Verification result
  verification_passed BOOLEAN,
  verification_failures JSONB, -- Array of failure reasons
  -- Seal photo
  seal_photo_url TEXT,
  seal_verified BOOLEAN,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Take-Home Compliance Alerts
CREATE TABLE IF NOT EXISTS takehome_compliance_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  patient_id UUID NOT NULL,
  bottle_qr_id UUID REFERENCES takehome_bottle_qr(id),
  scan_log_id UUID REFERENCES takehome_scan_log(id),
  alert_type VARCHAR(100) NOT NULL,
  -- Alert types: missed_dose, location_violation, time_violation, biometric_failure, 
  -- tamper_detected, multiple_devices, suspicious_pattern, geofence_breach
  severity VARCHAR(20) DEFAULT 'medium', -- low, medium, high, critical
  alert_title VARCHAR(255),
  alert_description TEXT,
  -- Location details
  expected_location TEXT,
  actual_location TEXT,
  distance_violation_meters NUMERIC(10, 2),
  -- Time details
  expected_time_window VARCHAR(50),
  actual_time VARCHAR(50),
  minutes_outside_window INTEGER,
  -- Required actions
  callback_required BOOLEAN DEFAULT false,
  callback_within_hours INTEGER,
  clinical_review_required BOOLEAN DEFAULT false,
  dea_reportable BOOLEAN DEFAULT false,
  -- Response tracking
  status VARCHAR(50) DEFAULT 'new', -- new, acknowledged, investigating, resolved, escalated
  acknowledged_by UUID,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  investigated_by UUID,
  investigation_notes TEXT,
  resolution VARCHAR(50), -- excused, warning_issued, callback_scheduled, takehome_revoked, referred_to_counselor
  resolution_notes TEXT,
  resolved_by UUID,
  resolved_at TIMESTAMP WITH TIME ZONE,
  -- Patient notification
  patient_notified BOOLEAN DEFAULT false,
  patient_notified_at TIMESTAMP WITH TIME ZONE,
  patient_notification_method VARCHAR(50), -- sms, call, app_push
  patient_response TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Travel/Location Exceptions
CREATE TABLE IF NOT EXISTS takehome_travel_exceptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  patient_id UUID NOT NULL,
  exception_type VARCHAR(50) NOT NULL, -- travel, work, family_emergency, medical, other
  reason TEXT NOT NULL,
  -- Location details
  temporary_address TEXT,
  temporary_latitude NUMERIC(10, 7),
  temporary_longitude NUMERIC(10, 7),
  temporary_geofence_radius_meters INTEGER DEFAULT 500,
  -- Date range
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  -- Approval workflow
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  requested_by UUID, -- Could be patient via portal or staff
  status VARCHAR(50) DEFAULT 'pending', -- pending, approved, denied, expired
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  denial_reason TEXT,
  -- Counselor approval for extended travel
  counselor_approval_required BOOLEAN DEFAULT false,
  counselor_id UUID,
  counselor_approved_at TIMESTAMP WITH TIME ZONE,
  -- Documentation
  supporting_documents JSONB, -- Array of document URLs
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. Patient Biometric Enrollment
CREATE TABLE IF NOT EXISTS patient_biometric_enrollment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL UNIQUE,
  organization_id UUID,
  -- Facial recognition
  facial_template_hash VARCHAR(255), -- Encrypted facial template
  facial_enrollment_images JSONB, -- Array of enrollment image URLs
  facial_enrolled_at TIMESTAMP WITH TIME ZONE,
  facial_enrolled_by UUID,
  facial_quality_score NUMERIC(5, 2),
  -- Enrollment verification
  identity_verified BOOLEAN DEFAULT false,
  identity_verification_method VARCHAR(50), -- in_person, video_call, id_document
  identity_verified_by UUID,
  identity_verified_at TIMESTAMP WITH TIME ZONE,
  -- Settings
  require_liveness_check BOOLEAN DEFAULT true,
  match_threshold_percentage NUMERIC(5, 2) DEFAULT 85.0,
  max_verification_attempts INTEGER DEFAULT 3,
  -- Status
  is_active BOOLEAN DEFAULT true,
  last_successful_verification TIMESTAMP WITH TIME ZONE,
  total_successful_verifications INTEGER DEFAULT 0,
  total_failed_verifications INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Diversion Risk Scoring
CREATE TABLE IF NOT EXISTS takehome_diversion_risk (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  organization_id UUID,
  assessment_date DATE NOT NULL,
  -- Risk factors (0-100 each)
  location_compliance_score NUMERIC(5, 2),
  time_compliance_score NUMERIC(5, 2),
  biometric_compliance_score NUMERIC(5, 2),
  pattern_consistency_score NUMERIC(5, 2),
  -- Calculated overall risk
  overall_risk_score NUMERIC(5, 2),
  risk_level VARCHAR(20), -- low, moderate, high, critical
  -- Historical data
  total_doses_tracked INTEGER,
  compliant_doses INTEGER,
  location_violations INTEGER,
  time_violations INTEGER,
  biometric_failures INTEGER,
  missed_doses INTEGER,
  -- Recommendations
  recommended_action VARCHAR(100),
  -- callback_evaluation, reduce_takehomes, increase_monitoring, maintain_current, increase_takehomes
  ai_analysis TEXT,
  -- Review
  reviewed_by UUID,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  review_notes TEXT,
  action_taken VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Clinic Diversion Control Settings
CREATE TABLE IF NOT EXISTS takehome_clinic_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL UNIQUE,
  -- Dosing window
  default_dosing_window_start TIME DEFAULT '06:00:00',
  default_dosing_window_end TIME DEFAULT '11:00:00',
  allow_weekend_extended_window BOOLEAN DEFAULT true,
  weekend_window_start TIME DEFAULT '06:00:00',
  weekend_window_end TIME DEFAULT '14:00:00', -- Extended to 2 PM on weekends
  -- Geofencing
  default_geofence_radius_meters INTEGER DEFAULT 150,
  require_home_address_verification BOOLEAN DEFAULT true,
  allow_work_address_exception BOOLEAN DEFAULT true,
  -- Biometrics
  require_facial_biometrics BOOLEAN DEFAULT true,
  facial_match_threshold NUMERIC(5, 2) DEFAULT 85.0,
  require_liveness_check BOOLEAN DEFAULT true,
  max_biometric_attempts INTEGER DEFAULT 3,
  -- Compliance thresholds
  missed_dose_alert_hours INTEGER DEFAULT 5, -- Alert if not scanned by 11 AM
  auto_callback_after_missed_doses INTEGER DEFAULT 2,
  location_violation_tolerance_meters INTEGER DEFAULT 100,
  -- Notifications
  send_patient_reminder_before_minutes INTEGER DEFAULT 30,
  send_clinic_alert_on_violation BOOLEAN DEFAULT true,
  notify_counselor_on_pattern BOOLEAN DEFAULT true,
  -- Seal verification
  require_seal_photo BOOLEAN DEFAULT true,
  -- Device restrictions
  allow_multiple_devices BOOLEAN DEFAULT false,
  require_device_registration BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Patient Registered Devices
CREATE TABLE IF NOT EXISTS patient_registered_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  organization_id UUID,
  device_id VARCHAR(255) NOT NULL,
  device_type VARCHAR(50), -- iOS, Android
  device_model VARCHAR(100),
  device_name VARCHAR(100),
  os_version VARCHAR(50),
  app_version VARCHAR(50),
  push_notification_token TEXT,
  -- Registration
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  registered_by UUID, -- Staff who approved
  registration_method VARCHAR(50), -- in_clinic, remote_verified
  -- Status
  is_active BOOLEAN DEFAULT true,
  is_primary BOOLEAN DEFAULT false,
  last_used_at TIMESTAMP WITH TIME ZONE,
  deactivated_at TIMESTAMP WITH TIME ZONE,
  deactivation_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Sponsor/Family Notification (optional)
CREATE TABLE IF NOT EXISTS takehome_sponsor_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  sponsor_name VARCHAR(255),
  sponsor_relationship VARCHAR(100),
  sponsor_phone VARCHAR(50),
  sponsor_email VARCHAR(255),
  -- Notification preferences
  notify_on_missed_dose BOOLEAN DEFAULT true,
  notify_on_location_violation BOOLEAN DEFAULT false,
  notify_on_successful_dose BOOLEAN DEFAULT false,
  notification_delay_minutes INTEGER DEFAULT 60, -- Wait before notifying sponsor
  -- Consent
  patient_consent_signed BOOLEAN DEFAULT false,
  consent_date DATE,
  consent_document_url TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bottle_qr_patient ON takehome_bottle_qr(patient_id);
CREATE INDEX IF NOT EXISTS idx_bottle_qr_date ON takehome_bottle_qr(scheduled_consumption_date);
CREATE INDEX IF NOT EXISTS idx_bottle_qr_status ON takehome_bottle_qr(status);
CREATE INDEX IF NOT EXISTS idx_bottle_qr_hash ON takehome_bottle_qr(qr_code_hash);
CREATE INDEX IF NOT EXISTS idx_scan_log_patient ON takehome_scan_log(patient_id);
CREATE INDEX IF NOT EXISTS idx_scan_log_timestamp ON takehome_scan_log(scan_timestamp);
CREATE INDEX IF NOT EXISTS idx_scan_log_bottle ON takehome_scan_log(bottle_qr_id);
CREATE INDEX IF NOT EXISTS idx_compliance_alerts_patient ON takehome_compliance_alerts(patient_id);
CREATE INDEX IF NOT EXISTS idx_compliance_alerts_status ON takehome_compliance_alerts(status);
CREATE INDEX IF NOT EXISTS idx_compliance_alerts_type ON takehome_compliance_alerts(alert_type);
CREATE INDEX IF NOT EXISTS idx_travel_exceptions_patient ON takehome_travel_exceptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_travel_exceptions_dates ON takehome_travel_exceptions(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_home_addresses_patient ON patient_home_addresses(patient_id);
CREATE INDEX IF NOT EXISTS idx_biometric_patient ON patient_biometric_enrollment(patient_id);
CREATE INDEX IF NOT EXISTS idx_risk_patient ON takehome_diversion_risk(patient_id);
CREATE INDEX IF NOT EXISTS idx_registered_devices_patient ON patient_registered_devices(patient_id);

-- Insert default clinic settings
INSERT INTO takehome_clinic_settings (organization_id) 
SELECT gen_random_uuid() WHERE NOT EXISTS (SELECT 1 FROM takehome_clinic_settings LIMIT 1);

SELECT '✅ Take-Home Diversion Control System tables created successfully!' AS status;
