-- Michigan Opioid Surveillance and Reporting System
-- Integrates with MiOFR, CDC DOSE-SYS, and Vital Statistics
-- Provides predictive AI analytics for provider decision support

-- Michigan Opioid Surveillance Data
CREATE TABLE IF NOT EXISTS michigan_overdose_surveillance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    
    -- Incident Information
    incident_date TIMESTAMP WITH TIME ZONE NOT NULL,
    incident_type VARCHAR(50) NOT NULL, -- 'fatal', 'nonfatal', 'suspected'
    incident_location VARCHAR(255),
    county VARCHAR(100),
    zip_code VARCHAR(10),
    
    -- Patient Demographics (de-identified for surveillance)
    age_group VARCHAR(20), -- '18-24', '25-34', '35-44', '45-54', '55-64', '65+'
    gender VARCHAR(20),
    race_ethnicity VARCHAR(50),
    
    -- Clinical Information
    substances_involved JSONB, -- Array of substances detected
    prescription_opioids_involved BOOLEAN DEFAULT FALSE,
    illicit_opioids_involved BOOLEAN DEFAULT FALSE,
    fentanyl_detected BOOLEAN DEFAULT FALSE,
    polysubstance_involved BOOLEAN DEFAULT FALSE,
    naloxone_administered BOOLEAN DEFAULT FALSE,
    naloxone_doses_given INTEGER,
    
    -- Emergency Response
    ems_response_time_minutes INTEGER,
    ed_visit BOOLEAN DEFAULT FALSE,
    hospital_admission BOOLEAN DEFAULT FALSE,
    icu_admission BOOLEAN DEFAULT FALSE,
    outcome VARCHAR(50), -- 'survived', 'fatal', 'left_ama', 'transferred'
    
    -- Reporting Information
    miofr_case_number VARCHAR(50),
    miofr_reported BOOLEAN DEFAULT FALSE,
    miofr_reported_date TIMESTAMP WITH TIME ZONE,
    dose_sys_reported BOOLEAN DEFAULT FALSE,
    dose_sys_reported_date TIMESTAMP WITH TIME ZONE,
    vital_stats_reported BOOLEAN DEFAULT FALSE,
    vital_stats_reported_date TIMESTAMP WITH TIME ZONE,
    
    -- Risk Factors
    prior_overdose_history BOOLEAN DEFAULT FALSE,
    mental_health_comorbidity BOOLEAN DEFAULT FALSE,
    recent_incarceration_release BOOLEAN DEFAULT FALSE,
    recent_treatment_discharge BOOLEAN DEFAULT FALSE,
    housing_instability BOOLEAN DEFAULT FALSE,
    
    -- Data Source
    data_source VARCHAR(100), -- 'ems', 'hospital', 'medical_examiner', 'treatment_program'
    reporter_id UUID,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_mi_surveillance_date ON michigan_overdose_surveillance(incident_date);
CREATE INDEX idx_mi_surveillance_county ON michigan_overdose_surveillance(county);
CREATE INDEX idx_mi_surveillance_type ON michigan_overdose_surveillance(incident_type);
CREATE INDEX idx_mi_surveillance_miofr ON michigan_overdose_surveillance(miofr_case_number);

-- CDC DOSE-SYS Integration Data
CREATE TABLE IF NOT EXISTS dose_sys_syndromic_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    
    -- Time Period
    report_week DATE NOT NULL,
    report_year INTEGER NOT NULL,
    epi_week INTEGER NOT NULL,
    
    -- Geographic
    county VARCHAR(100),
    region VARCHAR(100),
    
    -- ED Visit Metrics
    total_ed_visits INTEGER DEFAULT 0,
    overdose_ed_visits INTEGER DEFAULT 0,
    opioid_overdose_visits INTEGER DEFAULT 0,
    heroin_overdose_visits INTEGER DEFAULT 0,
    fentanyl_overdose_visits INTEGER DEFAULT 0,
    prescription_opioid_visits INTEGER DEFAULT 0,
    stimulant_overdose_visits INTEGER DEFAULT 0,
    
    -- Age Stratification
    age_0_17_overdose INTEGER DEFAULT 0,
    age_18_24_overdose INTEGER DEFAULT 0,
    age_25_34_overdose INTEGER DEFAULT 0,
    age_35_44_overdose INTEGER DEFAULT 0,
    age_45_54_overdose INTEGER DEFAULT 0,
    age_55_64_overdose INTEGER DEFAULT 0,
    age_65_plus_overdose INTEGER DEFAULT 0,
    
    -- Trend Indicators
    percent_change_from_prior_week NUMERIC(5,2),
    percent_change_from_prior_year NUMERIC(5,2),
    trend_direction VARCHAR(20), -- 'increasing', 'stable', 'decreasing'
    statistically_significant BOOLEAN DEFAULT FALSE,
    
    -- Syndromic Indicators
    chief_complaint_keywords JSONB, -- overdose, OD, heroin, fentanyl, etc.
    icd_codes_recorded JSONB,
    
    -- CDC Reporting
    cdc_submitted BOOLEAN DEFAULT FALSE,
    cdc_submission_date TIMESTAMP WITH TIME ZONE,
    cdc_confirmation_number VARCHAR(100),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_dose_sys_week ON dose_sys_syndromic_data(report_week);
CREATE INDEX idx_dose_sys_county ON dose_sys_syndromic_data(county);
CREATE INDEX idx_dose_sys_trend ON dose_sys_syndromic_data(trend_direction);

-- Vital Statistics - Drug Overdose Deaths
CREATE TABLE IF NOT EXISTS vital_statistics_overdose_deaths (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Time Information
    death_date DATE NOT NULL,
    death_year INTEGER NOT NULL,
    death_month INTEGER NOT NULL,
    
    -- Geographic
    county_of_death VARCHAR(100),
    county_of_residence VARCHAR(100),
    state_of_residence VARCHAR(2) DEFAULT 'MI',
    
    -- Demographics
    age_at_death INTEGER,
    age_group VARCHAR(20),
    gender VARCHAR(20),
    race VARCHAR(50),
    ethnicity VARCHAR(50),
    education_level VARCHAR(50),
    marital_status VARCHAR(30),
    
    -- Death Information
    manner_of_death VARCHAR(50), -- 'accident', 'suicide', 'homicide', 'undetermined'
    place_of_death VARCHAR(100), -- 'hospital', 'residence', 'other_location'
    autopsy_performed BOOLEAN DEFAULT FALSE,
    
    -- Cause of Death (ICD-10 codes)
    underlying_cause_of_death VARCHAR(10), -- ICD-10 code
    immediate_cause_of_death TEXT,
    contributing_causes JSONB, -- Array of ICD-10 codes
    
    -- Substances Involved (Toxicology)
    opioids_involved BOOLEAN DEFAULT FALSE,
    prescription_opioids JSONB, -- specific medications
    illicit_opioids JSONB, -- heroin, fentanyl, etc.
    fentanyl_detected BOOLEAN DEFAULT FALSE,
    fentanyl_analogs_detected JSONB,
    cocaine_involved BOOLEAN DEFAULT FALSE,
    methamphetamine_involved BOOLEAN DEFAULT FALSE,
    benzodiazepines_involved BOOLEAN DEFAULT FALSE,
    alcohol_involved BOOLEAN DEFAULT FALSE,
    other_substances JSONB,
    polysubstance_death BOOLEAN DEFAULT FALSE,
    
    -- Medical Examiner Information
    medical_examiner_case_number VARCHAR(100),
    toxicology_report_available BOOLEAN DEFAULT FALSE,
    toxicology_report_url TEXT,
    
    -- Reporting to State/Federal
    michigan_death_certificate_number VARCHAR(100),
    reported_to_michigan_dhhs BOOLEAN DEFAULT FALSE,
    reported_to_cdc_wonder BOOLEAN DEFAULT FALSE,
    provisional_count BOOLEAN DEFAULT TRUE, -- becomes FALSE when finalized
    
    -- MiOFR Specific
    miofr_case_id VARCHAR(100),
    miofr_investigation_complete BOOLEAN DEFAULT FALSE,
    miofr_report_date TIMESTAMP WITH TIME ZONE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_vital_stats_death_date ON vital_statistics_overdose_deaths(death_date);
CREATE INDEX idx_vital_stats_county ON vital_statistics_overdose_deaths(county_of_death);
CREATE INDEX idx_vital_stats_year ON vital_statistics_overdose_deaths(death_year);
CREATE INDEX idx_vital_stats_fentanyl ON vital_statistics_overdose_deaths(fentanyl_detected);

-- Predictive AI Models and Risk Scores
CREATE TABLE IF NOT EXISTS opioid_risk_predictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    
    -- Prediction Time
    prediction_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    prediction_horizon_days INTEGER DEFAULT 30, -- 30, 60, 90 day predictions
    
    -- Geographic Unit
    geographic_level VARCHAR(50), -- 'county', 'zip_code', 'region'
    geographic_identifier VARCHAR(100),
    
    -- Predictive Metrics
    predicted_overdose_count INTEGER,
    predicted_fatal_overdose_count INTEGER,
    overdose_risk_score NUMERIC(5,2), -- 0-100 scale
    risk_level VARCHAR(20), -- 'low', 'moderate', 'high', 'critical'
    
    -- Contributing Risk Factors (weighted)
    fentanyl_prevalence_weight NUMERIC(4,2),
    polysubstance_trend_weight NUMERIC(4,2),
    unemployment_rate_weight NUMERIC(4,2),
    treatment_gap_weight NUMERIC(4,2),
    naloxone_availability_weight NUMERIC(4,2),
    prior_overdose_history_weight NUMERIC(4,2),
    
    -- AI Model Information
    model_name VARCHAR(100),
    model_version VARCHAR(20),
    model_accuracy_score NUMERIC(4,2),
    confidence_interval_lower INTEGER,
    confidence_interval_upper INTEGER,
    
    -- Training Data Period
    training_data_start_date DATE,
    training_data_end_date DATE,
    training_sample_size INTEGER,
    
    -- Recommendations
    ai_recommendations JSONB, -- Suggested interventions
    priority_actions TEXT,
    resource_allocation_suggestions JSONB,
    
    -- Validation
    actual_outcome_recorded BOOLEAN DEFAULT FALSE,
    actual_overdose_count INTEGER,
    prediction_accuracy NUMERIC(5,2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_predictions_date ON opioid_risk_predictions(prediction_date);
CREATE INDEX idx_predictions_geo ON opioid_risk_predictions(geographic_identifier);
CREATE INDEX idx_predictions_risk ON opioid_risk_predictions(risk_level);

-- Patient-Level Overdose Risk Scores
CREATE TABLE IF NOT EXISTS patient_overdose_risk_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    patient_id UUID REFERENCES patients(id),
    
    -- Assessment Information
    assessment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assessed_by UUID REFERENCES providers(id),
    
    -- Risk Score
    overall_risk_score NUMERIC(5,2), -- 0-100
    risk_category VARCHAR(20), -- 'low', 'moderate', 'high', 'very_high'
    
    -- Risk Factor Scores (0-10 each)
    prescription_opioid_use_score NUMERIC(3,1),
    high_dose_opioid_score NUMERIC(3,1),
    concurrent_benzodiazepine_score NUMERIC(3,1),
    substance_use_disorder_history_score NUMERIC(3,1),
    mental_health_comorbidity_score NUMERIC(3,1),
    prior_overdose_score NUMERIC(3,1),
    recent_incarceration_score NUMERIC(3,1),
    social_determinants_score NUMERIC(3,1),
    lack_of_naloxone_access_score NUMERIC(3,1),
    polysubstance_use_score NUMERIC(3,1),
    
    -- Clinical Data Sources
    pdmp_data_included BOOLEAN DEFAULT FALSE,
    ehr_data_included BOOLEAN DEFAULT FALSE,
    claims_data_included BOOLEAN DEFAULT FALSE,
    behavioral_health_data_included BOOLEAN DEFAULT FALSE,
    
    -- AI Analysis
    ai_analysis_completed BOOLEAN DEFAULT FALSE,
    ai_model_used VARCHAR(100),
    ai_confidence_score NUMERIC(4,2),
    machine_learning_predictions JSONB,
    
    -- Recommendations
    recommended_interventions JSONB,
    naloxone_prescription_recommended BOOLEAN DEFAULT FALSE,
    medication_for_oud_recommended BOOLEAN DEFAULT FALSE,
    dose_reduction_recommended BOOLEAN DEFAULT FALSE,
    behavioral_health_referral_recommended BOOLEAN DEFAULT FALSE,
    harm_reduction_services_recommended BOOLEAN DEFAULT FALSE,
    
    -- Provider Actions
    provider_reviewed BOOLEAN DEFAULT FALSE,
    provider_reviewed_date TIMESTAMP WITH TIME ZONE,
    interventions_implemented JSONB,
    
    -- Outcome Tracking
    next_assessment_due DATE,
    actual_overdose_occurred BOOLEAN DEFAULT FALSE,
    overdose_date DATE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_patient_risk_patient ON patient_overdose_risk_scores(patient_id);
CREATE INDEX idx_patient_risk_date ON patient_overdose_risk_scores(assessment_date);
CREATE INDEX idx_patient_risk_level ON patient_overdose_risk_scores(risk_category);

-- State Reporting Submissions
CREATE TABLE IF NOT EXISTS michigan_opioid_reporting_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    
    -- Report Information
    report_type VARCHAR(100) NOT NULL, -- 'MiOFR', 'DOSE-SYS', 'Vital-Statistics', 'PDMP'
    reporting_period_start DATE NOT NULL,
    reporting_period_end DATE NOT NULL,
    
    -- Submission Details
    submission_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    submitted_by UUID REFERENCES providers(id),
    submission_method VARCHAR(50), -- 'API', 'Portal', 'Batch-Upload', 'HL7'
    
    -- Data Summary
    total_cases_submitted INTEGER DEFAULT 0,
    fatal_overdoses_submitted INTEGER DEFAULT 0,
    nonfatal_overdoses_submitted INTEGER DEFAULT 0,
    
    -- State System Information
    state_confirmation_number VARCHAR(100),
    state_batch_id VARCHAR(100),
    state_acknowledgment_received BOOLEAN DEFAULT FALSE,
    state_acknowledgment_date TIMESTAMP WITH TIME ZONE,
    
    -- Submission Status
    submission_status VARCHAR(50) DEFAULT 'submitted', -- 'submitted', 'accepted', 'rejected', 'pending_review'
    validation_errors JSONB,
    rejection_reason TEXT,
    
    -- File Information (if batch upload)
    submitted_file_url TEXT,
    submitted_file_name VARCHAR(255),
    file_format VARCHAR(20), -- 'CSV', 'XML', 'JSON', 'HL7'
    
    -- Compliance
    required_by_regulation BOOLEAN DEFAULT TRUE,
    regulation_citation TEXT,
    submission_deadline DATE,
    submitted_on_time BOOLEAN DEFAULT TRUE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_mi_reporting_type ON michigan_opioid_reporting_submissions(report_type);
CREATE INDEX idx_mi_reporting_date ON michigan_opioid_reporting_submissions(submission_date);
CREATE INDEX idx_mi_reporting_status ON michigan_opioid_reporting_submissions(submission_status);

-- Dashboard KPIs and Aggregated Metrics
CREATE TABLE IF NOT EXISTS michigan_surveillance_kpis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Time Period
    metric_date DATE NOT NULL,
    metric_month INTEGER,
    metric_year INTEGER,
    
    -- Geographic
    county VARCHAR(100),
    region VARCHAR(100) DEFAULT 'State',
    
    -- Overdose Metrics
    total_overdoses INTEGER DEFAULT 0,
    fatal_overdoses INTEGER DEFAULT 0,
    nonfatal_overdoses INTEGER DEFAULT 0,
    fatal_overdose_rate_per_100k NUMERIC(6,2),
    
    -- Trends
    change_from_prior_month_pct NUMERIC(5,2),
    change_from_prior_year_pct NUMERIC(5,2),
    trend_direction VARCHAR(20),
    
    -- Substance-Specific
    fentanyl_involved_count INTEGER DEFAULT 0,
    heroin_involved_count INTEGER DEFAULT 0,
    prescription_opioid_count INTEGER DEFAULT 0,
    polysubstance_count INTEGER DEFAULT 0,
    
    -- Emergency Response
    naloxone_administrations INTEGER DEFAULT 0,
    naloxone_reversal_success_rate NUMERIC(5,2),
    ems_response_time_median_minutes INTEGER,
    
    -- Treatment Metrics
    patients_in_moud_treatment INTEGER DEFAULT 0,
    new_treatment_admissions INTEGER DEFAULT 0,
    treatment_retention_rate NUMERIC(5,2),
    
    -- Prevention Metrics
    naloxone_kits_distributed INTEGER DEFAULT 0,
    harm_reduction_contacts INTEGER DEFAULT 0,
    provider_detailing_visits INTEGER DEFAULT 0,
    
    -- Predictive Indicators
    predicted_overdoses_next_30_days INTEGER,
    risk_level_next_month VARCHAR(20),
    recommended_naloxone_distribution INTEGER,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_kpis_date ON michigan_surveillance_kpis(metric_date);
CREATE INDEX idx_kpis_county ON michigan_surveillance_kpis(county);

-- Create view for real-time surveillance dashboard
CREATE OR REPLACE VIEW v_michigan_surveillance_dashboard AS
SELECT 
    kpis.metric_date,
    kpis.county,
    kpis.region,
    kpis.total_overdoses,
    kpis.fatal_overdoses,
    kpis.nonfatal_overdoses,
    kpis.fatal_overdose_rate_per_100k,
    kpis.change_from_prior_month_pct,
    kpis.change_from_prior_year_pct,
    kpis.trend_direction,
    kpis.fentanyl_involved_count,
    kpis.naloxone_administrations,
    kpis.naloxone_reversal_success_rate,
    kpis.patients_in_moud_treatment,
    kpis.predicted_overdoses_next_30_days,
    kpis.risk_level_next_month,
    COUNT(DISTINCT mos.id) as total_incidents_reported,
    COUNT(DISTINCT CASE WHEN mos.miofr_reported THEN mos.id END) as miofr_submissions,
    COUNT(DISTINCT CASE WHEN mos.dose_sys_reported THEN mos.id END) as dose_sys_submissions,
    COUNT(DISTINCT vsd.id) as vital_stats_deaths,
    AVG(prp.overdose_risk_score) as avg_community_risk_score
FROM michigan_surveillance_kpis kpis
LEFT JOIN michigan_overdose_surveillance mos 
    ON DATE(mos.incident_date) = kpis.metric_date 
    AND (mos.county = kpis.county OR kpis.county IS NULL)
LEFT JOIN vital_statistics_overdose_deaths vsd
    ON vsd.death_date = kpis.metric_date
    AND (vsd.county_of_death = kpis.county OR kpis.county IS NULL)
LEFT JOIN opioid_risk_predictions prp
    ON DATE(prp.prediction_date) = kpis.metric_date
    AND (prp.geographic_identifier = kpis.county OR kpis.county IS NULL)
GROUP BY 
    kpis.metric_date,
    kpis.county,
    kpis.region,
    kpis.total_overdoses,
    kpis.fatal_overdoses,
    kpis.nonfatal_overdoses,
    kpis.fatal_overdose_rate_per_100k,
    kpis.change_from_prior_month_pct,
    kpis.change_from_prior_year_pct,
    kpis.trend_direction,
    kpis.fentanyl_involved_count,
    kpis.naloxone_administrations,
    kpis.naloxone_reversal_success_rate,
    kpis.patients_in_moud_treatment,
    kpis.predicted_overdoses_next_30_days,
    kpis.risk_level_next_month;

-- Insert sample surveillance data for demonstration
INSERT INTO michigan_surveillance_kpis (
    metric_date, county, region,
    total_overdoses, fatal_overdoses, nonfatal_overdoses,
    fatal_overdose_rate_per_100k, change_from_prior_month_pct,
    fentanyl_involved_count, naloxone_administrations,
    patients_in_moud_treatment, predicted_overdoses_next_30_days,
    risk_level_next_month
) VALUES
(CURRENT_DATE - INTERVAL '1 day', 'Wayne', 'Southeast', 28, 4, 24, 12.3, -5.2, 19, 22, 487, 32, 'high'),
(CURRENT_DATE - INTERVAL '1 day', 'Oakland', 'Southeast', 15, 2, 13, 8.7, 3.1, 9, 12, 312, 18, 'moderate'),
(CURRENT_DATE - INTERVAL '1 day', 'Kent', 'West', 12, 1, 11, 9.2, -2.4, 7, 10, 245, 14, 'moderate'),
(CURRENT_DATE - INTERVAL '1 day', NULL, 'State', 142, 18, 124, 10.8, -1.7, 89, 108, 2847, 165, 'high');

-- Adding MiPHY (Michigan Profile for Healthy Youth) surveillance tables
CREATE TABLE IF NOT EXISTS miphy_youth_substance_use (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Survey Information
    survey_year INTEGER NOT NULL,
    county VARCHAR(100) NOT NULL,
    grade_level VARCHAR(50) NOT NULL, -- 'middle_school', 'high_school', '8th_grade', '10th_grade', '12th_grade'
    school_district VARCHAR(255),
    
    -- Alcohol Use Past 30 Days
    alcohol_use_past_30_days_pct NUMERIC(5,2),
    binge_drinking_past_30_days_pct NUMERIC(5,2),
    ease_of_access_to_alcohol_pct NUMERIC(5,2),
    
    -- Drug Use Past 30 Days
    marijuana_use_past_30_days_pct NUMERIC(5,2),
    club_drug_use_past_30_days_pct NUMERIC(5,2),
    cocaine_use_past_30_days_pct NUMERIC(5,2),
    heroin_use_past_30_days_pct NUMERIC(5,2),
    inhalant_use_past_30_days_pct NUMERIC(5,2),
    methamphetamine_use_past_30_days_pct NUMERIC(5,2),
    needle_use_past_30_days_pct NUMERIC(5,2),
    prescription_drug_use_past_30_days_pct NUMERIC(5,2),
    painkiller_use_past_30_days_pct NUMERIC(5,2),
    
    -- Lifetime Use
    lifetime_use_of_cocaine_pct NUMERIC(5,2),
    lifetime_use_of_injectable_drugs_pct NUMERIC(5,2),
    lifetime_use_of_methamphetamine_pct NUMERIC(5,2),
    
    -- Parental Attitudes and Access
    parents_disapprove_of_alcohol_use_pct NUMERIC(5,2),
    parents_disapprove_of_marijuana_use_pct NUMERIC(5,2),
    ease_of_access_to_marijuana_pct NUMERIC(5,2),
    
    -- Risk Factors
    risk_of_alcohol_use_pct NUMERIC(5,2),
    risk_of_marijuana_use_pct NUMERIC(5,2),
    risk_of_prescription_drugs_pct NUMERIC(5,2),
    
    -- Sample Size
    total_students_surveyed INTEGER,
    response_rate NUMERIC(5,2),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_miphy_year_county ON miphy_youth_substance_use(survey_year, county);
CREATE INDEX idx_miphy_grade ON miphy_youth_substance_use(grade_level);

-- Adding Infectious Sequelae of Injection Drug Use (IDU) surveillance
CREATE TABLE IF NOT EXISTS idu_infectious_sequelae (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    
    -- Time Period
    report_year INTEGER NOT NULL,
    report_quarter INTEGER,
    county VARCHAR(100),
    region VARCHAR(100),
    
    -- Hospitalizations from IDU
    total_idu_hospitalizations INTEGER DEFAULT 0,
    endocarditis_hospitalizations INTEGER DEFAULT 0,
    sepsis_hospitalizations INTEGER DEFAULT 0,
    skin_soft_tissue_infections INTEGER DEFAULT 0,
    osteomyelitis_hospitalizations INTEGER DEFAULT 0,
    hepatitis_c_hospitalizations INTEGER DEFAULT 0,
    hepatitis_b_hospitalizations INTEGER DEFAULT 0,
    hiv_hospitalizations INTEGER DEFAULT 0,
    
    -- Deaths from IDU Complications
    total_idu_deaths INTEGER DEFAULT 0,
    endocarditis_deaths INTEGER DEFAULT 0,
    sepsis_deaths INTEGER DEFAULT 0,
    hiv_aids_deaths INTEGER DEFAULT 0,
    
    -- Healthcare Costs
    total_hospitalization_costs_usd NUMERIC(12,2),
    average_cost_per_event_usd NUMERIC(10,2),
    average_length_of_stay_days NUMERIC(5,2),
    icu_admissions INTEGER DEFAULT 0,
    
    -- Prevention Metrics
    syringe_service_programs_active INTEGER DEFAULT 0,
    sterile_syringes_distributed INTEGER DEFAULT 0,
    safe_disposal_services_accessed INTEGER DEFAULT 0,
    hepatitis_c_screenings_performed INTEGER DEFAULT 0,
    hepatitis_c_linkage_to_care INTEGER DEFAULT 0,
    hiv_screenings_performed INTEGER DEFAULT 0,
    
    -- Trends
    percent_change_from_prior_year NUMERIC(5,2),
    trend_direction VARCHAR(20),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_idu_year ON idu_infectious_sequelae(report_year);
CREATE INDEX idx_idu_county ON idu_infectious_sequelae(county);

-- Adding CDC/ATSDR Social Vulnerability Index (SVI) data
CREATE TABLE IF NOT EXISTS social_vulnerability_index (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Geographic Information
    census_tract VARCHAR(20) NOT NULL,
    county VARCHAR(100) NOT NULL,
    state VARCHAR(2) DEFAULT 'MI',
    svi_year INTEGER NOT NULL,
    
    -- Overall SVI Score (0-1, higher = more vulnerable)
    overall_svi_score NUMERIC(5,4),
    overall_svi_percentile NUMERIC(5,2), -- 0-100
    overall_vulnerability_category VARCHAR(20), -- 'low', 'moderate', 'high', 'very_high'
    
    -- Theme 1: Socioeconomic Status
    below_150_poverty_pct NUMERIC(5,2),
    unemployed_pct NUMERIC(5,2),
    housing_cost_burden_pct NUMERIC(5,2),
    no_high_school_diploma_pct NUMERIC(5,2),
    no_health_insurance_pct NUMERIC(5,2),
    socioeconomic_theme_score NUMERIC(5,4),
    socioeconomic_percentile NUMERIC(5,2),
    
    -- Theme 2: Household Characteristics
    aged_65_and_older_pct NUMERIC(5,2),
    aged_17_and_younger_pct NUMERIC(5,2),
    civilian_with_disability_pct NUMERIC(5,2),
    single_parent_households_pct NUMERIC(5,2),
    english_language_proficiency_pct NUMERIC(5,2),
    household_characteristics_score NUMERIC(5,4),
    household_characteristics_percentile NUMERIC(5,2),
    
    -- Theme 3: Racial & Ethnic Minority Status
    minority_status_pct NUMERIC(5,2), -- persons who are not white non-Hispanic
    racial_ethnic_minority_score NUMERIC(5,4),
    racial_ethnic_minority_percentile NUMERIC(5,2),
    
    -- Theme 4: Housing Type & Transportation
    multi_unit_structures_pct NUMERIC(5,2),
    mobile_homes_pct NUMERIC(5,2),
    crowding_pct NUMERIC(5,2),
    no_vehicle_pct NUMERIC(5,2),
    group_quarters_pct NUMERIC(5,2),
    housing_transportation_score NUMERIC(5,4),
    housing_transportation_percentile NUMERIC(5,2),
    
    -- Population
    total_population INTEGER,
    population_estimate_year INTEGER,
    
    -- Opioid Risk Correlation
    correlated_with_overdose_rate BOOLEAN DEFAULT FALSE,
    opioid_risk_weight NUMERIC(4,2), -- How much this SVI contributes to opioid risk
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_svi_tract ON social_vulnerability_index(census_tract);
CREATE INDEX idx_svi_county ON social_vulnerability_index(county);
CREATE INDEX idx_svi_overall_score ON social_vulnerability_index(overall_svi_score);
CREATE INDEX idx_svi_year ON social_vulnerability_index(svi_year);

-- Adding ODMAP (Overdose Detection Mapping Application Program) real-time alerts
CREATE TABLE IF NOT EXISTS odmap_realtime_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    
    -- Alert Information
    alert_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    alert_type VARCHAR(50) NOT NULL, -- 'spike_detected', 'cluster_identified', 'geographic_hotspot', 'substance_alert'
    alert_level VARCHAR(20) NOT NULL, -- 'watch', 'warning', 'critical'
    
    -- Geographic
    county VARCHAR(100),
    zip_code VARCHAR(10),
    latitude NUMERIC(10, 7),
    longitude NUMERIC(10, 7),
    geofence_radius_miles NUMERIC(5,2),
    
    -- Overdose Details
    overdoses_in_timeframe INTEGER,
    timeframe_hours INTEGER DEFAULT 24,
    fatal_overdoses INTEGER DEFAULT 0,
    nonfatal_overdoses INTEGER DEFAULT 0,
    naloxone_reversals INTEGER DEFAULT 0,
    
    -- Spike Detection
    baseline_average NUMERIC(6,2),
    percent_above_baseline NUMERIC(6,2),
    statistically_significant BOOLEAN DEFAULT FALSE,
    p_value NUMERIC(6,4),
    
    -- Substance Intelligence
    suspected_substance VARCHAR(255),
    novel_adulterant_suspected BOOLEAN DEFAULT FALSE,
    adulterant_details TEXT,
    batch_contamination_suspected BOOLEAN DEFAULT FALSE,
    
    -- Response Actions
    alert_sent_to_ems BOOLEAN DEFAULT FALSE,
    alert_sent_to_public_health BOOLEAN DEFAULT FALSE,
    alert_sent_to_law_enforcement BOOLEAN DEFAULT FALSE,
    community_alert_issued BOOLEAN DEFAULT FALSE,
    media_notification_sent BOOLEAN DEFAULT FALSE,
    
    -- Odmap Integration
    odmap_case_id VARCHAR(100),
    odmap_region_id VARCHAR(50),
    synced_to_national_odmap BOOLEAN DEFAULT FALSE,
    sync_timestamp TIMESTAMP WITH TIME ZONE,
    
    -- Response Tracking
    response_initiated BOOLEAN DEFAULT FALSE,
    response_initiated_timestamp TIMESTAMP WITH TIME ZONE,
    harm_reduction_deployed BOOLEAN DEFAULT FALSE,
    naloxone_distribution_increased BOOLEAN DEFAULT FALSE,
    provider_alert_sent BOOLEAN DEFAULT FALSE,
    
    -- Alert Resolution
    alert_status VARCHAR(30) DEFAULT 'active', -- 'active', 'monitoring', 'resolved'
    resolved_timestamp TIMESTAMP WITH TIME ZONE,
    resolution_notes TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_odmap_timestamp ON odmap_realtime_alerts(alert_timestamp);
CREATE INDEX idx_odmap_county ON odmap_realtime_alerts(county);
CREATE INDEX idx_odmap_level ON odmap_realtime_alerts(alert_level);
CREATE INDEX idx_odmap_status ON odmap_realtime_alerts(alert_status);

-- Insert sample MiPHY data (Alcona County High School example from image)
INSERT INTO miphy_youth_substance_use (
    survey_year, county, grade_level,
    alcohol_use_past_30_days_pct, marijuana_use_past_30_days_pct,
    ease_of_access_to_alcohol_pct, ease_of_access_to_marijuana_pct,
    prescription_drug_use_past_30_days_pct, parents_disapprove_of_alcohol_use_pct,
    total_students_surveyed
) VALUES
(2024, 'Alcona', 'high_school', 12.8, 10.4, 46.5, 33.6, 2.6, 92.3, 287),
(2022, 'Alcona', 'high_school', 13.6, 10.8, 63.2, 38.9, 0.0, 87.2, 294),
(2020, 'Alcona', 'high_school', 31.9, 19.3, 66.3, 49.4, 2.4, 89.5, 312);

-- Insert sample IDU surveillance data (from image: $1.5B costs, 221,000 hospitalizations, 5,000 deaths)
INSERT INTO idu_infectious_sequelae (
    report_year, county, region,
    total_idu_hospitalizations, endocarditis_hospitalizations,
    sepsis_hospitalizations, total_idu_deaths,
    total_hospitalization_costs_usd, average_cost_per_event_usd,
    sterile_syringes_distributed, syringe_service_programs_active
) VALUES
(2022, NULL, 'State', 221000, 4034, 4800, 5000, 1500000000, 103020, 2500000, 12);

-- Insert sample SVI data
INSERT INTO social_vulnerability_index (
    census_tract, county, svi_year,
    overall_svi_score, overall_svi_percentile, overall_vulnerability_category,
    below_150_poverty_pct, unemployed_pct, no_health_insurance_pct,
    aged_65_and_older_pct, minority_status_pct, no_vehicle_pct,
    socioeconomic_theme_score, household_characteristics_score,
    racial_ethnic_minority_score, housing_transportation_score,
    total_population, opioid_risk_weight
) VALUES
('26163001100', 'Wayne', 2020, 0.8542, 85.4, 'very_high', 32.5, 15.2, 18.4, 14.3, 78.2, 22.1, 0.8234, 0.7123, 0.9245, 0.7856, 4200, 32.4),
('26125001200', 'Oakland', 2020, 0.4123, 41.2, 'moderate', 12.1, 6.3, 8.2, 16.8, 35.2, 5.4, 0.3845, 0.4521, 0.4123, 0.3987, 5800, 18.2);

-- Insert sample ODMAP alert
INSERT INTO odmap_realtime_alerts (
    alert_type, alert_level, county, zip_code,
    overdoses_in_timeframe, timeframe_hours,
    fatal_overdoses, nonfatal_overdoses,
    baseline_average, percent_above_baseline,
    suspected_substance, alert_sent_to_public_health,
    odmap_case_id, alert_status
) VALUES
('spike_detected', 'critical', 'Wayne', '48201', 8, 24, 2, 6, 3.2, 150.0, 'Fentanyl with xylazine', TRUE, 'ODMAP-MI-2024-001234', 'active');
