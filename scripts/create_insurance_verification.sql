-- Insurance Eligibility Verification System
CREATE TABLE IF NOT EXISTS insurance_verification_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  insurance_id UUID REFERENCES patient_insurance(id) ON DELETE SET NULL,
  verification_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  verified_by UUID REFERENCES staff(id),
  eligibility_status TEXT NOT NULL CHECK (eligibility_status IN ('active', 'inactive', 'pending', 'error')),
  coverage_start_date DATE,
  coverage_end_date DATE,
  copay_amount DECIMAL(10,2),
  deductible_amount DECIMAL(10,2),
  deductible_met DECIMAL(10,2),
  out_of_pocket_max DECIMAL(10,2),
  out_of_pocket_met DECIMAL(10,2),
  benefits_summary JSONB,
  authorization_required BOOLEAN DEFAULT false,
  response_code TEXT,
  error_message TEXT,
  raw_response JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_insurance_verification_patient ON insurance_verification_history(patient_id);
CREATE INDEX idx_insurance_verification_date ON insurance_verification_history(verification_date DESC);

-- Occupancy Management System
CREATE TABLE IF NOT EXISTS facility_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  location_type TEXT NOT NULL CHECK (location_type IN ('inpatient', 'residential', 'detox', 'php', 'iop', 'outpatient')),
  total_beds INTEGER DEFAULT 0,
  address TEXT,
  phone TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS facility_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  location_id UUID NOT NULL REFERENCES facility_locations(id) ON DELETE CASCADE,
  room_number TEXT NOT NULL,
  room_type TEXT CHECK (room_type IN ('private', 'semi-private', 'shared', 'suite')),
  total_beds INTEGER NOT NULL DEFAULT 1,
  gender_restriction TEXT CHECK (gender_restriction IN ('male', 'female', 'any')),
  ada_compliant BOOLEAN DEFAULT false,
  notes TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(location_id, room_number)
);

CREATE TABLE IF NOT EXISTS facility_beds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES facility_rooms(id) ON DELETE CASCADE,
  bed_number TEXT NOT NULL,
  occupied BOOLEAN DEFAULT false,
  current_patient_id UUID REFERENCES patients(id) ON DELETE SET NULL,
  assignment_date TIMESTAMP WITH TIME ZONE,
  expected_discharge_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(room_id, bed_number)
);

CREATE TABLE IF NOT EXISTS bed_assignment_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bed_id UUID NOT NULL REFERENCES facility_beds(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  assigned_by UUID REFERENCES staff(id),
  assignment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  discharge_date TIMESTAMP WITH TIME ZONE,
  reason_for_move TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_beds_occupied ON facility_beds(occupied) WHERE occupied = true;
CREATE INDEX idx_beds_patient ON facility_beds(current_patient_id) WHERE current_patient_id IS NOT NULL;

-- Appointment Waitlist System
CREATE TABLE IF NOT EXISTS appointment_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES providers(id) ON DELETE SET NULL,
  appointment_type TEXT NOT NULL,
  preferred_days TEXT[], -- ['Monday', 'Wednesday', 'Friday']
  preferred_times TEXT[], -- ['morning', 'afternoon', 'evening']
  earliest_date DATE NOT NULL,
  latest_date DATE,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('urgent', 'high', 'normal', 'low')),
  notes TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'scheduled', 'cancelled', 'expired')),
  scheduled_appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
  added_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notified_count INTEGER DEFAULT 0,
  last_notified TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_waitlist_active ON appointment_waitlist(status) WHERE status = 'active';
CREATE INDEX idx_waitlist_patient ON appointment_waitlist(patient_id);
CREATE INDEX idx_waitlist_priority ON appointment_waitlist(priority, earliest_date);

-- Chart Completion Tracking
CREATE TABLE IF NOT EXISTS required_chart_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name TEXT NOT NULL,
  description TEXT,
  item_type TEXT NOT NULL CHECK (item_type IN ('assessment', 'consent', 'treatment_plan', 'progress_note', 'lab_result', 'medication_review', 'discharge_plan')),
  required_for TEXT[] NOT NULL, -- ['admission', 'weekly', 'monthly', 'discharge']
  due_after_days INTEGER, -- Days after trigger event
  specialty_specific TEXT[], -- ['behavioral-health', 'primary-care', etc.]
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS patient_chart_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  required_item_id UUID NOT NULL REFERENCES required_chart_items(id) ON DELETE CASCADE,
  due_date DATE NOT NULL,
  completed BOOLEAN DEFAULT false,
  completed_date TIMESTAMP WITH TIME ZONE,
  completed_by UUID REFERENCES staff(id),
  document_reference TEXT, -- Link to the actual document
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'overdue', 'completed', 'not_applicable')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_chart_requirements_patient ON patient_chart_requirements(patient_id);
CREATE INDEX idx_chart_requirements_status ON patient_chart_requirements(status, due_date);
CREATE INDEX idx_chart_requirements_overdue ON patient_chart_requirements(due_date) WHERE status = 'pending' AND due_date < CURRENT_DATE;

-- Seed required chart items
INSERT INTO required_chart_items (item_name, description, item_type, required_for, due_after_days, specialty_specific) VALUES
('Initial Assessment', 'Complete initial clinical assessment', 'assessment', ARRAY['admission'], 1, ARRAY['behavioral-health', 'primary-care']),
('Informed Consent', 'Patient consent for treatment', 'consent', ARRAY['admission'], 0, ARRAY['behavioral-health', 'primary-care']),
('Treatment Plan', 'Individualized treatment plan', 'treatment_plan', ARRAY['admission'], 3, ARRAY['behavioral-health', 'primary-care']),
('Weekly Progress Note', 'Weekly progress documentation', 'progress_note', ARRAY['weekly'], 7, ARRAY['behavioral-health']),
('Monthly Medication Review', 'Review all medications', 'medication_review', ARRAY['monthly'], 30, ARRAY['behavioral-health', 'primary-care']),
('Discharge Summary', 'Complete discharge documentation', 'discharge_plan', ARRAY['discharge'], 0, ARRAY['behavioral-health', 'primary-care']),
('PHQ-9 Assessment', 'Depression screening', 'assessment', ARRAY['admission', 'monthly'], 30, ARRAY['behavioral-health', 'psychiatry']),
('COWS Assessment', 'Withdrawal assessment for OTP', 'assessment', ARRAY['admission', 'weekly'], 7, ARRAY['behavioral-health']),
('Lab Results Review', 'Review and document lab results', 'lab_result', ARRAY['admission', 'monthly'], 30, ARRAY['behavioral-health', 'primary-care'])
ON CONFLICT DO NOTHING;

-- Seed sample facility for occupancy
INSERT INTO facility_locations (name, location_type, total_beds, address, phone) VALUES
('Main Campus - Residential', 'residential', 24, '123 Recovery Way, Detroit, MI 48201', '313-555-0100'),
('Detox Unit', 'detox', 12, '123 Recovery Way, Detroit, MI 48201', '313-555-0101'),
('PHP Center', 'php', 30, '456 Wellness Blvd, Detroit, MI 48202', '313-555-0102')
ON CONFLICT DO NOTHING;

COMMENT ON TABLE insurance_verification_history IS 'Real-time insurance eligibility verification tracking';
COMMENT ON TABLE facility_locations IS 'Physical facility locations for occupancy management';
COMMENT ON TABLE facility_beds IS 'Bed-level occupancy tracking for inpatient/residential';
COMMENT ON TABLE appointment_waitlist IS 'Automated waitlist to fill cancelled appointment slots';
COMMENT ON TABLE required_chart_items IS 'Required documentation items for chart completion tracking';
