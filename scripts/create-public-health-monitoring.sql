-- Public Health Monitoring and Research Data Science Schema
-- Supports HIV monitoring, vital statistics, outbreak detection, HIS integration

-- HIV/AIDS Monitoring Tables
CREATE TABLE IF NOT EXISTS hiv_patient_monitoring (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id),
    organization_id UUID,
    diagnosis_date DATE,
    linkage_to_care_date DATE,
    linkage_within_30_days BOOLEAN,
    treatment_start_date DATE,
    current_art_regimen TEXT,
    art_adherence_rate NUMERIC,
    viral_load_suppressed BOOLEAN,
    last_viral_load_date DATE,
    last_viral_load_value INTEGER,
    last_cd4_count INTEGER,
    last_cd4_date DATE,
    retention_status VARCHAR(50),
    risk_factors JSONB,
    comorbidities JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vital Statistics Registry
CREATE TABLE IF NOT EXISTS vital_statistics_registry (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID,
    event_type VARCHAR(50) NOT NULL, -- 'birth', 'death', 'fetal_death'
    event_date DATE NOT NULL,
    registration_date DATE NOT NULL,
    registration_within_48hrs BOOLEAN,
    patient_id UUID REFERENCES patients(id),
    certificate_number VARCHAR(100) UNIQUE,
    mother_patient_id UUID REFERENCES patients(id),
    father_name TEXT,
    place_of_event TEXT,
    facility_id UUID,
    attended_by VARCHAR(100),
    cause_of_death TEXT,
    icd_codes JSONB,
    gestational_age_weeks INTEGER,
    birth_weight_grams INTEGER,
    apgar_score_1min INTEGER,
    apgar_score_5min INTEGER,
    data_quality_score NUMERIC,
    completeness_score NUMERIC,
    submitted_to_state BOOLEAN DEFAULT FALSE,
    state_submission_date DATE,
    validation_status VARCHAR(50),
    validation_errors JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_vital_statistics_event_type ON vital_statistics_registry(event_type);
CREATE INDEX idx_vital_statistics_event_date ON vital_statistics_registry(event_date);

-- Disease Outbreak Monitoring
CREATE TABLE IF NOT EXISTS disease_outbreak_monitoring (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID,
    disease_name VARCHAR(255) NOT NULL,
    disease_code VARCHAR(50),
    alert_level VARCHAR(50), -- 'Low', 'Medium', 'High', 'Critical'
    outbreak_status VARCHAR(50), -- 'Monitoring', 'Active Investigation', 'Contained', 'Closed'
    cases_reported INTEGER DEFAULT 0,
    threshold_value INTEGER,
    detection_date DATE,
    first_case_date DATE,
    geographic_area TEXT,
    affected_population_size INTEGER,
    response_initiated BOOLEAN DEFAULT FALSE,
    response_date DATE,
    contact_tracing_completed INTEGER,
    isolation_measures TEXT,
    public_health_notified BOOLEAN DEFAULT FALSE,
    notification_date DATE,
    cdc_reported BOOLEAN DEFAULT FALSE,
    investigation_summary TEXT,
    containment_measures JSONB,
    trend VARCHAR(50), -- 'Increasing', 'Decreasing', 'Stable', 'Cluster Detected'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_outbreak_status ON disease_outbreak_monitoring(outbreak_status);
CREATE INDEX idx_outbreak_alert_level ON disease_outbreak_monitoring(alert_level);

-- Disease Surveillance Cases
CREATE TABLE IF NOT EXISTS disease_surveillance_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    outbreak_id UUID REFERENCES disease_outbreak_monitoring(id),
    patient_id UUID REFERENCES patients(id),
    organization_id UUID,
    case_number VARCHAR(100) UNIQUE,
    disease_name VARCHAR(255),
    diagnosis_date DATE,
    symptom_onset_date DATE,
    reported_date DATE,
    detection_time_days INTEGER,
    case_classification VARCHAR(50), -- 'Suspected', 'Probable', 'Confirmed'
    laboratory_confirmed BOOLEAN,
    hospitalized BOOLEAN,
    outcome VARCHAR(50), -- 'Recovered', 'Ongoing', 'Deceased', 'Unknown'
    contacts_identified INTEGER,
    contacts_traced INTEGER,
    exposure_source TEXT,
    travel_history JSONB,
    risk_factors JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Health Information System Integration Metrics
CREATE TABLE IF NOT EXISTS his_integration_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID,
    metric_date DATE NOT NULL,
    emr_interoperability_score NUMERIC,
    data_quality_index NUMERIC,
    system_integration_score NUMERIC,
    realtime_data_availability NUMERIC,
    cross_facility_exchange_rate NUMERIC,
    unique_patient_identification_rate NUMERIC,
    longitudinal_record_completeness NUMERIC,
    cross_setting_continuity_rate NUMERIC,
    border_region_coordination_rate NUMERIC,
    community_facility_integration_rate NUMERIC,
    facility_based_patients INTEGER,
    community_service_encounters INTEGER,
    border_region_patients INTEGER,
    data_exchange_transactions INTEGER,
    system_uptime_percentage NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_his_metrics_date ON his_integration_metrics(metric_date);

-- Public Health Quality Measures
CREATE TABLE IF NOT EXISTS public_health_quality_measures (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID,
    measure_category VARCHAR(100), -- 'HIV/AIDS', 'Vital Statistics', 'Outbreak Response', 'HIS', 'Patient-Centered'
    measure_name VARCHAR(255) NOT NULL,
    measure_description TEXT,
    current_value NUMERIC,
    target_value NUMERIC,
    benchmark_value NUMERIC,
    unit_of_measure VARCHAR(50),
    trend VARCHAR(50), -- 'up', 'down', 'stable'
    measurement_period_start DATE,
    measurement_period_end DATE,
    data_source VARCHAR(100),
    numerator INTEGER,
    denominator INTEGER,
    exclusions INTEGER,
    performance_met BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_quality_measures_category ON public_health_quality_measures(measure_category);

-- Research Studies Extended
CREATE TABLE IF NOT EXISTS research_studies_extended (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID,
    study_title TEXT NOT NULL,
    study_type VARCHAR(50), -- 'implementation', 'pilot', 'quality_improvement', 'outcomes', 'equity'
    study_status VARCHAR(50), -- 'planning', 'active', 'data_collection', 'analysis', 'completed'
    pi_name VARCHAR(255),
    pi_contact TEXT,
    start_date DATE,
    end_date DATE,
    enrollment_target INTEGER,
    current_enrollment INTEGER,
    irb_number VARCHAR(100),
    irb_status VARCHAR(50), -- 'pending', 'approved', 'exempt'
    irb_approval_date DATE,
    funding_source TEXT,
    grant_number VARCHAR(100),
    funding_amount NUMERIC,
    study_description TEXT,
    research_questions TEXT,
    methodology TEXT,
    outcome_measures JSONB,
    data_collection_methods JSONB,
    population_criteria TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Specialty Program Performance
CREATE TABLE IF NOT EXISTS specialty_program_performance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID,
    specialty_name VARCHAR(255) NOT NULL,
    specialty_code VARCHAR(50),
    reporting_period_start DATE,
    reporting_period_end DATE,
    active_patients INTEGER,
    new_patients INTEGER,
    services_provided JSONB,
    compliance_status VARCHAR(100),
    accreditation_body VARCHAR(100),
    accreditation_expiry DATE,
    key_outcomes JSONB,
    quality_indicators JSONB,
    patient_satisfaction_score NUMERIC,
    staff_count INTEGER,
    staff_certification_rate NUMERIC,
    revenue_generated NUMERIC,
    cost_per_patient NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Evidence-Based Practice Tracking Extended
CREATE TABLE IF NOT EXISTS ebp_tracking_extended (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID,
    ebp_name VARCHAR(255) NOT NULL,
    ebp_category VARCHAR(100),
    implementation_date DATE,
    adoption_rate NUMERIC,
    fidelity_score NUMERIC,
    sustainability_score NUMERIC,
    trained_staff INTEGER,
    total_staff INTEGER,
    last_fidelity_review DATE,
    fidelity_reviewer VARCHAR(255),
    outcomes_tracked JSONB,
    outcome_data JSONB,
    barriers_identified TEXT,
    facilitators_identified TEXT,
    modifications_made TEXT,
    cost_of_implementation NUMERIC,
    roi_calculation NUMERIC,
    evidence_source TEXT,
    evidence_quality_rating VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Data Export Logs
CREATE TABLE IF NOT EXISTS research_data_exports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID,
    exported_by UUID,
    export_name VARCHAR(255),
    data_categories JSONB,
    date_range_start DATE,
    date_range_end DATE,
    export_format VARCHAR(50), -- 'CSV', 'JSON', 'SPSS', 'SAS', 'Stata'
    record_count INTEGER,
    deidentification_method VARCHAR(100),
    hipaa_compliant BOOLEAN DEFAULT TRUE,
    cfr_part2_compliant BOOLEAN DEFAULT TRUE,
    file_path TEXT,
    file_size_bytes BIGINT,
    export_purpose TEXT,
    irb_approval_number VARCHAR(100),
    data_use_agreement_signed BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Predictive Analytics Models
CREATE TABLE IF NOT EXISTS predictive_analytics_models (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID,
    model_name VARCHAR(255) NOT NULL,
    model_type VARCHAR(100), -- 'dropout_risk', 'overdose_risk', 'treatment_response', 'readmission_risk'
    model_version VARCHAR(50),
    algorithm_used VARCHAR(100),
    training_data_size INTEGER,
    training_date DATE,
    validation_auc_roc NUMERIC,
    validation_sensitivity NUMERIC,
    validation_specificity NUMERIC,
    validation_ppv NUMERIC,
    validation_npv NUMERIC,
    feature_importance JSONB,
    hyperparameters JSONB,
    model_status VARCHAR(50), -- 'development', 'validation', 'production', 'retired'
    last_performance_review DATE,
    deployed_date DATE,
    predictions_count INTEGER,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Patient Risk Predictions
CREATE TABLE IF NOT EXISTS patient_risk_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id),
    organization_id UUID,
    model_id UUID REFERENCES predictive_analytics_models(id),
    prediction_date DATE,
    risk_category VARCHAR(50), -- 'Low', 'Medium', 'High'
    risk_score NUMERIC,
    risk_probability NUMERIC,
    contributing_factors JSONB,
    recommended_interventions JSONB,
    intervention_implemented BOOLEAN DEFAULT FALSE,
    intervention_date DATE,
    outcome_observed VARCHAR(50),
    outcome_date DATE,
    prediction_accuracy BOOLEAN,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Network Analysis Data
CREATE TABLE IF NOT EXISTS care_coordination_network (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID,
    analysis_date DATE,
    network_density NUMERIC,
    network_centralization NUMERIC,
    average_path_length NUMERIC,
    clustering_coefficient NUMERIC,
    modularity_score NUMERIC,
    communities_detected INTEGER,
    key_nodes JSONB,
    referral_patterns JSONB,
    bottlenecks_identified JSONB,
    recommendations TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- NLP Clinical Insights
CREATE TABLE IF NOT EXISTS nlp_clinical_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID,
    analysis_date DATE,
    notes_analyzed INTEGER,
    documentation_completeness_score NUMERIC,
    clinical_detail_score NUMERIC,
    compliance_score NUMERIC,
    sentiment_distribution JSONB,
    top_clinical_concepts JSONB,
    risk_factors_extracted JSONB,
    automated_flags_count INTEGER,
    flags_acted_upon INTEGER,
    response_rate NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cost-Effectiveness Analysis
CREATE TABLE IF NOT EXISTS cost_effectiveness_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID,
    intervention_name VARCHAR(255),
    intervention_category VARCHAR(100),
    analysis_period_start DATE,
    analysis_period_end DATE,
    total_cost NUMERIC,
    total_benefits NUMERIC,
    net_benefit NUMERIC,
    cost_per_qaly NUMERIC,
    roi_percentage NUMERIC,
    patients_served INTEGER,
    cost_per_patient NUMERIC,
    cost_savings NUMERIC,
    cost_effectiveness_threshold VARCHAR(100), -- 'Highly cost-effective', 'Cost-effective', 'Not cost-effective'
    sensitivity_analysis JSONB,
    assumptions JSONB,
    data_sources JSONB,
    analyst_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create views for common queries

-- HIV Care Continuum View
CREATE OR REPLACE VIEW hiv_care_continuum AS
SELECT 
    organization_id,
    COUNT(DISTINCT patient_id) as total_diagnosed,
    COUNT(DISTINCT CASE WHEN treatment_start_date IS NOT NULL THEN patient_id END) as on_treatment,
    COUNT(DISTINCT CASE WHEN viral_load_suppressed = TRUE THEN patient_id END) as virally_suppressed,
    ROUND(100.0 * COUNT(DISTINCT CASE WHEN treatment_start_date IS NOT NULL THEN patient_id END) / NULLIF(COUNT(DISTINCT patient_id), 0), 1) as treatment_rate,
    ROUND(100.0 * COUNT(DISTINCT CASE WHEN viral_load_suppressed = TRUE THEN patient_id END) / NULLIF(COUNT(DISTINCT patient_id), 0), 1) as suppression_rate
FROM hiv_patient_monitoring
WHERE diagnosis_date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY organization_id;

-- Vital Statistics Quality View
CREATE OR REPLACE VIEW vital_statistics_quality AS
SELECT 
    organization_id,
    event_type,
    DATE_TRUNC('month', event_date) as month,
    COUNT(*) as total_events,
    COUNT(CASE WHEN registration_within_48hrs = TRUE THEN 1 END) as timely_registrations,
    ROUND(100.0 * COUNT(CASE WHEN registration_within_48hrs = TRUE THEN 1 END) / NULLIF(COUNT(*), 0), 1) as timeliness_rate,
    AVG(data_quality_score) as avg_quality_score,
    AVG(completeness_score) as avg_completeness_score
FROM vital_statistics_registry
GROUP BY organization_id, event_type, DATE_TRUNC('month', event_date);

-- Outbreak Detection Performance View
CREATE OR REPLACE VIEW outbreak_detection_performance AS
SELECT 
    organization_id,
    disease_name,
    COUNT(*) as outbreak_count,
    AVG(EXTRACT(DAY FROM (detection_date - first_case_date))) as avg_detection_time_days,
    COUNT(CASE WHEN response_initiated = TRUE THEN 1 END) as responses_initiated,
    AVG(EXTRACT(DAY FROM (response_date - detection_date))) as avg_response_time_days,
    COUNT(CASE WHEN public_health_notified = TRUE THEN 1 END) as notifications_sent
FROM disease_outbreak_monitoring
WHERE detection_date >= CURRENT_DATE - INTERVAL '12 months'
GROUP BY organization_id, disease_name;

-- Research Study Performance View
CREATE OR REPLACE VIEW research_study_performance AS
SELECT 
    r.organization_id,
    r.study_type,
    r.study_status,
    COUNT(*) as study_count,
    SUM(r.current_enrollment) as total_enrolled,
    SUM(r.enrollment_target) as total_target,
    ROUND(100.0 * SUM(r.current_enrollment) / NULLIF(SUM(r.enrollment_target), 0), 1) as enrollment_rate,
    SUM(r.funding_amount) as total_funding
FROM research_studies_extended r
GROUP BY r.organization_id, r.study_type, r.study_status;

-- Grant permissions
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
