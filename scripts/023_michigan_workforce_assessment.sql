-- Michigan SUD Treatment Workforce Assessment (Mi-SUTWA) & Recovery Friendly Workplace
-- Aligns with MPHI and MDHHS workforce reporting requirements

CREATE TABLE IF NOT EXISTS michigan_workforce_assessment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  assessment_period_start DATE NOT NULL,
  assessment_period_end DATE NOT NULL,
  
  -- Workforce Capacity Metrics
  total_clinical_staff INTEGER,
  total_support_staff INTEGER,
  total_peer_specialists INTEGER,
  total_prescribers INTEGER,
  total_registered_nurses INTEGER,
  total_licensed_counselors INTEGER,
  
  -- Workforce Gaps Identified
  vacant_positions_count INTEGER,
  positions_difficult_to_fill JSONB, -- Array of position types
  average_time_to_hire_days NUMERIC,
  turnover_rate_percentage NUMERIC,
  retention_challenges TEXT,
  
  -- Credentialing & Training Infrastructure
  staff_with_current_licenses INTEGER,
  staff_with_expired_licenses INTEGER,
  staff_requiring_ceu_hours INTEGER,
  training_completion_rate NUMERIC,
  onboarding_completion_avg_days NUMERIC,
  
  -- Recovery Friendly Workplace Metrics
  recovery_friendly_certified BOOLEAN DEFAULT FALSE,
  certification_date DATE,
  certification_expires DATE,
  recovery_support_policies_implemented BOOLEAN,
  peer_specialists_employed INTEGER,
  lived_experience_staff_count INTEGER,
  recovery_accommodation_policies JSONB,
  
  -- SUD-Specific Workforce Competencies
  staff_with_sud_specialization INTEGER,
  staff_with_mat_training INTEGER,
  staff_with_trauma_informed_training INTEGER,
  staff_with_42cfr_training INTEGER,
  staff_with_harm_reduction_training INTEGER,
  
  -- Workforce Compliance & Risk
  background_checks_current INTEGER,
  background_checks_pending INTEGER,
  licenses_expiring_90_days INTEGER,
  compliance_training_overdue INTEGER,
  
  -- State Reporting Readiness
  mi_sutwa_export_ready BOOLEAN DEFAULT TRUE,
  mphi_dashboard_compatible BOOLEAN DEFAULT TRUE,
  mdhhs_reporting_compliant BOOLEAN DEFAULT TRUE,
  exported_to_state DATE,
  state_submission_confirmation TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recovery_friendly_workplace_initiatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  
  -- Initiative Details
  initiative_name VARCHAR(255),
  initiative_category VARCHAR(100), -- 'peer-support', 'accommodations', 'stigma-reduction', 'education'
  description TEXT,
  
  -- Implementation
  status VARCHAR(50), -- 'planned', 'active', 'completed', 'on-hold'
  start_date DATE,
  completion_date DATE,
  
  -- Impact Metrics
  staff_participating INTEGER,
  staff_requesting_accommodations INTEGER,
  recovery_disclosure_voluntary INTEGER,
  stigma_reduction_score NUMERIC, -- 1-10 scale
  
  -- Documentation
  policy_document_url TEXT,
  training_materials_url TEXT,
  
  -- MPHI Alignment
  aligns_with_mphi_framework BOOLEAN DEFAULT TRUE,
  mphi_pillar VARCHAR(100), -- 'prevent', 'treat', 'recover', 'harm-reduction'
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS workforce_infrastructure_gaps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  assessment_id UUID REFERENCES michigan_workforce_assessment(id),
  
  -- Gap Details
  gap_category VARCHAR(100), -- 'staffing', 'training', 'technology', 'facility', 'compliance'
  gap_description TEXT,
  severity VARCHAR(50), -- 'critical', 'high', 'medium', 'low'
  
  -- Impact Assessment
  affects_patient_care BOOLEAN,
  affects_compliance BOOLEAN,
  affects_revenue BOOLEAN,
  estimated_impact_cost NUMERIC,
  
  -- Proposed Solutions
  recommended_solution TEXT,
  estimated_cost_to_address NUMERIC,
  timeline_to_address_days INTEGER,
  priority_ranking INTEGER,
  
  -- State Coordination
  requires_state_support BOOLEAN,
  state_resource_requested VARCHAR(255),
  grant_opportunity_identified TEXT,
  
  -- Status Tracking
  gap_status VARCHAR(50), -- 'identified', 'planning', 'in-progress', 'resolved'
  resolution_date DATE,
  resolution_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS michigan_state_workforce_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  assessment_id UUID REFERENCES michigan_workforce_assessment(id),
  
  -- Export Details
  export_type VARCHAR(100), -- 'mi-sutwa', 'mphi-dashboard', 'mdhhs-report', 'recovery-friendly'
  export_date TIMESTAMPTZ DEFAULT NOW(),
  exported_by UUID,
  
  -- Data Package
  reporting_period_start DATE,
  reporting_period_end DATE,
  export_format VARCHAR(50), -- 'csv', 'json', 'xlsx', 'hl7', 'fhir'
  file_url TEXT,
  file_size_bytes BIGINT,
  
  -- Content Summary
  total_staff_records INTEGER,
  total_positions_reported INTEGER,
  total_gaps_reported INTEGER,
  workforce_metrics JSONB,
  
  -- State Acknowledgment
  submission_confirmed BOOLEAN DEFAULT FALSE,
  confirmation_number VARCHAR(100),
  acknowledged_by_state_at TIMESTAMPTZ,
  state_feedback TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_workforce_assessment_org ON michigan_workforce_assessment(organization_id);
CREATE INDEX IF NOT EXISTS idx_workforce_assessment_period ON michigan_workforce_assessment(assessment_period_start, assessment_period_end);
CREATE INDEX IF NOT EXISTS idx_recovery_initiatives_org ON recovery_friendly_workplace_initiatives(organization_id);
CREATE INDEX IF NOT EXISTS idx_workforce_gaps_org ON workforce_infrastructure_gaps(organization_id);
CREATE INDEX IF NOT EXISTS idx_workforce_gaps_severity ON workforce_infrastructure_gaps(severity, gap_status);
CREATE INDEX IF NOT EXISTS idx_state_exports_org ON michigan_state_workforce_exports(organization_id);
CREATE INDEX IF NOT EXISTS idx_state_exports_type ON michigan_state_workforce_exports(export_type, export_date);
