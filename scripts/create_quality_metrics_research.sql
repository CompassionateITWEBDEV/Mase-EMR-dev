-- ============================================================================
-- RESEARCH QUALITY METRICS SCHEMA
-- ============================================================================
-- Creates specialized tables for research-focused quality metrics tracking
-- Run this in Supabase SQL Editor or via psql
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- RESEARCH QUALITY METRICS TABLE
-- Master catalog of quality metrics for research dashboard
-- ============================================================================
CREATE TABLE IF NOT EXISTS research_quality_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID,
    
    -- Basic Information
    name TEXT NOT NULL,
    code VARCHAR(50) UNIQUE,
    description TEXT,
    category VARCHAR(50) NOT NULL CHECK (category IN ('outcomes', 'access', 'ccbhc', 'integration', 'safety', 'efficiency', 'patient_experience')),
    
    -- Target and Benchmark
    target_value NUMERIC(10, 2) NOT NULL DEFAULT 0,
    benchmark_value NUMERIC(10, 2),
    benchmark_source VARCHAR(255),
    unit VARCHAR(20) DEFAULT '%',
    
    -- Configuration
    data_source VARCHAR(100),
    calculation_method TEXT,
    reporting_period VARCHAR(20) DEFAULT 'monthly' CHECK (reporting_period IN ('daily', 'weekly', 'monthly', 'quarterly', 'annually')),
    higher_is_better BOOLEAN DEFAULT true,
    
    -- Thresholds for alerts
    warning_threshold NUMERIC(10, 2),
    critical_threshold NUMERIC(10, 2),
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_ccbhc_required BOOLEAN DEFAULT false,
    is_mips_measure BOOLEAN DEFAULT false,
    measure_steward VARCHAR(255),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    
    -- Foreign Keys (optional, depending on your schema)
    CONSTRAINT fk_organization FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE SET NULL
);

-- ============================================================================
-- RESEARCH QUALITY SNAPSHOTS TABLE
-- Point-in-time metric values for historical tracking
-- ============================================================================
CREATE TABLE IF NOT EXISTS research_quality_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_id UUID NOT NULL,
    organization_id UUID,
    
    -- Value Information
    current_value NUMERIC(10, 2) NOT NULL,
    numerator INTEGER,
    denominator INTEGER,
    
    -- Period Information
    snapshot_date DATE NOT NULL DEFAULT CURRENT_DATE,
    period_start DATE,
    period_end DATE,
    reporting_period VARCHAR(20),
    
    -- Comparison Data
    previous_value NUMERIC(10, 2),
    trend VARCHAR(10) CHECK (trend IN ('up', 'down', 'stable')),
    trend_percentage NUMERIC(10, 2),
    
    -- Status
    meets_target BOOLEAN,
    meets_benchmark BOOLEAN,
    
    -- Calculation Details
    calculation_notes TEXT,
    data_quality_score NUMERIC(5, 2),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    calculated_by VARCHAR(100) DEFAULT 'system',
    
    -- Foreign Keys
    CONSTRAINT fk_metric FOREIGN KEY (metric_id) REFERENCES research_quality_metrics(id) ON DELETE CASCADE,
    
    -- Unique constraint for one snapshot per metric per date
    CONSTRAINT unique_metric_date UNIQUE (metric_id, snapshot_date)
);

-- ============================================================================
-- RESEARCH QUALITY BENCHMARKS TABLE
-- External and internal benchmark data
-- ============================================================================
CREATE TABLE IF NOT EXISTS research_quality_benchmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_id UUID NOT NULL,
    
    -- Benchmark Information
    benchmark_type VARCHAR(50) NOT NULL CHECK (benchmark_type IN ('national', 'state', 'regional', 'peer', 'internal', 'accreditation')),
    benchmark_name VARCHAR(255) NOT NULL,
    benchmark_value NUMERIC(10, 2) NOT NULL,
    benchmark_year INTEGER,
    
    -- Source Information
    source_organization VARCHAR(255),
    source_url TEXT,
    methodology_notes TEXT,
    
    -- Validity Period
    effective_date DATE,
    expiration_date DATE,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Foreign Keys
    CONSTRAINT fk_benchmark_metric FOREIGN KEY (metric_id) REFERENCES research_quality_metrics(id) ON DELETE CASCADE
);

-- ============================================================================
-- RESEARCH QUALITY GOALS TABLE
-- Organization-specific targets and improvement goals
-- ============================================================================
CREATE TABLE IF NOT EXISTS research_quality_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_id UUID NOT NULL,
    organization_id UUID,
    
    -- Goal Information
    goal_type VARCHAR(50) NOT NULL CHECK (goal_type IN ('annual', 'quarterly', 'improvement', 'maintenance', 'stretch')),
    goal_name VARCHAR(255),
    target_value NUMERIC(10, 2) NOT NULL,
    baseline_value NUMERIC(10, 2),
    
    -- Timeline
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    
    -- Status Tracking
    current_progress NUMERIC(10, 2),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'achieved', 'not_achieved', 'cancelled', 'in_progress')),
    achieved_date DATE,
    
    -- Notes
    description TEXT,
    action_plan TEXT,
    barriers TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID,
    
    -- Foreign Keys
    CONSTRAINT fk_goal_metric FOREIGN KEY (metric_id) REFERENCES research_quality_metrics(id) ON DELETE CASCADE
);

-- ============================================================================
-- RESEARCH QUALITY METRIC LINKS TABLE
-- Links metrics to EBPs, research studies, and other entities
-- ============================================================================
CREATE TABLE IF NOT EXISTS research_quality_metric_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    metric_id UUID NOT NULL,
    
    -- Link Target
    linked_entity_type VARCHAR(50) NOT NULL CHECK (linked_entity_type IN ('ebp', 'research_study', 'treatment_program', 'intervention')),
    linked_entity_id UUID NOT NULL,
    
    -- Relationship
    relationship_type VARCHAR(50) DEFAULT 'affects' CHECK (relationship_type IN ('affects', 'measures', 'contributes_to', 'derived_from')),
    impact_weight NUMERIC(5, 2) DEFAULT 1.0,
    
    -- Notes
    description TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Foreign Keys
    CONSTRAINT fk_link_metric FOREIGN KEY (metric_id) REFERENCES research_quality_metrics(id) ON DELETE CASCADE,
    
    -- Unique constraint
    CONSTRAINT unique_metric_link UNIQUE (metric_id, linked_entity_type, linked_entity_id)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_rqm_organization ON research_quality_metrics(organization_id);
CREATE INDEX IF NOT EXISTS idx_rqm_category ON research_quality_metrics(category);
CREATE INDEX IF NOT EXISTS idx_rqm_active ON research_quality_metrics(is_active);
CREATE INDEX IF NOT EXISTS idx_rqm_ccbhc ON research_quality_metrics(is_ccbhc_required);

CREATE INDEX IF NOT EXISTS idx_rqs_metric ON research_quality_snapshots(metric_id);
CREATE INDEX IF NOT EXISTS idx_rqs_date ON research_quality_snapshots(snapshot_date DESC);
CREATE INDEX IF NOT EXISTS idx_rqs_metric_date ON research_quality_snapshots(metric_id, snapshot_date DESC);

CREATE INDEX IF NOT EXISTS idx_rqb_metric ON research_quality_benchmarks(metric_id);
CREATE INDEX IF NOT EXISTS idx_rqb_type ON research_quality_benchmarks(benchmark_type);

CREATE INDEX IF NOT EXISTS idx_rqg_metric ON research_quality_goals(metric_id);
CREATE INDEX IF NOT EXISTS idx_rqg_status ON research_quality_goals(status);

CREATE INDEX IF NOT EXISTS idx_rqml_metric ON research_quality_metric_links(metric_id);
CREATE INDEX IF NOT EXISTS idx_rqml_entity ON research_quality_metric_links(linked_entity_type, linked_entity_id);

-- ============================================================================
-- TRIGGER FOR UPDATED_AT
-- ============================================================================
CREATE OR REPLACE FUNCTION update_research_quality_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_rqm_updated_at ON research_quality_metrics;
CREATE TRIGGER trg_rqm_updated_at
    BEFORE UPDATE ON research_quality_metrics
    FOR EACH ROW
    EXECUTE FUNCTION update_research_quality_updated_at();

DROP TRIGGER IF EXISTS trg_rqb_updated_at ON research_quality_benchmarks;
CREATE TRIGGER trg_rqb_updated_at
    BEFORE UPDATE ON research_quality_benchmarks
    FOR EACH ROW
    EXECUTE FUNCTION update_research_quality_updated_at();

DROP TRIGGER IF EXISTS trg_rqg_updated_at ON research_quality_goals;
CREATE TRIGGER trg_rqg_updated_at
    BEFORE UPDATE ON research_quality_goals
    FOR EACH ROW
    EXECUTE FUNCTION update_research_quality_updated_at();

-- ============================================================================
-- SEED DATA: Default Quality Metrics for Behavioral Health
-- ============================================================================
INSERT INTO research_quality_metrics (
    code, name, description, category, target_value, benchmark_value, benchmark_source,
    data_source, calculation_method, reporting_period, higher_is_better,
    warning_threshold, critical_threshold, is_ccbhc_required, is_mips_measure
) VALUES
-- Outcomes Metrics
('RET90', 'Treatment Retention (90-day)', 
 'Percentage of patients who remain engaged in treatment for at least 90 days after admission',
 'outcomes', 80.0, 75.0, 'SAMHSA National Outcome Measures',
 'treatment_plans, otp_admissions', 
 'COUNT(patients with 90+ days in treatment) / COUNT(all admitted patients) * 100',
 'monthly', true, 70.0, 60.0, true, false),

('FU_ED', 'Follow-up After ED Visit',
 'Percentage of patients with follow-up visit within 7 days of ED visit for mental health or SUD',
 'ccbhc', 75.0, 70.0, 'CCBHC Quality Measures',
 'encounters, appointments',
 'COUNT(patients with follow-up within 7 days) / COUNT(ED visits) * 100',
 'monthly', true, 65.0, 55.0, true, false),

('DEP_REM', 'Depression Remission Rate',
 'Percentage of patients with depression diagnosis achieving remission (PHQ-9 < 5) at 12 months',
 'outcomes', 50.0, 48.0, 'HEDIS/NCQA',
 'patient_assessments (PHQ-9)',
 'COUNT(patients with PHQ-9 < 5 at 12 months) / COUNT(patients with depression dx) * 100',
 'quarterly', true, 40.0, 30.0, false, true),

('MAT_INIT', 'Initiation of MAT',
 'Percentage of patients with OUD diagnosis who initiate MAT within 14 days of assessment',
 'access', 95.0, 85.0, 'HEDIS',
 'otp_admissions, medications',
 'COUNT(patients starting MAT within 14 days) / COUNT(new OUD diagnoses) * 100',
 'monthly', true, 80.0, 70.0, true, true),

('SDOH_SCR', 'Screening for SDoH',
 'Percentage of patients screened for social determinants of health within 30 days of intake',
 'ccbhc', 90.0, 80.0, 'CCBHC Quality Measures',
 'patient_assessments',
 'COUNT(patients with SDoH screening) / COUNT(new patients) * 100',
 'monthly', true, 75.0, 65.0, true, false),

('CARE_COORD', 'Care Coordination Rate',
 'Percentage of patients with documented care coordination activities with external providers',
 'integration', 80.0, 70.0, 'Internal Benchmark',
 'encounters, referrals',
 'COUNT(patients with care coordination) / COUNT(active patients) * 100',
 'monthly', true, 60.0, 50.0, false, false),

-- CCBHC Required Measures
('DEP_SCR', 'Depression Screening and Follow-up',
 'Percentage of patients aged 12+ screened for depression with documented follow-up plan',
 'ccbhc', 90.0, 85.0, 'CCBHC Quality Measures',
 'patient_assessments',
 'COUNT(screened with follow-up) / COUNT(eligible patients) * 100',
 'monthly', true, 80.0, 70.0, true, true),

('FU_HOSP', 'Follow-up After Hospitalization',
 'Percentage of discharges with follow-up visit within 7 days of psychiatric hospitalization',
 'ccbhc', 80.0, 75.0, 'CCBHC Quality Measures',
 'encounters, hospitalizations',
 'COUNT(follow-ups within 7 days) / COUNT(discharges) * 100',
 'monthly', true, 65.0, 55.0, true, false),

('SUD_ENGAGE', 'SUD Treatment Engagement',
 'Percentage of patients with SUD diagnosis who engage in treatment (2+ visits within 34 days)',
 'outcomes', 75.0, 68.0, 'HEDIS',
 'encounters, otp_admissions',
 'COUNT(patients with 2+ visits in 34 days) / COUNT(new SUD patients) * 100',
 'monthly', true, 60.0, 50.0, true, true),

('SUICIDE_ASSESS', 'Suicide Risk Assessment',
 'Percentage of patients with depression or behavioral health visit with documented suicide risk assessment',
 'safety', 95.0, 90.0, 'Joint Commission NPSG',
 'patient_assessments, encounters',
 'COUNT(patients with suicide assessment) / COUNT(eligible patients) * 100',
 'monthly', true, 85.0, 75.0, true, true),

-- Additional Important Metrics
('TOB_SCR', 'Tobacco Use Assessment',
 'Percentage of patients with documented tobacco use screening and cessation intervention',
 'ccbhc', 95.0, 90.0, 'CCBHC Quality Measures',
 'patient_assessments',
 'COUNT(patients screened for tobacco) / COUNT(eligible patients) * 100',
 'monthly', true, 85.0, 75.0, true, false),

('MED_RECONCILE', 'Medication Reconciliation',
 'Percentage of patients with medication reconciliation performed at each visit',
 'safety', 95.0, 90.0, 'Joint Commission',
 'medication_reconciliation',
 'COUNT(reconciliations completed) / COUNT(visits) * 100',
 'monthly', true, 85.0, 75.0, false, false)

ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    target_value = EXCLUDED.target_value,
    benchmark_value = EXCLUDED.benchmark_value,
    updated_at = NOW();

-- ============================================================================
-- SEED DATA: Initial Snapshots with Sample Historical Data
-- ============================================================================
DO $$
DECLARE
    metric_rec RECORD;
    i INTEGER;
    base_value NUMERIC;
    variance NUMERIC;
    calc_value NUMERIC;
    prev_value NUMERIC;
    calc_trend VARCHAR(10);
BEGIN
    FOR metric_rec IN SELECT id, code, target_value FROM research_quality_metrics LOOP
        prev_value := NULL;
        
        -- Generate 12 months of historical data
        FOR i IN 0..11 LOOP
            -- Calculate base value with some randomness
            CASE metric_rec.code
                WHEN 'RET90' THEN base_value := 72.0;
                WHEN 'FU_ED' THEN base_value := 68.0;
                WHEN 'DEP_REM' THEN base_value := 45.0;
                WHEN 'MAT_INIT' THEN base_value := 89.0;
                WHEN 'SDOH_SCR' THEN base_value := 82.0;
                WHEN 'CARE_COORD' THEN base_value := 65.0;
                WHEN 'DEP_SCR' THEN base_value := 87.0;
                WHEN 'FU_HOSP' THEN base_value := 76.0;
                WHEN 'SUD_ENGAGE' THEN base_value := 71.0;
                WHEN 'SUICIDE_ASSESS' THEN base_value := 92.0;
                WHEN 'TOB_SCR' THEN base_value := 88.0;
                WHEN 'MED_RECONCILE' THEN base_value := 91.0;
                ELSE base_value := 75.0;
            END CASE;
            
            -- Add variance and slight upward trend over time
            variance := (random() * 6) - 3; -- -3 to +3 variance
            calc_value := base_value + variance + (i * 0.3); -- slight improvement over time
            
            -- Ensure value stays within bounds
            IF calc_value > 100 THEN calc_value := 100; END IF;
            IF calc_value < 0 THEN calc_value := 0; END IF;
            
            -- Calculate trend
            IF prev_value IS NULL THEN
                calc_trend := 'stable';
            ELSIF calc_value > prev_value + 1 THEN
                calc_trend := 'up';
            ELSIF calc_value < prev_value - 1 THEN
                calc_trend := 'down';
            ELSE
                calc_trend := 'stable';
            END IF;
            
            INSERT INTO research_quality_snapshots (
                metric_id,
                current_value,
                snapshot_date,
                period_start,
                period_end,
                reporting_period,
                previous_value,
                trend,
                trend_percentage,
                meets_target,
                meets_benchmark
            ) VALUES (
                metric_rec.id,
                ROUND(calc_value::numeric, 1),
                (CURRENT_DATE - ((11 - i) * INTERVAL '1 month'))::date,
                (CURRENT_DATE - ((12 - i) * INTERVAL '1 month'))::date,
                (CURRENT_DATE - ((11 - i) * INTERVAL '1 month'))::date,
                'monthly',
                prev_value,
                calc_trend,
                CASE WHEN prev_value IS NOT NULL THEN ROUND(((calc_value - prev_value) / NULLIF(prev_value, 0) * 100)::numeric, 1) ELSE 0 END,
                calc_value >= metric_rec.target_value,
                calc_value >= COALESCE((SELECT benchmark_value FROM research_quality_metrics WHERE id = metric_rec.id), 0)
            )
            ON CONFLICT (metric_id, snapshot_date) DO UPDATE SET
                current_value = EXCLUDED.current_value,
                previous_value = EXCLUDED.previous_value,
                trend = EXCLUDED.trend;
            
            prev_value := calc_value;
        END LOOP;
    END LOOP;
END $$;

-- ============================================================================
-- SEED DATA: Sample Benchmarks
-- ============================================================================
INSERT INTO research_quality_benchmarks (
    metric_id, benchmark_type, benchmark_name, benchmark_value, benchmark_year,
    source_organization, effective_date, is_active
)
SELECT 
    m.id,
    'national',
    'National Average - ' || m.name,
    m.benchmark_value,
    2024,
    CASE 
        WHEN m.is_ccbhc_required THEN 'SAMHSA CCBHC'
        WHEN m.is_mips_measure THEN 'CMS MIPS'
        ELSE 'Industry Standard'
    END,
    '2024-01-01',
    true
FROM research_quality_metrics m
WHERE m.benchmark_value IS NOT NULL
ON CONFLICT DO NOTHING;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE research_quality_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_quality_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_quality_benchmarks ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_quality_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_quality_metric_links ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to read (adjust based on your needs)
CREATE POLICY "Allow read access to quality metrics" ON research_quality_metrics
    FOR SELECT USING (true);

CREATE POLICY "Allow read access to quality snapshots" ON research_quality_snapshots
    FOR SELECT USING (true);

CREATE POLICY "Allow read access to quality benchmarks" ON research_quality_benchmarks
    FOR SELECT USING (true);

CREATE POLICY "Allow read access to quality goals" ON research_quality_goals
    FOR SELECT USING (true);

CREATE POLICY "Allow read access to quality links" ON research_quality_metric_links
    FOR SELECT USING (true);

-- Allow authenticated users to insert/update (adjust based on your roles)
CREATE POLICY "Allow insert quality metrics" ON research_quality_metrics
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update quality metrics" ON research_quality_metrics
    FOR UPDATE USING (true);

CREATE POLICY "Allow insert quality snapshots" ON research_quality_snapshots
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow insert quality benchmarks" ON research_quality_benchmarks
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow insert quality goals" ON research_quality_goals
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update quality goals" ON research_quality_goals
    FOR UPDATE USING (true);

CREATE POLICY "Allow insert quality links" ON research_quality_metric_links
    FOR INSERT WITH CHECK (true);

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================
COMMENT ON TABLE research_quality_metrics IS 'Master catalog of quality metrics for research dashboard tracking';
COMMENT ON TABLE research_quality_snapshots IS 'Point-in-time metric values for historical trend analysis';
COMMENT ON TABLE research_quality_benchmarks IS 'External and internal benchmark data for comparison';
COMMENT ON TABLE research_quality_goals IS 'Organization-specific targets and improvement goals';
COMMENT ON TABLE research_quality_metric_links IS 'Links metrics to EBPs, research studies, and other entities';

-- ============================================================================
-- DONE
-- ============================================================================
SELECT 'Research Quality Metrics schema created successfully!' AS status;

