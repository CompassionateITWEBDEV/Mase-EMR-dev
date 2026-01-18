-- CHW (Community Health Worker) Encounter Tables
-- Based on Social Determinants of Health (SDOH) screening

-- Main CHW Encounters table
CREATE TABLE IF NOT EXISTS chw_encounters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id),
  chw_id UUID REFERENCES staff(id),
  encounter_date DATE NOT NULL DEFAULT CURRENT_DATE,
  encounter_start_time TIME,
  encounter_end_time TIME,
  site_name VARCHAR(255),
  is_first_visit BOOLEAN DEFAULT false,
  status VARCHAR(50) DEFAULT 'in_progress',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Demographics collected during CHW encounter
CREATE TABLE IF NOT EXISTS chw_encounter_demographics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_id UUID REFERENCES chw_encounters(id) ON DELETE CASCADE,
  gender VARCHAR(50),
  age INTEGER,
  arab_ethnicity BOOLEAN,
  hispanic_ethnicity BOOLEAN,
  city VARCHAR(255),
  zip_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'USA',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Housing/Living situation assessment
CREATE TABLE IF NOT EXISTS chw_housing_assessment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_id UUID REFERENCES chw_encounters(id) ON DELETE CASCADE,
  living_situation TEXT,
  lack_of_heat BOOLEAN DEFAULT false,
  lead_paint_pipes BOOLEAN DEFAULT false,
  mold BOOLEAN DEFAULT false,
  oven_stove_not_working BOOLEAN DEFAULT false,
  pest_issues BOOLEAN DEFAULT false,
  smoke_detectors_missing BOOLEAN DEFAULT false,
  water_leaks BOOLEAN DEFAULT false,
  none_of_above BOOLEAN DEFAULT false,
  prefer_not_answer BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Food security assessment
CREATE TABLE IF NOT EXISTS chw_food_security (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_id UUID REFERENCES chw_encounters(id) ON DELETE CASCADE,
  food_worry_frequency VARCHAR(50), -- often, sometimes, never, prefer_not_answer
  food_not_last_frequency VARCHAR(50), -- often, sometimes, never, prefer_not_answer
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Transportation assessment
CREATE TABLE IF NOT EXISTS chw_transportation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_id UUID REFERENCES chw_encounters(id) ON DELETE CASCADE,
  lack_transportation_impact VARCHAR(50), -- yes, no, other, prefer_not_answer
  transportation_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Utilities assessment
CREATE TABLE IF NOT EXISTS chw_utilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_id UUID REFERENCES chw_encounters(id) ON DELETE CASCADE,
  utility_shutoff_threat VARCHAR(100), -- yes_turned_back_on, yes_currently_off, no, other, prefer_not_answer
  affected_utilities TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Employment assessment
CREATE TABLE IF NOT EXISTS chw_employment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_id UUID REFERENCES chw_encounters(id) ON DELETE CASCADE,
  employment_help_needed VARCHAR(100), -- help_finding, help_keeping, no_help_needed, other, prefer_not_answer
  employment_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Family/Community support assessment
CREATE TABLE IF NOT EXISTS chw_family_support (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_id UUID REFERENCES chw_encounters(id) ON DELETE CASCADE,
  daily_living_support VARCHAR(100), -- all_help_needed, no_help_needed, little_more_help, lot_more_help, prefer_not_answer
  support_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Mental health screening (PHQ-2 style)
CREATE TABLE IF NOT EXISTS chw_mental_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_id UUID REFERENCES chw_encounters(id) ON DELETE CASCADE,
  loneliness_frequency VARCHAR(50), -- never, rarely, sometimes, often, always, prefer_not_answer
  little_interest_pleasure VARCHAR(50), -- not_at_all, several_days, more_than_half, nearly_everyday, everyday, prefer_not_answer
  feeling_down_depressed VARCHAR(50), -- several_days, more_than_half, nearly_everyday, everyday, prefer_not_answer
  phq2_score INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Healthcare access
CREATE TABLE IF NOT EXISTS chw_healthcare_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_id UUID REFERENCES chw_encounters(id) ON DELETE CASCADE,
  has_regular_doctor VARCHAR(50), -- yes, no, other, prefer_not_answer
  health_insurance_coverage TEXT,
  additional_challenges TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Health education interests
CREATE TABLE IF NOT EXISTS chw_health_education (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_id UUID REFERENCES chw_encounters(id) ON DELETE CASCADE,
  medication_management BOOLEAN DEFAULT false,
  womens_health BOOLEAN DEFAULT false,
  infant_maternal_health BOOLEAN DEFAULT false,
  preventing_cancer BOOLEAN DEFAULT false,
  preventing_cardiovascular BOOLEAN DEFAULT false,
  reducing_blood_pressure BOOLEAN DEFAULT false,
  managing_diabetes BOOLEAN DEFAULT false,
  healthy_cholesterol BOOLEAN DEFAULT false,
  covid_flu_prevention BOOLEAN DEFAULT false,
  substance_use_addiction BOOLEAN DEFAULT false,
  healthy_eating BOOLEAN DEFAULT false,
  physical_activity BOOLEAN DEFAULT false,
  healthy_sleep BOOLEAN DEFAULT false,
  managing_stress BOOLEAN DEFAULT false,
  oral_health BOOLEAN DEFAULT false,
  lifestyle_modification BOOLEAN DEFAULT false,
  none_needed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Referral requests
CREATE TABLE IF NOT EXISTS chw_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  encounter_id UUID REFERENCES chw_encounters(id) ON DELETE CASCADE,
  referral_type VARCHAR(100),
  referral_status VARCHAR(50) DEFAULT 'pending',
  referral_notes TEXT,
  referred_to_organization VARCHAR(255),
  follow_up_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_chw_encounters_patient ON chw_encounters(patient_id);
CREATE INDEX IF NOT EXISTS idx_chw_encounters_chw ON chw_encounters(chw_id);
CREATE INDEX IF NOT EXISTS idx_chw_encounters_date ON chw_encounters(encounter_date);
CREATE INDEX IF NOT EXISTS idx_chw_referrals_status ON chw_referrals(referral_status);
