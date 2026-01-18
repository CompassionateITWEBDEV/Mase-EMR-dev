-- SUD Medication Development Tracking
CREATE TABLE IF NOT EXISTS public.sud_medication_development (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_name VARCHAR(255) NOT NULL,
  development_stage VARCHAR(50) CHECK (development_stage IN ('discovery', 'preclinical', 'phase_1', 'phase_2', 'phase_3', 'fda_review', 'approved')),
  target_indication TEXT NOT NULL,
  mechanism_of_action TEXT,
  lead_researcher VARCHAR(255),
  sponsor VARCHAR(255),
  fda_ind_number VARCHAR(50),
  enrollment_target INTEGER,
  current_enrollment INTEGER DEFAULT 0,
  primary_endpoints JSONB,
  efficacy_data JSONB,
  safety_data JSONB,
  regulatory_milestones JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clinical Trials for SUD
CREATE TABLE IF NOT EXISTS public.sud_clinical_trials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trial_id VARCHAR(50) UNIQUE NOT NULL,
  title TEXT NOT NULL,
  phase VARCHAR(50),
  status VARCHAR(50),
  n_enrolled INTEGER,
  n_target INTEGER,
  primary_outcome TEXT,
  secondary_outcomes JSONB,
  eligibility_criteria TEXT,
  intervention_description TEXT,
  number_of_sites INTEGER,
  principal_investigator VARCHAR(255),
  regulatory_status TEXT,
  irb_approval_date DATE,
  start_date DATE,
  estimated_completion_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Overdose Prevention Studies
CREATE TABLE IF NOT EXISTS public.overdose_prevention_studies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  study_code VARCHAR(50) UNIQUE NOT NULL,
  study_name TEXT NOT NULL,
  study_type VARCHAR(100),
  status VARCHAR(50),
  participants_enrolled INTEGER,
  overdose_reversals_documented INTEGER,
  naloxone_kits_distributed INTEGER,
  training_sessions_completed INTEGER,
  community_partners INTEGER,
  key_findings TEXT,
  lives_saved INTEGER,
  behavior_change_rate NUMERIC(5,2),
  mortality_reduction_percentage NUMERIC(5,2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Co-morbid SUD Research
CREATE TABLE IF NOT EXISTS public.comorbid_sud_research (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  research_area VARCHAR(100) NOT NULL, -- 'opioid_alcohol', 'sud_mental_health', 'sud_pain', 'sud_infectious_disease'
  study_title TEXT NOT NULL,
  active_studies INTEGER DEFAULT 0,
  total_participants INTEGER DEFAULT 0,
  primary_outcome_rate NUMERIC(5,2),
  funding_source VARCHAR(255),
  partnership_organizations TEXT[],
  key_interventions JSONB,
  evidence_level VARCHAR(50),
  clinical_adoption_status VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Medical Device Development for SUD
CREATE TABLE IF NOT EXISTS public.sud_medical_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_name VARCHAR(255) NOT NULL,
  device_type VARCHAR(100), -- 'implant', 'wearable', 'diagnostic', 'monitoring'
  development_stage VARCHAR(50),
  target_indication TEXT,
  mechanism_description TEXT,
  lead_researcher VARCHAR(255),
  sponsor VARCHAR(255),
  fda_device_classification VARCHAR(50),
  "510k_or_pma" VARCHAR(50),
  regulatory_milestones JSONB,
  clinical_trial_id UUID REFERENCES public.sud_clinical_trials(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- FDA Regulatory Pathways Tracking
CREATE TABLE IF NOT EXISTS public.fda_regulatory_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id UUID REFERENCES public.sud_medication_development(id),
  device_id UUID REFERENCES public.sud_medical_devices(id),
  regulatory_pathway VARCHAR(100), -- 'traditional_nda', 'fast_track', 'breakthrough_therapy', 'priority_review', 'accelerated_approval'
  designation_date DATE,
  ind_submission_date DATE,
  ind_approval_date DATE,
  phase_1_start DATE,
  phase_2_start DATE,
  phase_3_start DATE,
  nda_submission_date DATE,
  pdufa_date DATE,
  fda_approval_date DATE,
  fda_reviewer_notes TEXT,
  clinical_adoption_metrics JSONB,
  post_marketing_surveillance JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Preclinical Research Studies
CREATE TABLE IF NOT EXISTS public.preclinical_sud_research (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  medication_id UUID REFERENCES public.sud_medication_development(id),
  study_type VARCHAR(100), -- 'pharmacokinetics', 'toxicology', 'efficacy', 'bioavailability'
  animal_model VARCHAR(100),
  sample_size INTEGER,
  study_duration_days INTEGER,
  primary_outcomes JSONB,
  results_summary TEXT,
  safety_profile TEXT,
  next_steps TEXT,
  publication_reference TEXT,
  completed_date DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Research Impact Metrics
CREATE TABLE IF NOT EXISTS public.sud_research_impact (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  research_id UUID NOT NULL,
  research_type VARCHAR(50), -- 'medication', 'device', 'behavioral', 'implementation'
  metric_type VARCHAR(100), -- 'lives_saved', 'overdose_prevented', 'retention_improved', 'mortality_reduced'
  metric_value NUMERIC(10,2),
  measurement_period_start DATE,
  measurement_period_end DATE,
  comparison_baseline NUMERIC(10,2),
  statistical_significance NUMERIC(5,4),
  effect_size NUMERIC(5,2),
  confidence_interval VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_sud_meds_stage ON public.sud_medication_development(development_stage);
CREATE INDEX IF NOT EXISTS idx_clinical_trials_status ON public.sud_clinical_trials(status);
CREATE INDEX IF NOT EXISTS idx_overdose_studies_status ON public.overdose_prevention_studies(status);
CREATE INDEX IF NOT EXISTS idx_regulatory_pathway ON public.fda_regulatory_tracking(regulatory_pathway);

COMMENT ON TABLE public.sud_medication_development IS 'Tracks discovery and development of novel medications for substance use disorders from preclinical through FDA approval';
COMMENT ON TABLE public.sud_clinical_trials IS 'Multi-site clinical trials evaluating interventions for SUD including medications, behavioral therapies, and medical devices';
COMMENT ON TABLE public.overdose_prevention_studies IS 'Research studies focused on preventing opioid overdoses and reducing overdose-related mortality';
COMMENT ON TABLE public.comorbid_sud_research IS 'Research on treating co-morbid substance use disorders and co-occurring medical/mental health conditions';
COMMENT ON TABLE public.fda_regulatory_tracking IS 'Tracks medications and devices through FDA regulatory pathways toward clinical adoption';
