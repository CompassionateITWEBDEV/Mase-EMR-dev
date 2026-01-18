-- ============================================================================
-- SEED PRIMARY CARE SPECIALTY FEATURES
-- Phase 5.4 of Primary Care Refactoring Roadmap
-- ============================================================================
-- This script seeds the specialty_features table with primary care specific
-- features. It is idempotent - safe to run multiple times.
-- Aligns with SpecialtyFeature type from types/specialty.ts
-- ============================================================================

-- ============================================================================
-- PRIMARY CARE CORE FEATURES
-- ============================================================================

INSERT INTO specialty_features (specialty_id, feature_code, feature_name, description, is_core_feature)
VALUES
-- Existing features (ensure they're present)
('primary-care', 'icd10', 'ICD-10 Diagnosis Coding', 'Comprehensive diagnosis coding with search and favorites', true),
('primary-care', 'vitals_trending', 'Vitals Trending', 'Historical vital signs analysis with charts and alerts', true),

-- Quality Measures & MIPS
('primary-care', 'quality_measures', 'Quality Measures Tracking', 'Track MIPS/HEDIS quality measures for performance reporting', true),
('primary-care', 'mips_dashboard', 'MIPS Dashboard', 'Real-time Merit-based Incentive Payment System score tracking', true),
('primary-care', 'hedis_measures', 'HEDIS Measures', 'Healthcare Effectiveness Data and Information Set tracking', false),

-- Preventive Care
('primary-care', 'preventive_alerts', 'Preventive Care Alerts', 'Automated alerts for due screenings, vaccinations, and wellness visits', true),
('primary-care', 'immunization_tracking', 'Immunization Registry', 'Track and manage patient immunizations with state registry sync', true),
('primary-care', 'cancer_screening', 'Cancer Screening Reminders', 'Track colorectal, breast, cervical, and lung cancer screening due dates', true),
('primary-care', 'wellness_visits', 'Annual Wellness Visits', 'Medicare AWV and commercial preventive visit tracking', true),

-- Chronic Disease Management
('primary-care', 'chronic_disease', 'Chronic Disease Management', 'Manage patients with diabetes, hypertension, COPD, and other chronic conditions', true),
('primary-care', 'diabetes_dashboard', 'Diabetes Care Dashboard', 'HbA1c tracking, foot exams, eye exams, and nephropathy screening', true),
('primary-care', 'hypertension_mgmt', 'Hypertension Management', 'Blood pressure tracking and control measures', true),
('primary-care', 'ccm_billing', 'Chronic Care Management Billing', 'Track and bill CCM services (99490, 99491, 99487)', true),

-- Medication Management
('primary-care', 'med_reconciliation', 'Medication Reconciliation', 'Comprehensive medication review and reconciliation workflows', true),
('primary-care', 'drug_interactions', 'Drug Interaction Checking', 'Automated drug-drug and drug-allergy interaction alerts', true),
('primary-care', 'e_prescribing', 'E-Prescribing', 'Electronic prescription transmission with PDMP integration', true),
('primary-care', 'refill_queue', 'Refill Request Queue', 'Manage medication refill requests from pharmacies and patients', false),

-- Lab & Diagnostics
('primary-care', 'lab_orders', 'Lab Order Management', 'Order labs with common panels and track results', true),
('primary-care', 'result_alerts', 'Abnormal Result Alerts', 'Automated alerts for critical and abnormal lab values', true),
('primary-care', 'flowsheets', 'Clinical Flowsheets', 'Track trending lab values and clinical measurements over time', false),

-- Care Coordination
('primary-care', 'referral_mgmt', 'Referral Management', 'Track specialist referrals and follow-up appointments', true),
('primary-care', 'care_gaps', 'Care Gap Identification', 'Identify and close care gaps for quality improvement', true),
('primary-care', 'patient_outreach', 'Patient Outreach', 'Automated reminders for appointments, screenings, and follow-ups', false),

-- Documentation
('primary-care', 'smart_phrases', 'Smart Phrases/Dot Phrases', 'Quick text expansion for common documentation patterns', false),
('primary-care', 'visit_templates', 'Visit Templates', 'Pre-built templates for common visit types (wellness, chronic, acute)', true),
('primary-care', 'problem_list', 'Problem List Management', 'Active problem list with ICD-10 coding and prioritization', true),

-- Patient Engagement
('primary-care', 'patient_portal', 'Patient Portal Integration', 'Secure messaging, appointment scheduling, and result viewing', true),
('primary-care', 'patient_education', 'Patient Education Materials', 'Condition-specific handouts and educational resources', false),
('primary-care', 'health_maintenance', 'Health Maintenance Tracking', 'Track preventive care schedules for each patient', true),

-- AI-Assisted Features
('primary-care', 'ai_recommendations', 'AI Clinical Recommendations', 'AI-powered clinical decision support and recommendations', true),
('primary-care', 'ai_documentation', 'AI Documentation Assist', 'AI-assisted note generation and coding suggestions', false),
('primary-care', 'risk_stratification', 'Risk Stratification', 'Identify high-risk patients for proactive care management', true)

ON CONFLICT DO NOTHING;

-- ============================================================================
-- CLINIC SPECIALTY CONFIGURATION (Enable Primary Care by Default)
-- ============================================================================

-- Insert default primary care configuration if not exists
INSERT INTO clinic_specialty_configuration (
    specialty_id, 
    enabled, 
    configured_at, 
    custom_settings
)
VALUES (
    'primary-care',
    true,
    NOW(),
    jsonb_build_object(
        'default_visit_duration', 20,
        'enable_quality_alerts', true,
        'enable_preventive_alerts', true,
        'enable_ai_recommendations', true,
        'chronic_care_programs', ARRAY['diabetes', 'hypertension', 'copd'],
        'enabled_features', ARRAY[
            'quality_measures',
            'preventive_alerts',
            'chronic_disease',
            'med_reconciliation',
            'drug_interactions',
            'lab_orders',
            'care_gaps',
            'ai_recommendations'
        ]
    )
)
ON CONFLICT DO NOTHING;

-- ============================================================================
-- LOG COMPLETION
-- ============================================================================

DO $$
DECLARE
    feature_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO feature_count 
    FROM specialty_features 
    WHERE specialty_id = 'primary-care';
    
    RAISE NOTICE 'Primary Care specialty features seeded successfully';
    RAISE NOTICE 'Total primary care features: %', feature_count;
END $$;

