-- ============================================================================
-- ADD PATIENT DEMOGRAPHICS FOR HEALTH EQUITY
-- ============================================================================
-- Extends the patients table with demographic fields needed for health equity
-- analysis including race, ethnicity, language, and geographic information
-- ============================================================================

-- Add demographic columns to patients table
ALTER TABLE patients ADD COLUMN IF NOT EXISTS race VARCHAR(100);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS ethnicity VARCHAR(100);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS preferred_language VARCHAR(100);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS interpreter_needed BOOLEAN DEFAULT false;
ALTER TABLE patients ADD COLUMN IF NOT EXISTS zip_code VARCHAR(20);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS county VARCHAR(100);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS state VARCHAR(50);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS rural_urban_code VARCHAR(50);
ALTER TABLE patients ADD COLUMN IF NOT EXISTS insurance_type VARCHAR(100);

-- Add comments for documentation
COMMENT ON COLUMN patients.race IS 'Patient race: White, Black/African American, Asian, Native American/Alaska Native, Native Hawaiian/Pacific Islander, Other, Multi-racial, Unknown, Declined';
COMMENT ON COLUMN patients.ethnicity IS 'Patient ethnicity: Hispanic/Latino, Non-Hispanic/Latino, Unknown, Declined';
COMMENT ON COLUMN patients.preferred_language IS 'Patient preferred language for communication';
COMMENT ON COLUMN patients.interpreter_needed IS 'Whether patient requires interpreter services';
COMMENT ON COLUMN patients.zip_code IS 'Patient ZIP code for geographic analysis';
COMMENT ON COLUMN patients.county IS 'Patient county for geographic analysis';
COMMENT ON COLUMN patients.state IS 'Patient state for geographic analysis';
COMMENT ON COLUMN patients.rural_urban_code IS 'RUCA classification: Urban, Suburban, Rural, Frontier';
COMMENT ON COLUMN patients.insurance_type IS 'Primary insurance type: Medicaid, Medicare, Commercial, Uninsured, Other';

-- Create indexes for demographic queries
CREATE INDEX IF NOT EXISTS idx_patients_race ON patients(race);
CREATE INDEX IF NOT EXISTS idx_patients_ethnicity ON patients(ethnicity);
CREATE INDEX IF NOT EXISTS idx_patients_language ON patients(preferred_language);
CREATE INDEX IF NOT EXISTS idx_patients_zip ON patients(zip_code);
CREATE INDEX IF NOT EXISTS idx_patients_county ON patients(county);
CREATE INDEX IF NOT EXISTS idx_patients_rural_urban ON patients(rural_urban_code);
CREATE INDEX IF NOT EXISTS idx_patients_insurance_type ON patients(insurance_type);

-- Update existing patients with sample demographic data for testing
-- This assigns realistic demographic distributions
UPDATE patients SET
    race = CASE 
        WHEN random() < 0.60 THEN 'White'
        WHEN random() < 0.75 THEN 'Black/African American'
        WHEN random() < 0.90 THEN 'Hispanic/Latino'
        WHEN random() < 0.95 THEN 'Asian'
        ELSE 'Other/Multi-racial'
    END,
    ethnicity = CASE 
        WHEN random() < 0.18 THEN 'Hispanic/Latino'
        ELSE 'Non-Hispanic/Latino'
    END,
    preferred_language = CASE 
        WHEN random() < 0.85 THEN 'English'
        WHEN random() < 0.95 THEN 'Spanish'
        ELSE 'Other'
    END,
    interpreter_needed = random() < 0.08,
    rural_urban_code = CASE 
        WHEN random() < 0.55 THEN 'Urban'
        WHEN random() < 0.80 THEN 'Suburban'
        ELSE 'Rural'
    END,
    insurance_type = CASE 
        WHEN random() < 0.45 THEN 'Medicaid'
        WHEN random() < 0.65 THEN 'Commercial'
        WHEN random() < 0.80 THEN 'Medicare'
        ELSE 'Uninsured'
    END
WHERE race IS NULL;

-- ============================================================================
-- LOOKUP TABLES FOR DEMOGRAPHIC VALUES
-- ============================================================================

-- Race lookup table
CREATE TABLE IF NOT EXISTS demographic_race_options (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    omb_category VARCHAR(100), -- Office of Management and Budget category
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true
);

INSERT INTO demographic_race_options (code, display_name, omb_category, sort_order) VALUES
('white', 'White', 'White', 1),
('black', 'Black/African American', 'Black or African American', 2),
('asian', 'Asian', 'Asian', 3),
('native_american', 'American Indian/Alaska Native', 'American Indian or Alaska Native', 4),
('pacific_islander', 'Native Hawaiian/Pacific Islander', 'Native Hawaiian or Other Pacific Islander', 5),
('other', 'Other Race', 'Some Other Race', 6),
('multi_racial', 'Two or More Races', 'Two or More Races', 7),
('unknown', 'Unknown', NULL, 8),
('declined', 'Declined to Answer', NULL, 9)
ON CONFLICT (code) DO NOTHING;

-- Ethnicity lookup table
CREATE TABLE IF NOT EXISTS demographic_ethnicity_options (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true
);

INSERT INTO demographic_ethnicity_options (code, display_name, sort_order) VALUES
('hispanic', 'Hispanic or Latino', 1),
('non_hispanic', 'Not Hispanic or Latino', 2),
('unknown', 'Unknown', 3),
('declined', 'Declined to Answer', 4)
ON CONFLICT (code) DO NOTHING;

-- Language lookup table
CREATE TABLE IF NOT EXISTS demographic_language_options (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    iso_code VARCHAR(10),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true
);

INSERT INTO demographic_language_options (code, display_name, iso_code, sort_order) VALUES
('english', 'English', 'en', 1),
('spanish', 'Spanish', 'es', 2),
('chinese_mandarin', 'Chinese (Mandarin)', 'zh', 3),
('chinese_cantonese', 'Chinese (Cantonese)', 'zh', 4),
('vietnamese', 'Vietnamese', 'vi', 5),
('korean', 'Korean', 'ko', 6),
('tagalog', 'Tagalog', 'tl', 7),
('russian', 'Russian', 'ru', 8),
('arabic', 'Arabic', 'ar', 9),
('french', 'French', 'fr', 10),
('portuguese', 'Portuguese', 'pt', 11),
('haitian_creole', 'Haitian Creole', 'ht', 12),
('polish', 'Polish', 'pl', 13),
('hindi', 'Hindi', 'hi', 14),
('other', 'Other', NULL, 99)
ON CONFLICT (code) DO NOTHING;

-- Rural/Urban classification lookup
CREATE TABLE IF NOT EXISTS demographic_rural_urban_options (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true
);

INSERT INTO demographic_rural_urban_options (code, display_name, description, sort_order) VALUES
('urban', 'Urban', 'Metropolitan area with population >= 50,000', 1),
('suburban', 'Suburban', 'Metropolitan area with population 10,000-49,999', 2),
('rural', 'Rural', 'Non-metropolitan area with population 2,500-9,999', 3),
('frontier', 'Frontier', 'Remote area with population < 2,500', 4),
('unknown', 'Unknown', 'Rural/urban classification not determined', 5)
ON CONFLICT (code) DO NOTHING;

-- Insurance type lookup
CREATE TABLE IF NOT EXISTS demographic_insurance_type_options (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    category VARCHAR(50),
    sort_order INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true
);

INSERT INTO demographic_insurance_type_options (code, display_name, category, sort_order) VALUES
('medicaid', 'Medicaid', 'government', 1),
('medicare', 'Medicare', 'government', 2),
('medicare_medicaid', 'Medicare & Medicaid (Dual Eligible)', 'government', 3),
('commercial_hmo', 'Commercial HMO', 'commercial', 4),
('commercial_ppo', 'Commercial PPO', 'commercial', 5),
('commercial_other', 'Other Commercial', 'commercial', 6),
('tricare', 'TRICARE/Military', 'government', 7),
('va', 'VA Benefits', 'government', 8),
('workers_comp', 'Workers Compensation', 'other', 9),
('self_pay', 'Self-Pay/Uninsured', 'uninsured', 10),
('charity_care', 'Charity Care/Sliding Scale', 'uninsured', 11),
('other', 'Other', 'other', 12),
('unknown', 'Unknown', 'unknown', 13)
ON CONFLICT (code) DO NOTHING;

-- Enable RLS on lookup tables
ALTER TABLE demographic_race_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE demographic_ethnicity_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE demographic_language_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE demographic_rural_urban_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE demographic_insurance_type_options ENABLE ROW LEVEL SECURITY;

-- Allow read access to lookup tables
CREATE POLICY "Allow read demographic_race_options" ON demographic_race_options FOR SELECT USING (true);
CREATE POLICY "Allow read demographic_ethnicity_options" ON demographic_ethnicity_options FOR SELECT USING (true);
CREATE POLICY "Allow read demographic_language_options" ON demographic_language_options FOR SELECT USING (true);
CREATE POLICY "Allow read demographic_rural_urban_options" ON demographic_rural_urban_options FOR SELECT USING (true);
CREATE POLICY "Allow read demographic_insurance_type_options" ON demographic_insurance_type_options FOR SELECT USING (true);

-- ============================================================================
-- DONE
-- ============================================================================
SELECT 'Patient demographic fields added successfully!' AS status;

