-- ============================================================================
-- HEALTH EQUITY SCHEMA
-- ============================================================================
-- Comprehensive database schema for health equity tracking, disparity analysis,
-- and SDOH integration for behavioral health research dashboard
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- HEALTH EQUITY METRICS TABLE
-- Master catalog of health equity metrics and disparity measures
-- ============================================================================
CREATE TABLE IF NOT EXISTS health_equity_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID,
    
    -- Basic Information
    name TEXT NOT NULL,
    code VARCHAR(50) UNIQUE,
    description TEXT,
    metric_type VARCHAR(50) NOT NULL CHECK (metric_type IN (
        'outcome', 'access', 'quality', 'experience', 'sdoh', 'utilization'
    )),
    
    -- Stratification Configuration
    stratification_dimensions TEXT[] DEFAULT ARRAY['race', 'ethnicity', 'gender', 'age_group', 'insurance_type', 'geography'],
    reference_group VARCHAR(100), -- e.g., 'White' for race-based comparisons
    
    -- Target and Threshold
    equity_target NUMERIC(10, 2), -- Target for equity (e.g., < 5% disparity)
    warning_threshold NUMERIC(10, 2) DEFAULT 10.0, -- Warning when disparity exceeds this
    critical_threshold NUMERIC(10, 2) DEFAULT 20.0, -- Critical when disparity exceeds this
    
    -- Benchmark Information
    national_benchmark NUMERIC(10, 2),
    state_benchmark NUMERIC(10, 2),
    benchmark_source VARCHAR(255),
    benchmark_year INTEGER,
    
    -- Data Source Configuration
    data_source VARCHAR(255),
    calculation_method TEXT,
    numerator_definition TEXT,
    denominator_definition TEXT,
    
    -- Reporting
    reporting_period VARCHAR(20) DEFAULT 'quarterly' CHECK (reporting_period IN (
        'daily', 'weekly', 'monthly', 'quarterly', 'annually'
    )),
    higher_is_better BOOLEAN DEFAULT true,
    unit VARCHAR(20) DEFAULT '%',
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_cms_required BOOLEAN DEFAULT false,
    is_ccbhc_required BOOLEAN DEFAULT false,
    measure_steward VARCHAR(255),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID
);

-- ============================================================================
-- HEALTH EQUITY SNAPSHOTS TABLE
-- Point-in-time disparity measurements by demographic group
-- ============================================================================
CREATE TABLE IF NOT EXISTS health_equity_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_id UUID NOT NULL REFERENCES health_equity_metrics(id) ON DELETE CASCADE,
    organization_id UUID,
    
    -- Stratification
    stratification_type VARCHAR(50) NOT NULL, -- race, ethnicity, gender, age_group, insurance, geography
    stratification_value VARCHAR(100) NOT NULL, -- e.g., 'Black', 'Hispanic', 'Rural'
    
    -- Values
    current_value NUMERIC(10, 2) NOT NULL,
    numerator INTEGER,
    denominator INTEGER,
    population_count INTEGER,
    
    -- Reference Comparison
    reference_value NUMERIC(10, 2), -- Value for reference group
    disparity_ratio NUMERIC(10, 4), -- current_value / reference_value
    disparity_difference NUMERIC(10, 2), -- current_value - reference_value
    disparity_index NUMERIC(10, 4), -- Standardized disparity measure
    
    -- Statistical Significance
    confidence_interval_lower NUMERIC(10, 2),
    confidence_interval_upper NUMERIC(10, 2),
    p_value NUMERIC(10, 6),
    is_statistically_significant BOOLEAN,
    
    -- Period Information
    snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
    period_start DATE,
    period_end DATE,
    
    -- Trend
    previous_value NUMERIC(10, 2),
    trend VARCHAR(10) CHECK (trend IN ('improving', 'worsening', 'stable', 'insufficient_data')),
    trend_percentage NUMERIC(10, 2),
    
    -- Status
    meets_equity_target BOOLEAN,
    alert_level VARCHAR(20) CHECK (alert_level IN ('none', 'warning', 'critical')),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    calculation_notes TEXT,
    data_quality_score NUMERIC(5, 2),
    
    -- Unique constraint for one snapshot per metric/stratification/date
    CONSTRAINT unique_equity_snapshot UNIQUE (metric_id, stratification_type, stratification_value, snapshot_date)
);

-- ============================================================================
-- HEALTH EQUITY INITIATIVES TABLE
-- Programs and interventions targeting health disparities
-- ============================================================================
CREATE TABLE IF NOT EXISTS health_equity_initiatives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID,
    
    -- Basic Information
    title TEXT NOT NULL,
    description TEXT,
    initiative_type VARCHAR(50) NOT NULL CHECK (initiative_type IN (
        'intervention', 'program', 'policy', 'outreach', 'training', 'partnership', 'research'
    )),
    
    -- Target Population
    target_demographic_type VARCHAR(50), -- race, ethnicity, geography, etc.
    target_demographic_value VARCHAR(100), -- e.g., 'Hispanic/Latino', 'Rural'
    target_disparity_metric_id UUID REFERENCES health_equity_metrics(id),
    target_population_size INTEGER,
    
    -- Timeline
    start_date DATE NOT NULL,
    end_date DATE,
    status VARCHAR(50) DEFAULT 'planning' CHECK (status IN (
        'planning', 'active', 'paused', 'completed', 'cancelled'
    )),
    
    -- Goals and Progress
    baseline_value NUMERIC(10, 2),
    target_value NUMERIC(10, 2),
    current_progress NUMERIC(10, 2),
    progress_percentage NUMERIC(5, 2),
    
    -- Resources
    lead_contact VARCHAR(255),
    lead_email VARCHAR(255),
    lead_phone VARCHAR(50),
    team_members TEXT[],
    budget_allocated NUMERIC(12, 2),
    budget_spent NUMERIC(12, 2),
    funding_source VARCHAR(255),
    
    -- Outcomes
    participants_enrolled INTEGER DEFAULT 0,
    participants_completed INTEGER DEFAULT 0,
    outcome_summary TEXT,
    lessons_learned TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID
);

-- ============================================================================
-- HEALTH EQUITY GOALS TABLE
-- Disparity reduction targets and tracking
-- ============================================================================
CREATE TABLE IF NOT EXISTS health_equity_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_id UUID NOT NULL REFERENCES health_equity_metrics(id) ON DELETE CASCADE,
    organization_id UUID,
    initiative_id UUID REFERENCES health_equity_initiatives(id),
    
    -- Target Specification
    stratification_type VARCHAR(50) NOT NULL,
    stratification_value VARCHAR(100) NOT NULL,
    
    -- Goal Details
    goal_type VARCHAR(50) NOT NULL CHECK (goal_type IN (
        'eliminate_disparity', 'reduce_disparity', 'achieve_parity', 'improvement', 'maintenance'
    )),
    goal_name VARCHAR(255),
    goal_description TEXT,
    
    -- Values
    baseline_value NUMERIC(10, 2),
    baseline_date DATE,
    target_value NUMERIC(10, 2) NOT NULL,
    target_disparity_reduction NUMERIC(10, 2), -- e.g., 50% reduction in disparity
    
    -- Timeline
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    
    -- Progress
    current_value NUMERIC(10, 2),
    current_disparity NUMERIC(10, 2),
    progress_percentage NUMERIC(5, 2),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN (
        'active', 'achieved', 'not_achieved', 'in_progress', 'cancelled'
    )),
    achieved_date DATE,
    
    -- Milestones
    milestones JSONB DEFAULT '[]'::jsonb,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID
);

-- ============================================================================
-- HEALTH EQUITY BENCHMARKS TABLE
-- External benchmarks for disparity comparison
-- ============================================================================
CREATE TABLE IF NOT EXISTS health_equity_benchmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_id UUID NOT NULL REFERENCES health_equity_metrics(id) ON DELETE CASCADE,
    
    -- Benchmark Source
    benchmark_type VARCHAR(50) NOT NULL CHECK (benchmark_type IN (
        'cms', 'samhsa', 'hedis', 'state', 'national', 'peer', 'accreditation'
    )),
    benchmark_name VARCHAR(255) NOT NULL,
    source_organization VARCHAR(255),
    source_url TEXT,
    
    -- Stratification
    stratification_type VARCHAR(50),
    stratification_value VARCHAR(100),
    
    -- Values
    benchmark_value NUMERIC(10, 2) NOT NULL,
    disparity_threshold NUMERIC(10, 2), -- Acceptable disparity level
    benchmark_year INTEGER,
    
    -- Validity
    effective_date DATE,
    expiration_date DATE,
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    methodology_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SDOH AGGREGATE SCORES TABLE
-- Aggregated SDOH risk scores per patient from CHW encounters
-- ============================================================================
CREATE TABLE IF NOT EXISTS patient_sdoh_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL,
    
    -- Individual Domain Scores (0-100, higher = more risk)
    housing_risk_score NUMERIC(5, 2) DEFAULT 0,
    food_security_risk_score NUMERIC(5, 2) DEFAULT 0,
    transportation_risk_score NUMERIC(5, 2) DEFAULT 0,
    employment_risk_score NUMERIC(5, 2) DEFAULT 0,
    social_support_risk_score NUMERIC(5, 2) DEFAULT 0,
    healthcare_access_risk_score NUMERIC(5, 2) DEFAULT 0,
    utility_risk_score NUMERIC(5, 2) DEFAULT 0,
    mental_health_risk_score NUMERIC(5, 2) DEFAULT 0,
    
    -- Composite Score
    composite_sdoh_score NUMERIC(5, 2) DEFAULT 0,
    risk_level VARCHAR(20) CHECK (risk_level IN ('low', 'moderate', 'high', 'very_high')),
    
    -- Domain Flags
    has_housing_instability BOOLEAN DEFAULT false,
    has_food_insecurity BOOLEAN DEFAULT false,
    has_transportation_barrier BOOLEAN DEFAULT false,
    has_employment_barrier BOOLEAN DEFAULT false,
    has_social_isolation BOOLEAN DEFAULT false,
    has_healthcare_access_barrier BOOLEAN DEFAULT false,
    
    -- Source Information
    last_assessment_date DATE,
    last_chw_encounter_id UUID,
    assessment_count INTEGER DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint - one score record per patient
    CONSTRAINT unique_patient_sdoh UNIQUE (patient_id)
);

-- ============================================================================
-- DISPARITY ALERTS TABLE
-- Automated alerts when disparities exceed thresholds
-- ============================================================================
CREATE TABLE IF NOT EXISTS health_equity_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID,
    metric_id UUID NOT NULL REFERENCES health_equity_metrics(id) ON DELETE CASCADE,
    snapshot_id UUID REFERENCES health_equity_snapshots(id),
    
    -- Alert Details
    alert_type VARCHAR(50) NOT NULL CHECK (alert_type IN (
        'threshold_exceeded', 'trend_worsening', 'new_disparity', 'goal_at_risk', 'data_quality'
    )),
    severity VARCHAR(20) NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
    title TEXT NOT NULL,
    message TEXT,
    
    -- Context
    stratification_type VARCHAR(50),
    stratification_value VARCHAR(100),
    current_value NUMERIC(10, 2),
    threshold_value NUMERIC(10, 2),
    disparity_amount NUMERIC(10, 2),
    
    -- Status
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN (
        'active', 'acknowledged', 'resolved', 'dismissed'
    )),
    acknowledged_by UUID,
    acknowledged_at TIMESTAMPTZ,
    resolved_at TIMESTAMPTZ,
    resolution_notes TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Health Equity Metrics
CREATE INDEX IF NOT EXISTS idx_hem_organization ON health_equity_metrics(organization_id);
CREATE INDEX IF NOT EXISTS idx_hem_type ON health_equity_metrics(metric_type);
CREATE INDEX IF NOT EXISTS idx_hem_active ON health_equity_metrics(is_active);
CREATE INDEX IF NOT EXISTS idx_hem_code ON health_equity_metrics(code);

-- Health Equity Snapshots
CREATE INDEX IF NOT EXISTS idx_hes_metric ON health_equity_snapshots(metric_id);
CREATE INDEX IF NOT EXISTS idx_hes_date ON health_equity_snapshots(snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_hes_stratification ON health_equity_snapshots(stratification_type, stratification_value);
CREATE INDEX IF NOT EXISTS idx_hes_alert ON health_equity_snapshots(alert_level) WHERE alert_level IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_hes_metric_date ON health_equity_snapshots(metric_id, snapshot_date DESC);

-- Health Equity Initiatives
CREATE INDEX IF NOT EXISTS idx_hei_status ON health_equity_initiatives(status);
CREATE INDEX IF NOT EXISTS idx_hei_target ON health_equity_initiatives(target_demographic_type, target_demographic_value);
CREATE INDEX IF NOT EXISTS idx_hei_dates ON health_equity_initiatives(start_date, end_date);

-- Health Equity Goals
CREATE INDEX IF NOT EXISTS idx_heg_metric ON health_equity_goals(metric_id);
CREATE INDEX IF NOT EXISTS idx_heg_status ON health_equity_goals(status);
CREATE INDEX IF NOT EXISTS idx_heg_initiative ON health_equity_goals(initiative_id);

-- SDOH Scores
CREATE INDEX IF NOT EXISTS idx_pss_patient ON patient_sdoh_scores(patient_id);
CREATE INDEX IF NOT EXISTS idx_pss_risk ON patient_sdoh_scores(risk_level);
CREATE INDEX IF NOT EXISTS idx_pss_composite ON patient_sdoh_scores(composite_sdoh_score DESC);

-- Alerts
CREATE INDEX IF NOT EXISTS idx_hea_status ON health_equity_alerts(status);
CREATE INDEX IF NOT EXISTS idx_hea_severity ON health_equity_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_hea_created ON health_equity_alerts(created_at DESC);

-- ============================================================================
-- TRIGGER FOR UPDATED_AT
-- ============================================================================
CREATE OR REPLACE FUNCTION update_health_equity_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_hem_updated_at ON health_equity_metrics;
CREATE TRIGGER trg_hem_updated_at
    BEFORE UPDATE ON health_equity_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_health_equity_updated_at();

DROP TRIGGER IF EXISTS trg_hei_updated_at ON health_equity_initiatives;
CREATE TRIGGER trg_hei_updated_at
    BEFORE UPDATE ON health_equity_initiatives
    FOR EACH ROW
    EXECUTE FUNCTION update_health_equity_updated_at();

DROP TRIGGER IF EXISTS trg_heg_updated_at ON health_equity_goals;
CREATE TRIGGER trg_heg_updated_at
    BEFORE UPDATE ON health_equity_goals
    FOR EACH ROW
    EXECUTE FUNCTION update_health_equity_updated_at();

DROP TRIGGER IF EXISTS trg_heb_updated_at ON health_equity_benchmarks;
CREATE TRIGGER trg_heb_updated_at
    BEFORE UPDATE ON health_equity_benchmarks
    FOR EACH ROW
    EXECUTE FUNCTION update_health_equity_updated_at();

DROP TRIGGER IF EXISTS trg_pss_updated_at ON patient_sdoh_scores;
CREATE TRIGGER trg_pss_updated_at
    BEFORE UPDATE ON patient_sdoh_scores
    FOR EACH ROW
    EXECUTE FUNCTION update_health_equity_updated_at();

DROP TRIGGER IF EXISTS trg_hea_updated_at ON health_equity_alerts;
CREATE TRIGGER trg_hea_updated_at
    BEFORE UPDATE ON health_equity_alerts
    FOR EACH ROW
    EXECUTE FUNCTION update_health_equity_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE health_equity_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_equity_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_equity_initiatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_equity_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_equity_benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_sdoh_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE health_equity_alerts ENABLE ROW LEVEL SECURITY;

-- Allow read access to authenticated users
CREATE POLICY "Allow read health_equity_metrics" ON health_equity_metrics FOR SELECT USING (true);
CREATE POLICY "Allow read health_equity_snapshots" ON health_equity_snapshots FOR SELECT USING (true);
CREATE POLICY "Allow read health_equity_initiatives" ON health_equity_initiatives FOR SELECT USING (true);
CREATE POLICY "Allow read health_equity_goals" ON health_equity_goals FOR SELECT USING (true);
CREATE POLICY "Allow read health_equity_benchmarks" ON health_equity_benchmarks FOR SELECT USING (true);
CREATE POLICY "Allow read patient_sdoh_scores" ON patient_sdoh_scores FOR SELECT USING (true);
CREATE POLICY "Allow read health_equity_alerts" ON health_equity_alerts FOR SELECT USING (true);

-- Allow insert/update for authenticated users
CREATE POLICY "Allow insert health_equity_metrics" ON health_equity_metrics FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update health_equity_metrics" ON health_equity_metrics FOR UPDATE USING (true);
CREATE POLICY "Allow insert health_equity_snapshots" ON health_equity_snapshots FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update health_equity_snapshots" ON health_equity_snapshots FOR UPDATE USING (true);
CREATE POLICY "Allow insert health_equity_initiatives" ON health_equity_initiatives FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update health_equity_initiatives" ON health_equity_initiatives FOR UPDATE USING (true);
CREATE POLICY "Allow delete health_equity_initiatives" ON health_equity_initiatives FOR DELETE USING (true);
CREATE POLICY "Allow insert health_equity_goals" ON health_equity_goals FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update health_equity_goals" ON health_equity_goals FOR UPDATE USING (true);
CREATE POLICY "Allow delete health_equity_goals" ON health_equity_goals FOR DELETE USING (true);
CREATE POLICY "Allow insert health_equity_benchmarks" ON health_equity_benchmarks FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update health_equity_benchmarks" ON health_equity_benchmarks FOR UPDATE USING (true);
CREATE POLICY "Allow insert patient_sdoh_scores" ON patient_sdoh_scores FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update patient_sdoh_scores" ON patient_sdoh_scores FOR UPDATE USING (true);
CREATE POLICY "Allow insert health_equity_alerts" ON health_equity_alerts FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update health_equity_alerts" ON health_equity_alerts FOR UPDATE USING (true);

-- ============================================================================
-- SEED DATA: Default Health Equity Metrics
-- ============================================================================
INSERT INTO health_equity_metrics (
    code, name, description, metric_type, 
    stratification_dimensions, reference_group,
    equity_target, warning_threshold, critical_threshold,
    national_benchmark, benchmark_source,
    data_source, calculation_method,
    higher_is_better, is_active, is_ccbhc_required
) VALUES
-- Outcome Metrics
('HE_RET90', 'Treatment Retention (90-day) by Demographics',
 'Percentage of patients retained in treatment for 90+ days, stratified by demographic groups',
 'outcome', ARRAY['race', 'ethnicity', 'gender', 'insurance_type', 'geography'],
 'White', 5.0, 10.0, 20.0, 75.0, 'SAMHSA National Outcome Measures',
 'otp_admissions, patients', 'COUNT(retained) / COUNT(admitted) * 100 by demographic group',
 true, true, true),

('HE_MAT_INIT', 'MAT Initiation by Demographics',
 'Percentage of OUD patients initiating MAT within 14 days, stratified by demographic groups',
 'access', ARRAY['race', 'ethnicity', 'gender', 'insurance_type', 'geography'],
 'White', 5.0, 10.0, 15.0, 85.0, 'HEDIS',
 'otp_admissions, medications', 'COUNT(MAT started within 14 days) / COUNT(new OUD) * 100 by demographic',
 true, true, true),

('HE_FU_ED', 'Follow-up After ED by Demographics',
 'Percentage with follow-up within 7 days of ED visit, stratified by demographic groups',
 'quality', ARRAY['race', 'ethnicity', 'gender', 'insurance_type', 'geography'],
 'White', 5.0, 10.0, 15.0, 70.0, 'CCBHC Quality Measures',
 'encounters, appointments', 'COUNT(follow-ups within 7 days) / COUNT(ED visits) * 100 by demographic',
 true, true, true),

('HE_DEP_REM', 'Depression Remission by Demographics',
 'Percentage achieving PHQ-9 remission at 12 months, stratified by demographic groups',
 'outcome', ARRAY['race', 'ethnicity', 'gender', 'age_group', 'insurance_type'],
 'White', 5.0, 10.0, 20.0, 48.0, 'HEDIS/NCQA',
 'patient_assessments', 'COUNT(PHQ-9 < 5 at 12 months) / COUNT(depression dx) * 100 by demographic',
 true, true, false),

-- Access Metrics
('HE_WAIT_TIME', 'Appointment Wait Time by Demographics',
 'Average days to first appointment, stratified by demographic groups',
 'access', ARRAY['race', 'ethnicity', 'geography', 'insurance_type'],
 'White', 2.0, 5.0, 10.0, 7.0, 'Internal Benchmark',
 'appointments', 'AVG(first_appointment_date - referral_date) by demographic',
 false, true, false),

('HE_SDOH_SCR', 'SDOH Screening by Demographics',
 'Percentage of patients screened for SDOH, stratified by demographic groups',
 'quality', ARRAY['race', 'ethnicity', 'geography', 'insurance_type'],
 'White', 5.0, 10.0, 15.0, 80.0, 'CCBHC Quality Measures',
 'chw_encounters, patient_assessments', 'COUNT(SDOH screened) / COUNT(new patients) * 100 by demographic',
 true, true, true),

-- SDOH-Related Metrics
('HE_HOUSING', 'Housing Instability Impact on Retention',
 'Treatment retention rate for patients with housing instability vs stable housing',
 'sdoh', ARRAY['housing_status'],
 'Stable Housing', 10.0, 15.0, 25.0, NULL, 'Research Literature',
 'patient_sdoh_scores, otp_admissions', 'Retention rate comparison by housing status',
 true, true, false),

('HE_FOOD', 'Food Insecurity Impact on Outcomes',
 'Treatment outcomes for patients with food insecurity vs food secure',
 'sdoh', ARRAY['food_security_status'],
 'Food Secure', 10.0, 15.0, 25.0, NULL, 'Research Literature',
 'patient_sdoh_scores, otp_admissions', 'Outcome comparison by food security status',
 true, true, false),

('HE_TRANSPORT', 'Transportation Barrier Impact',
 'Appointment no-show rate for patients with transportation barriers',
 'sdoh', ARRAY['transportation_status'],
 'No Barrier', 10.0, 20.0, 30.0, NULL, 'Research Literature',
 'patient_sdoh_scores, appointments', 'No-show rate by transportation barrier status',
 false, true, false)

ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    equity_target = EXCLUDED.equity_target,
    updated_at = NOW();

-- ============================================================================
-- SEED DATA: Sample Equity Snapshots for Demo
-- ============================================================================
DO $$
DECLARE
    metric_rec RECORD;
    demo_groups TEXT[][] := ARRAY[
        ARRAY['race', 'White'],
        ARRAY['race', 'Black/African American'],
        ARRAY['race', 'Hispanic/Latino'],
        ARRAY['race', 'Asian'],
        ARRAY['race', 'Other/Multi-racial'],
        ARRAY['geography', 'Urban'],
        ARRAY['geography', 'Suburban'],
        ARRAY['geography', 'Rural'],
        ARRAY['insurance_type', 'Medicaid'],
        ARRAY['insurance_type', 'Medicare'],
        ARRAY['insurance_type', 'Commercial'],
        ARRAY['insurance_type', 'Uninsured']
    ];
    demo_group TEXT[];
    base_value NUMERIC;
    ref_value NUMERIC;
    calc_value NUMERIC;
    disparity NUMERIC;
BEGIN
    FOR metric_rec IN SELECT id, code, national_benchmark, higher_is_better FROM health_equity_metrics WHERE is_active = true LOOP
        ref_value := COALESCE(metric_rec.national_benchmark, 75.0);
        
        FOREACH demo_group SLICE 1 IN ARRAY demo_groups LOOP
            -- Calculate value with realistic variance by group
            CASE 
                WHEN demo_group[2] = 'White' OR demo_group[2] = 'Urban' OR demo_group[2] = 'Commercial' THEN
                    base_value := ref_value + (random() * 5);
                WHEN demo_group[2] = 'Black/African American' OR demo_group[2] = 'Medicaid' THEN
                    base_value := ref_value - 8 + (random() * 4);
                WHEN demo_group[2] = 'Hispanic/Latino' OR demo_group[2] = 'Rural' THEN
                    base_value := ref_value - 12 + (random() * 6);
                WHEN demo_group[2] = 'Uninsured' THEN
                    base_value := ref_value - 15 + (random() * 5);
                ELSE
                    base_value := ref_value - 3 + (random() * 6);
            END CASE;
            
            -- Ensure value stays in bounds
            IF base_value > 100 THEN base_value := 98; END IF;
            IF base_value < 20 THEN base_value := 20 + (random() * 10); END IF;
            
            -- Calculate disparity
            IF demo_group[2] = 'White' OR demo_group[2] = 'Urban' OR demo_group[2] = 'Commercial' THEN
                calc_value := base_value;
                disparity := 0;
            ELSE
                calc_value := base_value;
                disparity := ABS(ref_value - calc_value);
            END IF;
            
            INSERT INTO health_equity_snapshots (
                metric_id, stratification_type, stratification_value,
                current_value, reference_value, disparity_difference, disparity_ratio,
                population_count, snapshot_date, period_start, period_end,
                meets_equity_target, alert_level
            ) VALUES (
                metric_rec.id,
                demo_group[1],
                demo_group[2],
                ROUND(calc_value::numeric, 1),
                ROUND(ref_value::numeric, 1),
                ROUND(disparity::numeric, 1),
                CASE WHEN ref_value > 0 THEN ROUND((calc_value / ref_value)::numeric, 2) ELSE 1.0 END,
                FLOOR(random() * 200 + 50)::integer,
                CURRENT_DATE,
                (CURRENT_DATE - INTERVAL '1 month')::date,
                CURRENT_DATE,
                disparity <= 5.0,
                CASE 
                    WHEN disparity >= 20 THEN 'critical'
                    WHEN disparity >= 10 THEN 'warning'
                    ELSE 'none'
                END
            )
            ON CONFLICT (metric_id, stratification_type, stratification_value, snapshot_date) 
            DO UPDATE SET
                current_value = EXCLUDED.current_value,
                reference_value = EXCLUDED.reference_value,
                disparity_difference = EXCLUDED.disparity_difference;
        END LOOP;
    END LOOP;
END $$;

-- ============================================================================
-- SEED DATA: Sample Initiatives
-- ============================================================================
INSERT INTO health_equity_initiatives (
    title, description, initiative_type,
    target_demographic_type, target_demographic_value,
    start_date, end_date, status,
    baseline_value, target_value, current_progress, progress_percentage,
    lead_contact, participants_enrolled
) VALUES
('Culturally Adapted Counseling Program',
 'Implementation of evidence-based culturally adapted cognitive behavioral therapy for Hispanic/Latino patients to improve treatment retention and engagement.',
 'program', 'ethnicity', 'Hispanic/Latino',
 '2025-01-01', '2025-12-31', 'active',
 61.0, 72.0, 65.0, 36.4,
 'Dr. Maria Rodriguez', 45),

('Telehealth Expansion for Rural Access',
 'Expanding telehealth services to rural communities to reduce transportation barriers and improve appointment attendance.',
 'program', 'geography', 'Rural',
 '2024-10-01', '2025-09-30', 'active',
 52.0, 70.0, 61.0, 50.0,
 'James Wilson, LCSW', 78),

('Peer Support Worker Diversity Initiative',
 'Recruiting and training peer support workers from underrepresented communities to improve engagement with Black/African American patients.',
 'intervention', 'race', 'Black/African American',
 '2025-04-01', '2026-03-31', 'planning',
 68.0, 75.0, NULL, 15.0,
 'Keisha Thompson', 0),

('Language Access Enhancement',
 'Implementing real-time interpretation services and translated materials for patients with limited English proficiency.',
 'program', 'language', 'Limited English Proficiency',
 '2025-02-01', '2025-08-31', 'active',
 55.0, 70.0, 58.0, 20.0,
 'Dr. Chen Wei', 32),

('SDOH Navigation Program',
 'Deploying community health workers to address social determinants of health barriers affecting treatment outcomes.',
 'intervention', 'sdoh', 'High SDOH Risk',
 '2024-07-01', '2025-06-30', 'active',
 45.0, 65.0, 52.0, 35.0,
 'Angela Martinez, CHW', 120)

ON CONFLICT DO NOTHING;

-- ============================================================================
-- HEALTH EQUITY REPORTS TABLE
-- Stores generated equity reports for historical tracking
-- ============================================================================
CREATE TABLE IF NOT EXISTS health_equity_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID,
    
    -- Report Details
    report_type VARCHAR(50) NOT NULL CHECK (report_type IN ('monthly', 'quarterly', 'annual', 'custom')),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Report Content
    report_data JSONB NOT NULL DEFAULT '{}'::jsonb,
    executive_summary TEXT,
    key_findings TEXT[],
    recommendations TEXT[],
    
    -- Metadata
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    generated_by UUID,
    file_url TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for reports
CREATE INDEX IF NOT EXISTS idx_her_period ON health_equity_reports(period_start, period_end);
CREATE INDEX IF NOT EXISTS idx_her_type ON health_equity_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_her_generated ON health_equity_reports(generated_at DESC);

-- RLS for reports
ALTER TABLE health_equity_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow read health_equity_reports" ON health_equity_reports FOR SELECT USING (true);
CREATE POLICY "Allow insert health_equity_reports" ON health_equity_reports FOR INSERT WITH CHECK (true);

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================
COMMENT ON TABLE health_equity_metrics IS 'Master catalog of health equity metrics and disparity measures for behavioral health';
COMMENT ON TABLE health_equity_snapshots IS 'Point-in-time disparity measurements by demographic group with statistical analysis';
COMMENT ON TABLE health_equity_initiatives IS 'Programs and interventions targeting health disparities in specific populations';
COMMENT ON TABLE health_equity_goals IS 'Disparity reduction targets and progress tracking';
COMMENT ON TABLE health_equity_benchmarks IS 'External benchmarks from CMS, SAMHSA, HEDIS for disparity comparison';
COMMENT ON TABLE patient_sdoh_scores IS 'Aggregated SDOH risk scores per patient from CHW encounters';
COMMENT ON TABLE health_equity_alerts IS 'Automated alerts when disparities exceed defined thresholds';
COMMENT ON TABLE health_equity_reports IS 'Historical storage of generated health equity reports';

-- ============================================================================
-- DONE
-- ============================================================================
SELECT 'Health Equity schema created successfully!' AS status;

