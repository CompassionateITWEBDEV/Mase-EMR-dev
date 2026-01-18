-- Home Exercise Program (HEP) with Remote Therapeutic Monitoring (RTM)
-- For PT/OT clinics to create exercise programs and monitor patient compliance

-- Exercise library
CREATE TABLE hep_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exercise_name VARCHAR(255) NOT NULL,
  exercise_category VARCHAR(100), -- Strength, Flexibility, Balance, ROM, Cardio, Functional
  body_part VARCHAR(100), -- Shoulder, Knee, Ankle, Hip, Spine, etc.
  description TEXT,
  instructions TEXT,
  video_url TEXT,
  image_url TEXT,
  difficulty_level VARCHAR(50), -- Beginner, Intermediate, Advanced
  equipment_needed TEXT[],
  precautions TEXT,
  contraindications TEXT,
  cpt_code VARCHAR(20), -- RTM codes: 98975-98981
  created_by UUID REFERENCES staff(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  is_active BOOLEAN DEFAULT true
);

-- Patient HEP programs
CREATE TABLE hep_programs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) NOT NULL,
  therapist_id UUID REFERENCES staff(id) NOT NULL,
  program_name VARCHAR(255) NOT NULL,
  diagnosis_codes VARCHAR(20)[],
  start_date DATE NOT NULL,
  end_date DATE,
  frequency VARCHAR(100), -- "2x daily", "3x per week", etc.
  duration_weeks INTEGER,
  program_goals TEXT,
  special_instructions TEXT,
  status VARCHAR(50) DEFAULT 'active', -- active, completed, discontinued
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Exercises assigned to programs
CREATE TABLE hep_program_exercises (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES hep_programs(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES hep_exercises(id),
  exercise_order INTEGER,
  sets INTEGER,
  reps INTEGER,
  hold_duration_seconds INTEGER,
  rest_seconds INTEGER,
  frequency_per_day INTEGER,
  frequency_per_week INTEGER,
  special_instructions TEXT,
  progression_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Patient compliance tracking
CREATE TABLE hep_patient_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES hep_programs(id) ON DELETE CASCADE,
  exercise_id UUID REFERENCES hep_exercises(id),
  patient_id UUID REFERENCES patients(id),
  log_date DATE NOT NULL,
  log_time TIME,
  sets_completed INTEGER,
  reps_completed INTEGER,
  duration_minutes INTEGER,
  pain_level INTEGER CHECK (pain_level BETWEEN 0 AND 10),
  difficulty_rating INTEGER CHECK (difficulty_rating BETWEEN 1 AND 5),
  notes TEXT,
  completed BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Therapist progress reviews
CREATE TABLE hep_progress_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  program_id UUID REFERENCES hep_programs(id) ON DELETE CASCADE,
  patient_id UUID REFERENCES patients(id),
  therapist_id UUID REFERENCES staff(id),
  review_date DATE NOT NULL,
  compliance_percentage NUMERIC(5,2),
  pain_trend VARCHAR(50), -- Improving, Stable, Worsening
  function_improvement TEXT,
  modifications_made TEXT,
  next_review_date DATE,
  billable_minutes INTEGER, -- For RTM billing
  cpt_codes_billed VARCHAR(20)[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- RTM billing tracking
CREATE TABLE rtm_billing_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id),
  therapist_id UUID REFERENCES staff(id),
  program_id UUID REFERENCES hep_programs(id),
  service_month DATE NOT NULL, -- First day of service month
  device_setup_date DATE,
  monitoring_start_date DATE,
  monitoring_end_date DATE,
  total_minutes_monitored INTEGER DEFAULT 0,
  data_transmissions_count INTEGER DEFAULT 0,
  cpt_98975_billed BOOLEAN DEFAULT false, -- Initial setup
  cpt_98976_billed BOOLEAN DEFAULT false, -- Device supply
  cpt_98977_billed BOOLEAN DEFAULT false, -- 16-30 mins
  cpt_98980_billed BOOLEAN DEFAULT false, -- 20 mins first time
  cpt_98981_billed BOOLEAN DEFAULT false, -- Each additional 20 mins
  billing_status VARCHAR(50) DEFAULT 'pending', -- pending, submitted, paid, denied
  claim_id UUID REFERENCES insurance_claims(id),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Patient device/app usage tracking
CREATE TABLE hep_device_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id),
  program_id UUID REFERENCES hep_programs(id),
  login_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  session_duration_minutes INTEGER,
  exercises_viewed INTEGER,
  exercises_completed INTEGER,
  device_type VARCHAR(50), -- mobile, tablet, web
  app_version VARCHAR(20),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Therapist alerts for compliance issues
CREATE TABLE hep_compliance_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id),
  program_id UUID REFERENCES hep_programs(id),
  therapist_id UUID REFERENCES staff(id),
  alert_type VARCHAR(100), -- "No activity 3 days", "High pain reported", "Low compliance"
  alert_date DATE NOT NULL,
  severity VARCHAR(50), -- Low, Medium, High
  is_acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  acknowledged_by UUID REFERENCES staff(id),
  action_taken TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX idx_hep_programs_patient ON hep_programs(patient_id);
CREATE INDEX idx_hep_programs_therapist ON hep_programs(therapist_id);
CREATE INDEX idx_hep_programs_status ON hep_programs(status);
CREATE INDEX idx_hep_patient_logs_program ON hep_patient_logs(program_id);
CREATE INDEX idx_hep_patient_logs_date ON hep_patient_logs(log_date);
CREATE INDEX idx_rtm_billing_patient ON rtm_billing_sessions(patient_id);
CREATE INDEX idx_rtm_billing_month ON rtm_billing_sessions(service_month);
CREATE INDEX idx_hep_compliance_alerts_therapist ON hep_compliance_alerts(therapist_id, is_acknowledged);
