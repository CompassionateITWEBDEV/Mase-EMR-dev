-- Crisis, Detox, and Security Officer Management Systems
-- Comprehensive crisis stabilization, medical detox, and security integration

-- ============================================================================
-- DETOX MANAGEMENT SYSTEM
-- ============================================================================

CREATE TABLE IF NOT EXISTS detox_admissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    patient_id UUID NOT NULL,
    admission_number VARCHAR(50) UNIQUE NOT NULL,
    admission_date TIMESTAMP WITH TIME ZONE NOT NULL,
    admission_source VARCHAR(100), -- ED, Direct, Transfer, etc.
    referring_provider_id UUID,
    primary_substance VARCHAR(100) NOT NULL,
    secondary_substances JSONB, -- Array of other substances
    last_use_date DATE,
    last_use_amount TEXT,
    daily_use_amount TEXT,
    years_of_use INTEGER,
    previous_detox_attempts INTEGER DEFAULT 0,
    previous_seizures BOOLEAN DEFAULT false,
    medical_history JSONB, -- Comorbidities, allergies
    psychiatric_history JSONB,
    admission_vital_signs JSONB,
    admission_assessment TEXT,
    withdrawal_risk_level VARCHAR(50), -- Low, Moderate, High, Severe
    medical_stabilization_required BOOLEAN DEFAULT false,
    psychiatry_consult_needed BOOLEAN DEFAULT false,
    detox_protocol VARCHAR(100), -- Alcohol, Opioid, Benzodiazepine, Stimulant
    estimated_length_of_stay_days INTEGER,
    discharge_date TIMESTAMP WITH TIME ZONE,
    discharge_disposition VARCHAR(100), -- AMA, Completed, Transfer, etc.
    discharge_summary TEXT,
    followup_plan TEXT,
    status VARCHAR(50) DEFAULT 'Active', -- Active, Discharged, Transferred, AMA
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS detox_ciwa_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    detox_admission_id UUID NOT NULL REFERENCES detox_admissions(id),
    patient_id UUID NOT NULL,
    assessment_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    assessed_by UUID NOT NULL,
    -- CIWA-Ar Scoring (0-7 scale for most items)
    nausea_vomiting INTEGER CHECK (nausea_vomiting BETWEEN 0 AND 7),
    tremor INTEGER CHECK (tremor BETWEEN 0 AND 7),
    paroxysmal_sweats INTEGER CHECK (paroxysmal_sweats BETWEEN 0 AND 7),
    anxiety INTEGER CHECK (anxiety BETWEEN 0 AND 7),
    agitation INTEGER CHECK (agitation BETWEEN 0 AND 7),
    tactile_disturbances INTEGER CHECK (tactile_disturbances BETWEEN 0 AND 7),
    auditory_disturbances INTEGER CHECK (auditory_disturbances BETWEEN 0 AND 7),
    visual_disturbances INTEGER CHECK (visual_disturbances BETWEEN 0 AND 7),
    headache INTEGER CHECK (headache BETWEEN 0 AND 7),
    orientation INTEGER CHECK (orientation BETWEEN 0 AND 4), -- 0-4 scale
    total_score INTEGER GENERATED ALWAYS AS (
        COALESCE(nausea_vomiting, 0) + COALESCE(tremor, 0) + COALESCE(paroxysmal_sweats, 0) +
        COALESCE(anxiety, 0) + COALESCE(agitation, 0) + COALESCE(tactile_disturbances, 0) +
        COALESCE(auditory_disturbances, 0) + COALESCE(visual_disturbances, 0) +
        COALESCE(headache, 0) + COALESCE(orientation, 0)
    ) STORED,
    severity VARCHAR(50) GENERATED ALWAYS AS (
        CASE
            WHEN (COALESCE(nausea_vomiting, 0) + COALESCE(tremor, 0) + COALESCE(paroxysmal_sweats, 0) +
                  COALESCE(anxiety, 0) + COALESCE(agitation, 0) + COALESCE(tactile_disturbances, 0) +
                  COALESCE(auditory_disturbances, 0) + COALESCE(visual_disturbances, 0) +
                  COALESCE(headache, 0) + COALESCE(orientation, 0)) < 8 THEN 'Minimal'
            WHEN (COALESCE(nausea_vomiting, 0) + COALESCE(tremor, 0) + COALESCE(paroxysmal_sweats, 0) +
                  COALESCE(anxiety, 0) + COALESCE(agitation, 0) + COALESCE(tactile_disturbances, 0) +
                  COALESCE(auditory_disturbances, 0) + COALESCE(visual_disturbances, 0) +
                  COALESCE(headache, 0) + COALESCE(orientation, 0)) < 15 THEN 'Moderate'
            ELSE 'Severe'
        END
    ) STORED,
    vital_signs JSONB, -- BP, HR, Temp, RR, O2sat
    prn_medication_given BOOLEAN DEFAULT false,
    prn_medication_details TEXT,
    nursing_notes TEXT,
    physician_notified BOOLEAN DEFAULT false,
    physician_notified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_detox_ciwa_patient ON detox_ciwa_scores(patient_id, assessment_timestamp DESC);
CREATE INDEX idx_detox_ciwa_admission ON detox_ciwa_scores(detox_admission_id, assessment_timestamp DESC);

CREATE TABLE IF NOT EXISTS detox_cows_scores (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    detox_admission_id UUID NOT NULL REFERENCES detox_admissions(id),
    patient_id UUID NOT NULL,
    assessment_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    assessed_by UUID NOT NULL,
    -- COWS Scoring
    resting_pulse_rate INTEGER CHECK (resting_pulse_rate BETWEEN 0 AND 4),
    sweating INTEGER CHECK (sweating BETWEEN 0 AND 4),
    restlessness INTEGER CHECK (restlessness BETWEEN 0 AND 5),
    pupil_size INTEGER CHECK (pupil_size BETWEEN 0 AND 5),
    bone_joint_aches INTEGER CHECK (bone_joint_aches BETWEEN 0 AND 4),
    runny_nose_tearing INTEGER CHECK (runny_nose_tearing BETWEEN 0 AND 4),
    gi_upset INTEGER CHECK (gi_upset BETWEEN 0 AND 5),
    tremor INTEGER CHECK (tremor BETWEEN 0 AND 1),
    yawning INTEGER CHECK (yawning BETWEEN 0 AND 4),
    anxiety_irritability INTEGER CHECK (anxiety_irritability BETWEEN 0 AND 4),
    gooseflesh_skin INTEGER CHECK (gooseflesh_skin BETWEEN 0 AND 5),
    total_score INTEGER GENERATED ALWAYS AS (
        COALESCE(resting_pulse_rate, 0) + COALESCE(sweating, 0) + COALESCE(restlessness, 0) +
        COALESCE(pupil_size, 0) + COALESCE(bone_joint_aches, 0) + COALESCE(runny_nose_tearing, 0) +
        COALESCE(gi_upset, 0) + COALESCE(tremor, 0) + COALESCE(yawning, 0) +
        COALESCE(anxiety_irritability, 0) + COALESCE(gooseflesh_skin, 0)
    ) STORED,
    severity VARCHAR(50) GENERATED ALWAYS AS (
        CASE
            WHEN (COALESCE(resting_pulse_rate, 0) + COALESCE(sweating, 0) + COALESCE(restlessness, 0) +
                  COALESCE(pupil_size, 0) + COALESCE(bone_joint_aches, 0) + COALESCE(runny_nose_tearing, 0) +
                  COALESCE(gi_upset, 0) + COALESCE(tremor, 0) + COALESCE(yawning, 0) +
                  COALESCE(anxiety_irritability, 0) + COALESCE(gooseflesh_skin, 0)) < 5 THEN 'None'
            WHEN (COALESCE(resting_pulse_rate, 0) + COALESCE(sweating, 0) + COALESCE(restlessness, 0) +
                  COALESCE(pupil_size, 0) + COALESCE(bone_joint_aches, 0) + COALESCE(runny_nose_tearing, 0) +
                  COALESCE(gi_upset, 0) + COALESCE(tremor, 0) + COALESCE(yawning, 0) +
                  COALESCE(anxiety_irritability, 0) + COALESCE(gooseflesh_skin, 0)) < 13 THEN 'Mild'
            WHEN (COALESCE(resting_pulse_rate, 0) + COALESCE(sweating, 0) + COALESCE(restlessness, 0) +
                  COALESCE(pupil_size, 0) + COALESCE(bone_joint_aches, 0) + COALESCE(runny_nose_tearing, 0) +
                  COALESCE(gi_upset, 0) + COALESCE(tremor, 0) + COALESCE(yawning, 0) +
                  COALESCE(anxiety_irritability, 0) + COALESCE(gooseflesh_skin, 0)) < 25 THEN 'Moderate'
            ELSE 'Severe'
        END
    ) STORED,
    vital_signs JSONB,
    comfort_medication_given BOOLEAN DEFAULT false,
    comfort_medication_details TEXT,
    nursing_notes TEXT,
    physician_notified BOOLEAN DEFAULT false,
    physician_notified_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_detox_cows_patient ON detox_cows_scores(patient_id, assessment_timestamp DESC);
CREATE INDEX idx_detox_cows_admission ON detox_cows_scores(detox_admission_id, assessment_timestamp DESC);

CREATE TABLE IF NOT EXISTS detox_protocols (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    protocol_name VARCHAR(200) NOT NULL,
    substance_type VARCHAR(100) NOT NULL, -- Alcohol, Opioid, Benzodiazepine, etc.
    assessment_tool VARCHAR(50), -- CIWA, COWS, etc.
    assessment_frequency_hours INTEGER NOT NULL,
    protocol_steps JSONB NOT NULL, -- Intervention thresholds and medications
    comfort_medications JSONB, -- PRN meds with scoring thresholds
    monitoring_parameters JSONB,
    safety_protocols TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- BEHAVIORAL HEALTH CRISIS UNIT
-- ============================================================================

CREATE TABLE IF NOT EXISTS crisis_admissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    patient_id UUID NOT NULL,
    admission_number VARCHAR(50) UNIQUE NOT NULL,
    admission_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    arrival_method VARCHAR(100), -- Walk-in, Police, EMS, Referral
    police_hold BOOLEAN DEFAULT false,
    police_hold_type VARCHAR(100), -- Voluntary, Emergency Detention
    police_agency VARCHAR(200),
    police_officer_name VARCHAR(200),
    police_case_number VARCHAR(100),
    presenting_crisis VARCHAR(50) NOT NULL, -- Suicidal, Homicidal, Psychotic, Agitated, etc.
    chief_complaint TEXT NOT NULL,
    crisis_description TEXT,
    suicide_risk_level VARCHAR(50), -- None, Low, Moderate, High, Imminent
    homicide_risk_level VARCHAR(50),
    self_harm_risk_level VARCHAR(50),
    elopement_risk VARCHAR(50),
    aggression_risk VARCHAR(50),
    current_symptoms JSONB,
    mental_status_exam JSONB,
    psychiatric_history JSONB,
    current_medications JSONB,
    substance_use_screening JSONB,
    medical_clearance_obtained BOOLEAN DEFAULT false,
    medical_clearance_by VARCHAR(200),
    medical_clearance_at TIMESTAMP WITH TIME ZONE,
    admission_disposition VARCHAR(100), -- Voluntary, Involuntary
    legal_status VARCHAR(100),
    crisis_plan_developed BOOLEAN DEFAULT false,
    safety_plan_created BOOLEAN DEFAULT false,
    discharge_timestamp TIMESTAMP WITH TIME ZONE,
    discharge_disposition VARCHAR(100), -- Home, Inpatient, Partial, AMA
    length_of_stay_hours NUMERIC,
    status VARCHAR(50) DEFAULT 'Active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crisis_safety_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crisis_admission_id UUID NOT NULL REFERENCES crisis_admissions(id),
    patient_id UUID NOT NULL,
    assessment_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    assessed_by UUID NOT NULL,
    assessor_role VARCHAR(100),
    -- Columbia Suicide Severity Rating Scale (C-SSRS)
    suicidal_ideation BOOLEAN,
    suicidal_ideation_severity INTEGER CHECK (suicidal_ideation_severity BETWEEN 0 AND 5),
    suicidal_intent BOOLEAN,
    specific_plan BOOLEAN,
    plan_details TEXT,
    access_to_lethal_means BOOLEAN,
    means_description TEXT,
    suicidal_behavior_lifetime BOOLEAN,
    suicidal_behavior_recent BOOLEAN,
    protective_factors JSONB,
    risk_factors JSONB,
    overall_risk_level VARCHAR(50), -- Low, Moderate, High, Imminent
    -- Violence Risk
    homicidal_ideation BOOLEAN,
    homicidal_target TEXT,
    history_of_violence BOOLEAN,
    weapons_access BOOLEAN,
    violence_risk_level VARCHAR(50),
    -- Safety Interventions
    safety_precautions JSONB, -- 1:1, Q15 checks, room search, etc.
    seclusion_required BOOLEAN DEFAULT false,
    restraints_required BOOLEAN DEFAULT false,
    contraband_found BOOLEAN DEFAULT false,
    contraband_details TEXT,
    belongings_secured BOOLEAN DEFAULT false,
    notify_security BOOLEAN DEFAULT false,
    security_notified_at TIMESTAMP WITH TIME ZONE,
    assessment_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_crisis_safety_patient ON crisis_safety_assessments(patient_id, assessment_timestamp DESC);

CREATE TABLE IF NOT EXISTS crisis_interventions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crisis_admission_id UUID NOT NULL REFERENCES crisis_admissions(id),
    patient_id UUID NOT NULL,
    intervention_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    intervention_type VARCHAR(100) NOT NULL, -- Verbal De-escalation, Medication, Seclusion, Restraint
    intervention_reason TEXT NOT NULL,
    intervention_staff JSONB NOT NULL, -- Array of staff involved
    intervention_details TEXT,
    medication_administered JSONB, -- If applicable
    duration_minutes INTEGER,
    patient_response TEXT,
    effectiveness_rating VARCHAR(50), -- Effective, Partially Effective, Ineffective
    adverse_events TEXT,
    physician_notification_required BOOLEAN DEFAULT false,
    physician_notified BOOLEAN DEFAULT false,
    physician_name VARCHAR(200),
    follow_up_actions TEXT,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS crisis_observation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    crisis_admission_id UUID NOT NULL REFERENCES crisis_admissions(id),
    patient_id UUID NOT NULL,
    observation_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    observed_by UUID NOT NULL,
    observation_level VARCHAR(50) NOT NULL, -- 1:1, Q15, Q30, Routine
    patient_location VARCHAR(100),
    behavior_observed TEXT NOT NULL,
    mood VARCHAR(100),
    affect VARCHAR(100),
    interaction_quality VARCHAR(100),
    verbalizations TEXT,
    sleep_status VARCHAR(50),
    eating_status VARCHAR(50),
    hygiene_status VARCHAR(50),
    safety_concerns BOOLEAN DEFAULT false,
    safety_concern_details TEXT,
    vitals_checked BOOLEAN DEFAULT false,
    vitals JSONB,
    medications_offered BOOLEAN DEFAULT false,
    medications_accepted BOOLEAN,
    therapeutic_activities TEXT,
    next_observation_due TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_crisis_obs_patient ON crisis_observation_logs(patient_id, observation_timestamp DESC);
CREATE INDEX idx_crisis_obs_due ON crisis_observation_logs(next_observation_due) WHERE next_observation_due IS NOT NULL;

-- ============================================================================
-- SECURITY OFFICER PORTAL
-- ============================================================================

CREATE TABLE IF NOT EXISTS security_officers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    employee_id UUID,
    officer_name VARCHAR(200) NOT NULL,
    badge_number VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(200),
    phone VARCHAR(50),
    security_clearance_level VARCHAR(50), -- Basic, Intermediate, Advanced
    cpi_trained BOOLEAN DEFAULT false, -- Crisis Prevention Intervention
    cpi_certification_date DATE,
    cpi_expiration_date DATE,
    de_escalation_trained BOOLEAN DEFAULT false,
    hipaa_trained BOOLEAN DEFAULT false,
    shift_assignment VARCHAR(50), -- Day, Evening, Night, Swing
    is_active BOOLEAN DEFAULT true,
    hire_date DATE,
    termination_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS security_incidents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    incident_number VARCHAR(50) UNIQUE NOT NULL,
    incident_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    reported_by UUID NOT NULL,
    reporter_role VARCHAR(100),
    incident_type VARCHAR(100) NOT NULL, -- Assault, Threat, Elopement, Contraband, Medical Emergency
    incident_category VARCHAR(50), -- Patient-to-Patient, Patient-to-Staff, Visitor, Environmental
    incident_location VARCHAR(200) NOT NULL,
    patient_involved_id UUID,
    patient_involved_name VARCHAR(200),
    staff_involved JSONB, -- Array of staff
    visitors_involved JSONB,
    other_patients_involved JSONB,
    incident_description TEXT NOT NULL,
    immediate_actions_taken TEXT,
    security_response JSONB, -- Officers who responded
    security_response_time_minutes INTEGER,
    police_notified BOOLEAN DEFAULT false,
    police_agency VARCHAR(200),
    police_case_number VARCHAR(100),
    police_officer_name VARCHAR(200),
    ems_called BOOLEAN DEFAULT false,
    ems_agency VARCHAR(200),
    hospital_transport BOOLEAN DEFAULT false,
    hospital_name VARCHAR(200),
    injuries_reported BOOLEAN DEFAULT false,
    injuries_description TEXT,
    medical_treatment_provided TEXT,
    weapons_involved BOOLEAN DEFAULT false,
    weapons_description TEXT,
    contraband_seized BOOLEAN DEFAULT false,
    contraband_description TEXT,
    property_damage BOOLEAN DEFAULT false,
    property_damage_description TEXT,
    estimated_damage_cost NUMERIC,
    video_footage_available BOOLEAN DEFAULT false,
    video_footage_location TEXT,
    witness_statements JSONB,
    incident_severity VARCHAR(50), -- Minor, Moderate, Major, Critical
    follow_up_required BOOLEAN DEFAULT false,
    follow_up_actions TEXT,
    investigation_status VARCHAR(50) DEFAULT 'Open',
    investigation_notes TEXT,
    closed_at TIMESTAMP WITH TIME ZONE,
    closed_by UUID,
    regulatory_reporting_required BOOLEAN DEFAULT false,
    regulatory_reports JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_security_incidents_patient ON security_incidents(patient_involved_id);
CREATE INDEX idx_security_incidents_timestamp ON security_incidents(incident_timestamp DESC);

CREATE TABLE IF NOT EXISTS security_rounds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    round_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    officer_id UUID NOT NULL REFERENCES security_officers(id),
    round_type VARCHAR(50) NOT NULL, -- Routine, Crisis Response, Contraband Check
    areas_checked JSONB NOT NULL, -- Array of locations
    abnormalities_found BOOLEAN DEFAULT false,
    abnormalities_description TEXT,
    patients_on_observation_checked JSONB,
    all_patients_accounted BOOLEAN DEFAULT true,
    missing_patients JSONB,
    safety_hazards_identified BOOLEAN DEFAULT false,
    hazards_description TEXT,
    hazards_remediated BOOLEAN DEFAULT false,
    doors_locks_checked BOOLEAN DEFAULT false,
    doors_status TEXT,
    emergency_exits_clear BOOLEAN DEFAULT true,
    fire_safety_equipment_checked BOOLEAN DEFAULT false,
    fire_safety_status TEXT,
    next_round_due TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_security_rounds_officer ON security_rounds(officer_id, round_timestamp DESC);
CREATE INDEX idx_security_rounds_next_due ON security_rounds(next_round_due) WHERE next_round_due IS NOT NULL;

CREATE TABLE IF NOT EXISTS security_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL,
    alert_timestamp TIMESTAMP WITH TIME ZONE NOT NULL,
    alert_type VARCHAR(100) NOT NULL, -- Code Grey (Combative), Code Silver (Weapon), Code Yellow (Missing), Code White (Pediatric), Code Pink (Infant Abduction)
    alert_location VARCHAR(200) NOT NULL,
    patient_id UUID,
    staff_member_id UUID,
    alert_description TEXT NOT NULL,
    initiated_by UUID NOT NULL,
    security_officers_dispatched JSONB,
    response_time_seconds INTEGER,
    all_clear_timestamp TIMESTAMP WITH TIME ZONE,
    resolution_summary TEXT,
    status VARCHAR(50) DEFAULT 'Active', -- Active, Resolved, Escalated
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_security_alerts_status ON security_alerts(status, alert_timestamp DESC);

CREATE TABLE IF NOT EXISTS patient_safety_flags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL,
    organization_id UUID NOT NULL,
    flag_type VARCHAR(100) NOT NULL, -- Violence Risk, Elopement Risk, Contraband History, etc.
    flag_category VARCHAR(50), -- Safety, Security, Clinical
    severity VARCHAR(50) NOT NULL, -- Low, Moderate, High
    flag_description TEXT NOT NULL,
    evidence_basis TEXT,
    active_date DATE NOT NULL,
    expiration_date DATE,
    requires_security_notification BOOLEAN DEFAULT false,
    requires_precautions JSONB,
    is_active BOOLEAN DEFAULT true,
    reviewed_date DATE,
    reviewed_by UUID,
    review_notes TEXT,
    created_by UUID NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_patient_safety_flags_patient ON patient_safety_flags(patient_id) WHERE is_active = true;

-- Create views for real-time monitoring
CREATE OR REPLACE VIEW v_crisis_patients_requiring_observation AS
SELECT 
    ca.id AS admission_id,
    ca.patient_id,
    ca.admission_number,
    p.first_name,
    p.last_name,
    ca.presenting_crisis,
    csa.overall_risk_level,
    csa.safety_precautions,
    col.observation_level,
    col.next_observation_due,
    CASE 
        WHEN col.next_observation_due < NOW() THEN 'OVERDUE'
        WHEN col.next_observation_due < NOW() + INTERVAL '5 minutes' THEN 'DUE SOON'
        ELSE 'ON SCHEDULE'
    END AS observation_status
FROM crisis_admissions ca
JOIN patients p ON ca.patient_id = p.id
LEFT JOIN LATERAL (
    SELECT * FROM crisis_safety_assessments 
    WHERE crisis_admission_id = ca.id 
    ORDER BY assessment_timestamp DESC 
    LIMIT 1
) csa ON true
LEFT JOIN LATERAL (
    SELECT * FROM crisis_observation_logs 
    WHERE crisis_admission_id = ca.id 
    ORDER BY observation_timestamp DESC 
    LIMIT 1
) col ON true
WHERE ca.status = 'Active';

CREATE OR REPLACE VIEW v_detox_patients_requiring_assessment AS
SELECT 
    da.id AS admission_id,
    da.patient_id,
    da.admission_number,
    p.first_name,
    p.last_name,
    da.primary_substance,
    da.detox_protocol,
    CASE 
        WHEN da.detox_protocol LIKE '%Alcohol%' THEN 'CIWA'
        WHEN da.detox_protocol LIKE '%Opioid%' THEN 'COWS'
        ELSE 'Clinical Observation'
    END AS assessment_tool,
    COALESCE(ciwa.total_score, 0) AS last_ciwa_score,
    COALESCE(cows.total_score, 0) AS last_cows_score,
    COALESCE(ciwa.severity, cows.severity) AS last_severity,
    GREATEST(ciwa.assessment_timestamp, cows.assessment_timestamp) AS last_assessment_time,
    CASE 
        WHEN GREATEST(ciwa.assessment_timestamp, cows.assessment_timestamp) < NOW() - INTERVAL '4 hours' THEN 'OVERDUE'
        WHEN GREATEST(ciwa.assessment_timestamp, cows.assessment_timestamp) < NOW() - INTERVAL '3 hours' THEN 'DUE SOON'
        ELSE 'ON SCHEDULE'
    END AS assessment_status
FROM detox_admissions da
JOIN patients p ON da.patient_id = p.id
LEFT JOIN LATERAL (
    SELECT * FROM detox_ciwa_scores 
    WHERE detox_admission_id = da.id 
    ORDER BY assessment_timestamp DESC 
    LIMIT 1
) ciwa ON true
LEFT JOIN LATERAL (
    SELECT * FROM detox_cows_scores 
    WHERE detox_admission_id = da.id 
    ORDER BY assessment_timestamp DESC 
    LIMIT 1
) cows ON true
WHERE da.status = 'Active';

COMMENT ON TABLE detox_admissions IS 'Medical detoxification admission tracking with CIWA/COWS protocols';
COMMENT ON TABLE crisis_admissions IS 'Behavioral health crisis stabilization unit admissions';
COMMENT ON TABLE security_officers IS 'Security personnel with CPI training and clearance levels';
COMMENT ON TABLE security_incidents IS 'Comprehensive security incident tracking and investigation';
COMMENT ON TABLE security_alerts IS 'Real-time security alerts (Code Grey, Silver, Yellow, etc.)';
COMMENT ON TABLE patient_safety_flags IS 'Patient-level safety and security risk flags';
