CREATE TABLE IF NOT EXISTS quality_measures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  measure_id VARCHAR(50) NOT NULL,
  measure_name TEXT NOT NULL,
  specialty VARCHAR(100),
  category VARCHAR(50), -- outcome, process, patient-experience
  description TEXT,
  numerator_logic TEXT,
  denominator_logic TEXT,
  exclusion_logic TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quality_measure_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  measure_id VARCHAR(50) REFERENCES quality_measures(measure_id),
  patient_id UUID REFERENCES patients(id),
  encounter_id UUID REFERENCES encounters(id),
  performance_year INT NOT NULL,
  performance_quarter INT,
  numerator_eligible BOOLEAN DEFAULT FALSE,
  denominator_eligible BOOLEAN DEFAULT FALSE,
  excluded BOOLEAN DEFAULT FALSE,
  exclusion_reason TEXT,
  data_completeness_met BOOLEAN DEFAULT FALSE,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  recorded_by UUID REFERENCES staff(id)
);

CREATE TABLE IF NOT EXISTS clinical_decision_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rule_name TEXT NOT NULL,
  rule_type VARCHAR(50), -- alert, reminder, guideline, drug-interaction
  specialty VARCHAR(100),
  trigger_conditions JSONB, -- conditions that fire the rule
  severity VARCHAR(20), -- critical, high, medium, low
  recommendation_text TEXT,
  evidence_source TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cds_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id),
  encounter_id UUID REFERENCES encounters(id),
  rule_id UUID REFERENCES clinical_decision_rules(id),
  alert_text TEXT NOT NULL,
  severity VARCHAR(20),
  status VARCHAR(20) DEFAULT 'active', -- active, acknowledged, dismissed, overridden
  acknowledged_by UUID REFERENCES staff(id),
  acknowledged_at TIMESTAMPTZ,
  override_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patient_communications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id),
  communication_type VARCHAR(50), -- sms, email, portal-message, phone
  direction VARCHAR(20), -- inbound, outbound
  subject TEXT,
  message_body TEXT,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  status VARCHAR(30), -- pending, sent, delivered, read, failed
  sent_by UUID REFERENCES staff(id),
  automated BOOLEAN DEFAULT FALSE,
  template_used VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS appointment_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES appointments(id),
  patient_id UUID REFERENCES patients(id),
  reminder_type VARCHAR(20), -- sms, email, phone, portal
  scheduled_send_time TIMESTAMPTZ NOT NULL,
  sent_at TIMESTAMPTZ,
  status VARCHAR(20), -- scheduled, sent, failed, cancelled
  response_received BOOLEAN DEFAULT FALSE,
  response_text TEXT,
  confirmed BOOLEAN,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS price_transparency (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_code VARCHAR(20) NOT NULL, -- CPT code
  service_description TEXT NOT NULL,
  standard_charge DECIMAL(10,2),
  cash_price DECIMAL(10,2),
  min_negotiated_rate DECIMAL(10,2),
  max_negotiated_rate DECIMAL(10,2),
  payer_specific_rates JSONB, -- {payer_name: rate}
  effective_date DATE NOT NULL,
  facility_location VARCHAR(100),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS practice_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_name VARCHAR(200) NOT NULL,
  npi VARCHAR(10),
  tax_id VARCHAR(20),
  address_line1 VARCHAR(200),
  address_line2 VARCHAR(200),
  city VARCHAR(100),
  state VARCHAR(2),
  zip_code VARCHAR(10),
  phone VARCHAR(20),
  fax VARCHAR(20),
  email VARCHAR(100),
  location_type VARCHAR(50), -- main, satellite, mobile
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS voice_transcriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_id UUID REFERENCES encounters(id),
  patient_id UUID REFERENCES patients(id),
  provider_id UUID REFERENCES staff(id),
  audio_duration_seconds INT,
  transcription_text TEXT,
  confidence_score DECIMAL(5,2),
  note_section VARCHAR(50), -- subjective, objective, assessment, plan
  status VARCHAR(20), -- processing, completed, failed, edited
  created_at TIMESTAMPTZ DEFAULT NOW(),
  edited_at TIMESTAMPTZ
);

-- Indexes for performance
CREATE INDEX idx_quality_tracking_patient ON quality_measure_tracking(patient_id);
CREATE INDEX idx_quality_tracking_year ON quality_measure_tracking(performance_year);
CREATE INDEX idx_cds_alerts_patient ON cds_alerts(patient_id);
CREATE INDEX idx_cds_alerts_status ON cds_alerts(status);
CREATE INDEX idx_patient_comms_patient ON patient_communications(patient_id);
CREATE INDEX idx_reminders_appointment ON appointment_reminders(appointment_id);
CREATE INDEX idx_price_transparency_code ON price_transparency(service_code);
CREATE INDEX idx_voice_transcriptions_encounter ON voice_transcriptions(encounter_id);
