-- Create tables for specialty configuration
CREATE TABLE IF NOT EXISTS clinic_specialty_configuration (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clinic_id UUID,
    specialty_id VARCHAR(100) NOT NULL,
    enabled BOOLEAN DEFAULT true,
    configured_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    configured_by UUID,
    custom_settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_clinic_specialty_config_clinic ON clinic_specialty_configuration(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinic_specialty_config_specialty ON clinic_specialty_configuration(specialty_id);

-- Create a table for specialty-specific features
CREATE TABLE IF NOT EXISTS specialty_features (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    specialty_id VARCHAR(100) NOT NULL,
    feature_code VARCHAR(100) NOT NULL,
    feature_name VARCHAR(255) NOT NULL,
    description TEXT,
    is_core_feature BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert core specialty features
INSERT INTO specialty_features (specialty_id, feature_code, feature_name, description, is_core_feature) VALUES
-- Podiatry features
('podiatry', 'foot_exam', 'Comprehensive Foot Exams', 'Vascular, neurological, and dermatological foot assessments', true),
('podiatry', 'diabetic_foot', 'Diabetic Foot Care Management', 'Diabetic foot screening, ulcer management, and prevention protocols', true),
('podiatry', 'biomechanics', 'Biomechanical Assessment', 'Gait analysis, pressure mapping, and orthotic prescriptions', true),
('podiatry', 'wound_care', 'Wound Care Documentation', 'Diabetic ulcers, pressure injuries, and post-surgical wound management', true),
('podiatry', 'nail_procedures', 'Nail Procedure Notes', 'Ingrown nails, fungal treatments, and surgical nail procedures', true),
('podiatry', 'orthotics', 'Orthotic Management', 'Custom orthotics, shoe modifications, and DME prescriptions', true),
('podiatry', 'vascular_tests', 'Vascular Testing', 'ABI testing, Doppler studies, and circulation assessments', true),
('podiatry', 'neuropathy_screening', 'Neuropathy Screening', 'Monofilament testing, vibration sense, and neuropathy protocols', true),

-- Behavioral Health features
('behavioral-health', 'mat_dispensing', 'MAT Dispensing', 'Methadone and buprenorphine dispensing', true),
('behavioral-health', 'cows_ciwa', 'COWS/CIWA Assessments', 'Withdrawal assessment tools', true),
('behavioral-health', 'otp_billing', 'OTP Bundle Billing', 'Specialized OTP billing codes', true),

-- Psychiatry features
('psychiatry', 'mse', 'Mental Status Exam', 'Comprehensive MSE documentation', true),
('psychiatry', 'phq9_gad7', 'PHQ-9/GAD-7', 'Depression and anxiety screening', true),

-- OB/GYN features
('obgyn', 'prenatal', 'Prenatal Care Tracking', 'Pregnancy monitoring and documentation', true),
('obgyn', 'labor_delivery', 'Labor & Delivery', 'Birth documentation', true),

-- Cardiology features
('cardiology', 'ecg', 'ECG/EKG Integration', 'Cardiac monitoring', true),
('cardiology', 'stress_test', 'Stress Test Documentation', 'Cardiac stress testing', true),

-- Dermatology features
('dermatology', 'lesion_mapping', 'Lesion Mapping', 'Skin lesion tracking', true),
('dermatology', 'photo_doc', 'Photo Documentation', 'Clinical photography', true),

-- Urgent Care features
('urgent-care', 'fast_checkin', 'Fast Check-In', 'Rapid patient processing', true),
('urgent-care', 'workers_comp', 'Workers Comp', 'Occupational health', true),

-- Pediatrics features
('pediatrics', 'growth_charts', 'Growth Chart Tracking', 'Height/weight percentiles', true),
('pediatrics', 'immunizations', 'Immunization Schedules', 'Vaccine tracking', true),

-- Primary Care features
('primary-care', 'icd10', 'ICD-10 Diagnosis Coding', 'Comprehensive diagnosis coding', true),
('primary-care', 'vitals_trending', 'Vitals Trending', 'Historical vital signs analysis', true)
ON CONFLICT DO NOTHING;

COMMENT ON TABLE clinic_specialty_configuration IS 'Stores which medical specialties each clinic has enabled';
COMMENT ON TABLE specialty_features IS 'Defines available features for each medical specialty';
