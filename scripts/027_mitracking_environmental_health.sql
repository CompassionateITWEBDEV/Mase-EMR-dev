-- MiTracking (Michigan Environmental Public Health Tracking) Integration
-- Connects environmental health hazards with behavioral health outcomes

-- Environmental Health Data from MiTracking
CREATE TABLE IF NOT EXISTS mitracking_environmental_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  
  -- Geographic Identification
  county CHARACTER VARYING,
  zip_code CHARACTER VARYING,
  census_tract CHARACTER VARYING,
  
  -- Reporting Period
  data_year INTEGER,
  data_quarter INTEGER,
  measurement_date DATE,
  
  -- Lead Exposure Data
  blood_lead_tests_performed INTEGER,
  children_elevated_lead_pct NUMERIC, -- % of children with BLL ≥5 μg/dL
  homes_built_before_1978_pct NUMERIC,
  lead_service_lines_count INTEGER,
  lead_paint_violations INTEGER,
  
  -- Air Quality Data  
  pm25_annual_avg NUMERIC, -- Fine particulate matter
  ozone_days_above_standard INTEGER,
  air_quality_index_avg NUMERIC,
  asthma_ed_visits_rate NUMERIC, -- Per 10,000
  
  -- Water Quality Data
  community_water_violations INTEGER,
  pfas_detections INTEGER, -- Per- and polyfluoroalkyl substances
  arsenic_exceedances INTEGER,
  lead_exceedances INTEGER,
  water_quality_index CHARACTER VARYING,
  
  -- Housing & Built Environment
  housing_code_violations INTEGER,
  substandard_housing_pct NUMERIC,
  overcrowding_pct NUMERIC,
  vacant_properties_pct NUMERIC,
  
  -- Climate & Heat
  extreme_heat_days INTEGER, -- Days >90°F
  heat_related_illness_rate NUMERIC,
  
  -- Toxic Releases & Hazardous Sites
  superfund_sites_count INTEGER,
  toxic_release_facilities_count INTEGER,
  hazardous_waste_sites_count INTEGER,
  
  -- Correlation with SUD Outcomes (Calculated)
  correlated_with_overdose_rate BOOLEAN,
  sud_risk_weight NUMERIC, -- Statistical correlation coefficient
  environmental_health_burden_score NUMERIC, -- Composite score
  
  -- MiTracking Submission
  submitted_to_mitracking BOOLEAN DEFAULT false,
  mitracking_submission_date TIMESTAMP WITH TIME ZONE,
  mitracking_confirmation_number CHARACTER VARYING,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_mitracking_county ON mitracking_environmental_data(county);
CREATE INDEX idx_mitracking_zip ON mitracking_environmental_data(zip_code);
CREATE INDEX idx_mitracking_year ON mitracking_environmental_data(data_year);

-- Patient-Level Environmental Exposure Assessment
CREATE TABLE IF NOT EXISTS patient_environmental_exposures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id),
  organization_id UUID REFERENCES organizations(id),
  
  -- Patient Address Environmental Risk
  home_zip_code CHARACTER VARYING,
  home_county CHARACTER VARYING,
  home_built_year INTEGER,
  
  -- Lead Exposure Risk
  lead_exposure_risk_level CHARACTER VARYING, -- Low, Moderate, High, Critical
  lead_screening_completed BOOLEAN,
  blood_lead_level NUMERIC, -- μg/dL
  blood_lead_test_date DATE,
  
  -- Air Quality Exposure
  air_quality_exposure_score NUMERIC,
  respiratory_symptoms_reported BOOLEAN,
  
  -- Water Quality Exposure
  water_source CHARACTER VARYING, -- Municipal, Well, Other
  water_quality_concerns BOOLEAN,
  water_testing_recommended BOOLEAN,
  
  -- Housing Conditions
  housing_quality_assessment CHARACTER VARYING,
  mold_exposure_reported BOOLEAN,
  pest_infestation_reported BOOLEAN,
  heating_cooling_adequate BOOLEAN,
  
  -- Composite Environmental Health Score
  environmental_health_risk_score NUMERIC, -- 0-100
  risk_factors_identified JSONB,
  
  -- Clinical Integration
  affects_treatment_plan BOOLEAN,
  environmental_referrals_made JSONB, -- Housing, water testing, lead abatement
  
  assessment_date DATE,
  assessed_by UUID,
  next_assessment_due DATE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_patient_env_exposure_patient ON patient_environmental_exposures(patient_id);
CREATE INDEX idx_patient_env_exposure_risk ON patient_environmental_exposures(environmental_health_risk_score);

-- Environmental Health Correlations with SUD Outcomes
CREATE TABLE IF NOT EXISTS environmental_sud_correlations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Geographic Area
  geographic_level CHARACTER VARYING, -- County, ZIP, Census Tract
  geographic_identifier CHARACTER VARYING,
  
  -- Environmental Exposure
  environmental_factor CHARACTER VARYING, -- Lead, Air Quality, Water Quality, Housing
  exposure_level NUMERIC,
  
  -- SUD Outcome
  outcome_metric CHARACTER VARYING, -- Overdose Rate, Treatment Admission Rate, Relapse Rate
  outcome_value NUMERIC,
  
  -- Statistical Analysis
  correlation_coefficient NUMERIC, -- Pearson's r
  p_value NUMERIC,
  statistically_significant BOOLEAN,
  confidence_interval CHARACTER VARYING,
  
  -- Study Details
  analysis_period_start DATE,
  analysis_period_end DATE,
  sample_size INTEGER,
  methodology_notes TEXT,
  
  -- Clinical Relevance
  clinical_significance CHARACTER VARYING,
  recommended_interventions JSONB,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_env_sud_corr_factor ON environmental_sud_correlations(environmental_factor);
CREATE INDEX idx_env_sud_corr_outcome ON environmental_sud_correlations(outcome_metric);

COMMIT;
