-- ============================================================================
-- SEED PRIMARY CARE CPT CODES
-- Phase 5.3 of Primary Care Refactoring Roadmap
-- ============================================================================
-- This script seeds the specialty_billing_codes table with common primary care
-- CPT codes. It is idempotent - safe to run multiple times.
-- ============================================================================

-- ============================================================================
-- OFFICE/OUTPATIENT VISIT CODES (E/M)
-- ============================================================================

INSERT INTO specialty_billing_codes (specialty_id, code, description, category, base_rate, code_type, common_modifiers, is_active)
VALUES
-- New Patient Office Visits (99202-99205, 99201 deleted in 2021)
('primary-care', '99202', 'Office visit, new patient, straightforward', 'office_visit', 76.00, 'CPT', ARRAY['25', '95'], true),
('primary-care', '99203', 'Office visit, new patient, low complexity', 'office_visit', 110.00, 'CPT', ARRAY['25', '95'], true),
('primary-care', '99204', 'Office visit, new patient, moderate complexity', 'office_visit', 167.00, 'CPT', ARRAY['25', '95'], true),
('primary-care', '99205', 'Office visit, new patient, high complexity', 'office_visit', 211.00, 'CPT', ARRAY['25', '95'], true),

-- Established Patient Office Visits (99211-99215)
('primary-care', '99211', 'Office visit, established patient, minimal', 'office_visit', 23.00, 'CPT', ARRAY['25'], true),
('primary-care', '99212', 'Office visit, established patient, straightforward', 'office_visit', 46.00, 'CPT', ARRAY['25', '95'], true),
('primary-care', '99213', 'Office visit, established patient, low complexity', 'office_visit', 74.00, 'CPT', ARRAY['25', '95'], true),
('primary-care', '99214', 'Office visit, established patient, moderate complexity', 'office_visit', 109.00, 'CPT', ARRAY['25', '95'], true),
('primary-care', '99215', 'Office visit, established patient, high complexity', 'office_visit', 148.00, 'CPT', ARRAY['25', '95'], true)

ON CONFLICT (specialty_id, code) DO UPDATE SET
    description = EXCLUDED.description,
    base_rate = EXCLUDED.base_rate,
    common_modifiers = EXCLUDED.common_modifiers,
    updated_at = NOW();

-- ============================================================================
-- PREVENTIVE CARE CODES (WELLNESS VISITS)
-- ============================================================================

INSERT INTO specialty_billing_codes (specialty_id, code, description, category, base_rate, code_type, common_modifiers, is_active)
VALUES
-- New Patient Preventive (Age-based)
('primary-care', '99381', 'Preventive visit, new patient, infant (under 1 year)', 'preventive', 138.00, 'CPT', ARRAY['25'], true),
('primary-care', '99382', 'Preventive visit, new patient, early childhood (1-4 years)', 'preventive', 138.00, 'CPT', ARRAY['25'], true),
('primary-care', '99383', 'Preventive visit, new patient, late childhood (5-11 years)', 'preventive', 133.00, 'CPT', ARRAY['25'], true),
('primary-care', '99384', 'Preventive visit, new patient, adolescent (12-17 years)', 'preventive', 150.00, 'CPT', ARRAY['25'], true),
('primary-care', '99385', 'Preventive visit, new patient, adult (18-39 years)', 'preventive', 138.00, 'CPT', ARRAY['25'], true),
('primary-care', '99386', 'Preventive visit, new patient, adult (40-64 years)', 'preventive', 167.00, 'CPT', ARRAY['25'], true),
('primary-care', '99387', 'Preventive visit, new patient, adult (65+ years)', 'preventive', 178.00, 'CPT', ARRAY['25'], true),

-- Established Patient Preventive (Age-based)
('primary-care', '99391', 'Preventive visit, established patient, infant (under 1 year)', 'preventive', 117.00, 'CPT', ARRAY['25'], true),
('primary-care', '99392', 'Preventive visit, established patient, early childhood (1-4 years)', 'preventive', 117.00, 'CPT', ARRAY['25'], true),
('primary-care', '99393', 'Preventive visit, established patient, late childhood (5-11 years)', 'preventive', 112.00, 'CPT', ARRAY['25'], true),
('primary-care', '99394', 'Preventive visit, established patient, adolescent (12-17 years)', 'preventive', 128.00, 'CPT', ARRAY['25'], true),
('primary-care', '99395', 'Preventive visit, established patient, adult (18-39 years)', 'preventive', 126.00, 'CPT', ARRAY['25'], true),
('primary-care', '99396', 'Preventive visit, established patient, adult (40-64 years)', 'preventive', 143.00, 'CPT', ARRAY['25'], true),
('primary-care', '99397', 'Preventive visit, established patient, adult (65+ years)', 'preventive', 153.00, 'CPT', ARRAY['25'], true),

-- Medicare Annual Wellness Visits
('primary-care', 'G0438', 'Annual wellness visit, initial (IPPE)', 'preventive', 175.00, 'HCPCS', NULL, true),
('primary-care', 'G0439', 'Annual wellness visit, subsequent', 'preventive', 118.00, 'HCPCS', NULL, true)

ON CONFLICT (specialty_id, code) DO UPDATE SET
    description = EXCLUDED.description,
    base_rate = EXCLUDED.base_rate,
    updated_at = NOW();

-- ============================================================================
-- IMMUNIZATION ADMINISTRATION CODES
-- ============================================================================

INSERT INTO specialty_billing_codes (specialty_id, code, description, category, base_rate, code_type, common_modifiers, is_active)
VALUES
('primary-care', '90471', 'Immunization administration, first vaccine', 'immunization', 27.00, 'CPT', NULL, true),
('primary-care', '90472', 'Immunization administration, each additional vaccine', 'immunization', 17.00, 'CPT', NULL, true),
('primary-care', '90473', 'Immunization administration, intranasal/oral, first vaccine', 'immunization', 27.00, 'CPT', NULL, true),
('primary-care', '90474', 'Immunization administration, intranasal/oral, each additional', 'immunization', 17.00, 'CPT', NULL, true),
('primary-care', '90460', 'Immunization administration through 18 years, first component', 'immunization', 35.00, 'CPT', NULL, true),
('primary-care', '90461', 'Immunization administration through 18 years, each additional component', 'immunization', 12.00, 'CPT', NULL, true)

ON CONFLICT (specialty_id, code) DO UPDATE SET
    description = EXCLUDED.description,
    base_rate = EXCLUDED.base_rate,
    updated_at = NOW();

-- ============================================================================
-- COMMON PRIMARY CARE PROCEDURES
-- ============================================================================

INSERT INTO specialty_billing_codes (specialty_id, code, description, category, base_rate, code_type, common_modifiers, is_active)
VALUES
('primary-care', '36415', 'Venipuncture (routine blood draw)', 'procedure', 8.00, 'CPT', NULL, true),
('primary-care', '81002', 'Urinalysis, non-automated, without microscopy', 'lab', 4.00, 'CPT', NULL, true),
('primary-care', '81003', 'Urinalysis, automated, without microscopy', 'lab', 4.00, 'CPT', NULL, true),
('primary-care', '82947', 'Glucose, quantitative (blood sugar test)', 'lab', 7.00, 'CPT', NULL, true),
('primary-care', '82948', 'Glucose, blood, reagent strip', 'lab', 5.00, 'CPT', NULL, true),
('primary-care', '85018', 'Blood count; hemoglobin (Hgb)', 'lab', 4.00, 'CPT', NULL, true),
('primary-care', '12001', 'Simple repair of superficial wounds, 2.5 cm or less', 'procedure', 130.00, 'CPT', NULL, true),
('primary-care', '12002', 'Simple repair of superficial wounds, 2.6-7.5 cm', 'procedure', 163.00, 'CPT', NULL, true),
('primary-care', '11200', 'Removal of skin tags, up to 15 lesions', 'procedure', 102.00, 'CPT', NULL, true),
('primary-care', '17110', 'Destruction of benign lesions, up to 14', 'procedure', 98.00, 'CPT', NULL, true)

ON CONFLICT (specialty_id, code) DO UPDATE SET
    description = EXCLUDED.description,
    base_rate = EXCLUDED.base_rate,
    updated_at = NOW();

-- ============================================================================
-- CHRONIC CARE MANAGEMENT CODES
-- ============================================================================

INSERT INTO specialty_billing_codes (specialty_id, code, description, category, base_rate, code_type, common_modifiers, is_active)
VALUES
('primary-care', '99490', 'Chronic care management, first 20 minutes', 'chronic_care', 62.00, 'CPT', NULL, true),
('primary-care', '99439', 'Chronic care management, each additional 20 minutes', 'chronic_care', 47.00, 'CPT', NULL, true),
('primary-care', '99487', 'Complex chronic care management, first 60 minutes', 'chronic_care', 133.00, 'CPT', NULL, true),
('primary-care', '99489', 'Complex chronic care management, each additional 30 minutes', 'chronic_care', 67.00, 'CPT', NULL, true),
('primary-care', '99484', 'Care management for behavioral health conditions', 'chronic_care', 48.00, 'CPT', NULL, true),
('primary-care', '99491', 'Chronic care management by physician, first 30 minutes', 'chronic_care', 84.00, 'CPT', NULL, true)

ON CONFLICT (specialty_id, code) DO UPDATE SET
    description = EXCLUDED.description,
    base_rate = EXCLUDED.base_rate,
    updated_at = NOW();

-- Log successful seed
DO $$
BEGIN
    RAISE NOTICE 'Primary Care CPT codes seeded successfully';
    RAISE NOTICE 'Total codes inserted/updated: 50+';
END $$;

