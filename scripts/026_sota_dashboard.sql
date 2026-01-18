-- SOTA (State Opioid Treatment Authority) Dashboard Schema
-- Provides dedicated oversight for OTP programs and opioid treatment compliance

-- SOTA OTP Program Registry
CREATE TABLE IF NOT EXISTS sota_otp_programs (
  id SERIAL PRIMARY KEY,
  clinic_id INTEGER REFERENCES state_clinic_registry(id),
  dea_registration VARCHAR(50) NOT NULL,
  samhsa_certification VARCHAR(50),
  accreditation_body VARCHAR(100), -- CARF, Joint Commission, etc.
  accreditation_expiration DATE,
  patient_capacity INTEGER,
  current_census INTEGER,
  medication_types TEXT[], -- methadone, buprenorphine, naltrexone
  program_status VARCHAR(50), -- active, probation, suspended
  last_inspection_date DATE,
  next_inspection_date DATE,
  compliance_score DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SOTA Medication Accountability
CREATE TABLE IF NOT EXISTS sota_medication_tracking (
  id SERIAL PRIMARY KEY,
  clinic_id INTEGER REFERENCES state_clinic_registry(id),
  medication_type VARCHAR(100),
  inventory_received DECIMAL(12,2),
  inventory_dispensed DECIMAL(12,2),
  inventory_wasted DECIMAL(12,2),
  inventory_balance DECIMAL(12,2),
  discrepancy_amount DECIMAL(12,2),
  reporting_period DATE,
  submitted_date TIMESTAMP,
  verified_by VARCHAR(255),
  status VARCHAR(50), -- submitted, verified, flagged
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SOTA Diversion Incidents
CREATE TABLE IF NOT EXISTS sota_diversion_incidents (
  id SERIAL PRIMARY KEY,
  clinic_id INTEGER REFERENCES state_clinic_registry(id),
  incident_date DATE,
  incident_type VARCHAR(100), -- patient diversion, staff diversion, theft, loss
  medication_involved VARCHAR(100),
  amount_involved DECIMAL(10,2),
  patients_affected INTEGER,
  dea_reported BOOLEAN DEFAULT false,
  dea_report_date DATE,
  law_enforcement_notified BOOLEAN DEFAULT false,
  corrective_actions TEXT,
  investigation_status VARCHAR(50),
  resolution_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SOTA Take-Home Authorizations
CREATE TABLE IF NOT EXISTS sota_takehome_authorizations (
  id SERIAL PRIMARY KEY,
  clinic_id INTEGER REFERENCES state_clinic_registry(id),
  patient_count INTEGER,
  total_takehome_doses INTEGER,
  average_days_authorized DECIMAL(5,2),
  recall_rate DECIMAL(5,2), -- percentage of bottles recalled
  callback_compliance_rate DECIMAL(5,2),
  diversion_incidents INTEGER,
  reporting_period DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SOTA Inspections & Site Visits
CREATE TABLE IF NOT EXISTS sota_inspections (
  id SERIAL PRIMARY KEY,
  clinic_id INTEGER REFERENCES state_clinic_registry(id),
  inspection_date DATE,
  inspection_type VARCHAR(100), -- routine, complaint, follow-up, unannounced
  inspector_name VARCHAR(255),
  findings TEXT[],
  deficiencies TEXT[],
  compliance_rating VARCHAR(50), -- full, substantial, conditional, noncompliant
  corrective_action_required BOOLEAN,
  corrective_action_deadline DATE,
  follow_up_required BOOLEAN,
  follow_up_date DATE,
  final_report_url TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- SOTA Patient Outcomes Tracking
CREATE TABLE IF NOT EXISTS sota_patient_outcomes (
  id SERIAL PRIMARY KEY,
  clinic_id INTEGER REFERENCES state_clinic_registry(id),
  reporting_period DATE,
  new_admissions INTEGER,
  active_patients INTEGER,
  successful_discharges INTEGER,
  treatment_dropouts INTEGER,
  overdose_incidents INTEGER,
  overdose_deaths INTEGER,
  avg_retention_days DECIMAL(10,2),
  employment_rate DECIMAL(5,2),
  housing_stability_rate DECIMAL(5,2),
  criminal_justice_involvement_rate DECIMAL(5,2),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMIT;
