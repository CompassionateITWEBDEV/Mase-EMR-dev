-- =====================================================
-- PART 2: Specialty Configuration System
-- =====================================================

-- Clinic Specialty Configuration
CREATE TABLE IF NOT EXISTS clinic_specialty_configuration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  specialty_type TEXT NOT NULL, -- 'behavioral_health', 'primary_care', 'psychiatry', etc.
  enabled BOOLEAN DEFAULT true,
  configured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(organization_id, specialty_type)
);

-- Specialty Features
CREATE TABLE IF NOT EXISTS specialty_features (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  specialty_type TEXT NOT NULL,
  feature_name TEXT NOT NULL,
  feature_description TEXT,
  cpt_codes TEXT[], -- Array of relevant CPT codes
  icd10_codes TEXT[], -- Array of relevant ICD-10 codes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed specialty features
INSERT INTO specialty_features (specialty_type, feature_name, feature_description, cpt_codes, icd10_codes) VALUES
('podiatry', 'Diabetic Foot Care', 'Comprehensive diabetic foot examinations and wound care', ARRAY['11055', '11056', '11057'], ARRAY['E11.621', 'E11.622']),
('podiatry', 'Nail Procedures', 'Ingrown toenail removal and nail surgery', ARRAY['11750', '11765'], ARRAY['L60.0']),
('podiatry', 'Biomechanical Assessment', 'Gait analysis and orthotic evaluation', ARRAY['96000', '96001'], ARRAY['M21.6']),
('obgyn', 'Prenatal Care', 'Comprehensive prenatal visits and monitoring', ARRAY['59400', '59425'], ARRAY['Z34.00', 'Z34.90']),
('obgyn', 'Ultrasound', 'Obstetric ultrasound examinations', ARRAY['76805', '76811'], ARRAY['Z36']),
('psychiatry', 'Psychotherapy', 'Individual therapy sessions', ARRAY['90832', '90834', '90837'], ARRAY['F41.1', 'F32.9']),
('psychiatry', 'Medication Management', 'Psychiatric medication evaluation and management', ARRAY['90863'], ARRAY['F20.9', 'F31.9']),
('cardiology', 'ECG/EKG', 'Electrocardiogram interpretation', ARRAY['93000', '93005'], ARRAY['I50.9']),
('cardiology', 'Stress Testing', 'Cardiac stress test', ARRAY['93015'], ARRAY['I25.10']),
('dermatology', 'Skin Biopsy', 'Skin lesion biopsy', ARRAY['11100', '11101'], ARRAY['D22.9']),
('pediatrics', 'Well-Child Visit', 'Routine pediatric examinations', ARRAY['99381-99385'], ARRAY['Z00.129']),
('urgent_care', 'Laceration Repair', 'Wound closure and suturing', ARRAY['12001-12007'], ARRAY['S01.01']),
('physical_therapy', 'Therapeutic Exercise', 'PT therapeutic exercises', ARRAY['97110'], ARRAY['M25.50']),
('occupational_therapy', 'ADL Training', 'Activities of daily living training', ARRAY['97535'], ARRAY['R26.9']),
('speech_therapy', 'Speech Evaluation', 'Speech-language evaluation', ARRAY['92521'], ARRAY['R47.9']),
('county_health', 'WIC Services', 'Women Infants Children nutrition program', ARRAY['99401'], ARRAY['Z71.3']),
('county_health', 'Immunization Clinic', 'Public health immunizations', ARRAY['90460', '90471'], ARRAY['Z23'])
ON CONFLICT DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_clinic_specialty_org ON clinic_specialty_configuration(organization_id);

SELECT 'Part 2: Specialty Configuration created successfully!' AS status;
