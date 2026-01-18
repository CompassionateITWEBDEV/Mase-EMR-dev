-- Clinical Assessments Database Schema
-- Supports COWS, CIWA, Vitals, and Clinical Protocols

-- COWS (Clinical Opiate Withdrawal Scale) Assessment
CREATE TABLE IF NOT EXISTS cows_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id),
    provider_id UUID NOT NULL REFERENCES providers(id),
    assessment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- COWS Scale Items (0-4 scale each)
    resting_pulse_rate INTEGER CHECK (resting_pulse_rate >= 0 AND resting_pulse_rate <= 4),
    sweating INTEGER CHECK (sweating >= 0 AND sweating <= 4),
    restlessness INTEGER CHECK (restlessness >= 0 AND restlessness <= 4),
    pupil_size INTEGER CHECK (pupil_size >= 0 AND pupil_size <= 4),
    bone_joint_aches INTEGER CHECK (bone_joint_aches >= 0 AND bone_joint_aches <= 4),
    runny_nose_tearing INTEGER CHECK (runny_nose_tearing >= 0 AND runny_nose_tearing <= 4),
    gi_upset INTEGER CHECK (gi_upset >= 0 AND gi_upset <= 4),
    tremor INTEGER CHECK (tremor >= 0 AND tremor <= 4),
    yawning INTEGER CHECK (yawning >= 0 AND yawning <= 4),
    anxiety_irritability INTEGER CHECK (anxiety_irritability >= 0 AND anxiety_irritability <= 4),
    gooseflesh_skin INTEGER CHECK (gooseflesh_skin >= 0 AND gooseflesh_skin <= 4),
    
    total_score INTEGER GENERATED ALWAYS AS (
        COALESCE(resting_pulse_rate, 0) + COALESCE(sweating, 0) + COALESCE(restlessness, 0) +
        COALESCE(pupil_size, 0) + COALESCE(bone_joint_aches, 0) + COALESCE(runny_nose_tearing, 0) +
        COALESCE(gi_upset, 0) + COALESCE(tremor, 0) + COALESCE(yawning, 0) +
        COALESCE(anxiety_irritability, 0) + COALESCE(gooseflesh_skin, 0)
    ) STORED,
    
    severity_level TEXT GENERATED ALWAYS AS (
        CASE 
            WHEN (COALESCE(resting_pulse_rate, 0) + COALESCE(sweating, 0) + COALESCE(restlessness, 0) +
                  COALESCE(pupil_size, 0) + COALESCE(bone_joint_aches, 0) + COALESCE(runny_nose_tearing, 0) +
                  COALESCE(gi_upset, 0) + COALESCE(tremor, 0) + COALESCE(yawning, 0) +
                  COALESCE(anxiety_irritability, 0) + COALESCE(gooseflesh_skin, 0)) <= 12 THEN 'Mild'
            WHEN (COALESCE(resting_pulse_rate, 0) + COALESCE(sweating, 0) + COALESCE(restlessness, 0) +
                  COALESCE(pupil_size, 0) + COALESCE(bone_joint_aches, 0) + COALESCE(runny_nose_tearing, 0) +
                  COALESCE(gi_upset, 0) + COALESCE(tremor, 0) + COALESCE(yawning, 0) +
                  COALESCE(anxiety_irritability, 0) + COALESCE(gooseflesh_skin, 0)) <= 24 THEN 'Moderate'
            WHEN (COALESCE(resting_pulse_rate, 0) + COALESCE(sweating, 0) + COALESCE(restlessness, 0) +
                  COALESCE(pupil_size, 0) + COALESCE(bone_joint_aches, 0) + COALESCE(runny_nose_tearing, 0) +
                  COALESCE(gi_upset, 0) + COALESCE(tremor, 0) + COALESCE(yawning, 0) +
                  COALESCE(anxiety_irritability, 0) + COALESCE(gooseflesh_skin, 0)) <= 36 THEN 'Moderately Severe'
            ELSE 'Severe'
        END
    ) STORED,
    
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- CIWA (Clinical Institute Withdrawal Assessment) for Alcohol
CREATE TABLE IF NOT EXISTS ciwa_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id),
    provider_id UUID NOT NULL REFERENCES providers(id),
    assessment_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- CIWA Scale Items
    nausea_vomiting INTEGER CHECK (nausea_vomiting >= 0 AND nausea_vomiting <= 7),
    tremor INTEGER CHECK (tremor >= 0 AND tremor <= 7),
    paroxysmal_sweats INTEGER CHECK (paroxysmal_sweats >= 0 AND paroxysmal_sweats <= 7),
    anxiety INTEGER CHECK (anxiety >= 0 AND anxiety <= 7),
    agitation INTEGER CHECK (agitation >= 0 AND agitation <= 7),
    tactile_disturbances INTEGER CHECK (tactile_disturbances >= 0 AND tactile_disturbances <= 7),
    auditory_disturbances INTEGER CHECK (auditory_disturbances >= 0 AND auditory_disturbances <= 7),
    visual_disturbances INTEGER CHECK (visual_disturbances >= 0 AND visual_disturbances <= 7),
    headache_fullness INTEGER CHECK (headache_fullness >= 0 AND headache_fullness <= 7),
    orientation INTEGER CHECK (orientation >= 0 AND orientation <= 4),
    
    total_score INTEGER GENERATED ALWAYS AS (
        COALESCE(nausea_vomiting, 0) + COALESCE(tremor, 0) + COALESCE(paroxysmal_sweats, 0) +
        COALESCE(anxiety, 0) + COALESCE(agitation, 0) + COALESCE(tactile_disturbances, 0) +
        COALESCE(auditory_disturbances, 0) + COALESCE(visual_disturbances, 0) +
        COALESCE(headache_fullness, 0) + COALESCE(orientation, 0)
    ) STORED,
    
    severity_level TEXT GENERATED ALWAYS AS (
        CASE 
            WHEN (COALESCE(nausea_vomiting, 0) + COALESCE(tremor, 0) + COALESCE(paroxysmal_sweats, 0) +
                  COALESCE(anxiety, 0) + COALESCE(agitation, 0) + COALESCE(tactile_disturbances, 0) +
                  COALESCE(auditory_disturbances, 0) + COALESCE(visual_disturbances, 0) +
                  COALESCE(headache_fullness, 0) + COALESCE(orientation, 0)) <= 9 THEN 'Minimal'
            WHEN (COALESCE(nausea_vomiting, 0) + COALESCE(tremor, 0) + COALESCE(paroxysmal_sweats, 0) +
                  COALESCE(anxiety, 0) + COALESCE(agitation, 0) + COALESCE(tactile_disturbances, 0) +
                  COALESCE(auditory_disturbances, 0) + COALESCE(visual_disturbances, 0) +
                  COALESCE(headache_fullness, 0) + COALESCE(orientation, 0)) <= 15 THEN 'Mild to Moderate'
            ELSE 'Severe'
        END
    ) STORED,
    
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Vital Signs
CREATE TABLE IF NOT EXISTS vital_signs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id),
    provider_id UUID NOT NULL REFERENCES providers(id),
    measurement_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Basic Vitals
    systolic_bp INTEGER,
    diastolic_bp INTEGER,
    heart_rate INTEGER,
    respiratory_rate INTEGER,
    temperature DECIMAL(4,1),
    temperature_unit VARCHAR(1) DEFAULT 'F' CHECK (temperature_unit IN ('F', 'C')),
    oxygen_saturation INTEGER CHECK (oxygen_saturation >= 0 AND oxygen_saturation <= 100),
    
    -- Additional Measurements
    weight DECIMAL(5,1),
    weight_unit VARCHAR(3) DEFAULT 'lbs' CHECK (weight_unit IN ('lbs', 'kg')),
    height_feet INTEGER,
    height_inches INTEGER,
    height_cm INTEGER,
    bmi DECIMAL(4,1),
    
    -- Pain Scale
    pain_scale INTEGER CHECK (pain_scale >= 0 AND pain_scale <= 10),
    pain_location TEXT,
    
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clinical Protocols
CREATE TABLE IF NOT EXISTS clinical_protocols (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    protocol_steps JSONB,
    triggers JSONB, -- Conditions that trigger this protocol
    frequency VARCHAR(50), -- daily, weekly, monthly, as_needed
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES providers(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Protocol Executions
CREATE TABLE IF NOT EXISTS protocol_executions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    protocol_id UUID NOT NULL REFERENCES clinical_protocols(id),
    patient_id UUID NOT NULL REFERENCES patients(id),
    provider_id UUID NOT NULL REFERENCES providers(id),
    execution_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
    results JSONB,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- E-Prescribing
CREATE TABLE IF NOT EXISTS prescriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id),
    provider_id UUID NOT NULL REFERENCES providers(id),
    medication_name VARCHAR(255) NOT NULL,
    generic_name VARCHAR(255),
    ndc_number VARCHAR(20),
    strength VARCHAR(100),
    dosage_form VARCHAR(100),
    quantity INTEGER,
    days_supply INTEGER,
    directions_for_use TEXT,
    refills_authorized INTEGER DEFAULT 0,
    dea_schedule VARCHAR(5),
    
    -- Prescription Status
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'filled', 'cancelled', 'expired')),
    prescribed_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sent_date TIMESTAMP WITH TIME ZONE,
    filled_date TIMESTAMP WITH TIME ZONE,
    
    -- Pharmacy Information
    pharmacy_name VARCHAR(255),
    pharmacy_npi VARCHAR(20),
    pharmacy_phone VARCHAR(20),
    
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lab Orders and Results
CREATE TABLE IF NOT EXISTS lab_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id),
    provider_id UUID NOT NULL REFERENCES providers(id),
    order_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Lab Information
    lab_name VARCHAR(255),
    lab_npi VARCHAR(20),
    test_codes JSONB, -- Array of CPT/LOINC codes
    test_names JSONB, -- Array of test names
    
    -- Order Status
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'collected', 'resulted', 'cancelled')),
    priority VARCHAR(20) DEFAULT 'routine' CHECK (priority IN ('stat', 'urgent', 'routine')),
    
    -- Collection Information
    collection_date TIMESTAMP WITH TIME ZONE,
    collection_method VARCHAR(100),
    specimen_type VARCHAR(100),
    
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lab_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lab_order_id UUID NOT NULL REFERENCES lab_orders(id),
    patient_id UUID NOT NULL REFERENCES patients(id),
    result_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Test Information
    test_code VARCHAR(20),
    test_name VARCHAR(255),
    result_value VARCHAR(255),
    reference_range VARCHAR(255),
    units VARCHAR(50),
    abnormal_flag VARCHAR(10),
    
    -- Result Status
    status VARCHAR(50) DEFAULT 'final' CHECK (status IN ('preliminary', 'final', 'corrected', 'cancelled')),
    
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Productivity Tracking
CREATE TABLE IF NOT EXISTS productivity_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    provider_id UUID NOT NULL REFERENCES providers(id),
    metric_date DATE DEFAULT CURRENT_DATE,
    
    -- Patient Metrics
    patients_seen INTEGER DEFAULT 0,
    new_patients INTEGER DEFAULT 0,
    follow_up_patients INTEGER DEFAULT 0,
    
    -- Time Metrics
    total_patient_time INTEGER DEFAULT 0, -- minutes
    documentation_time INTEGER DEFAULT 0, -- minutes
    
    -- Clinical Metrics
    assessments_completed INTEGER DEFAULT 0,
    prescriptions_written INTEGER DEFAULT 0,
    lab_orders_placed INTEGER DEFAULT 0,
    
    -- Billing Metrics
    billable_units DECIMAL(5,2) DEFAULT 0,
    revenue_generated DECIMAL(10,2) DEFAULT 0,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(provider_id, metric_date)
);

-- Audit Trail
CREATE TABLE IF NOT EXISTS audit_trail (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    patient_id UUID,
    action VARCHAR(100) NOT NULL,
    table_name VARCHAR(100),
    record_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_cows_patient_date ON cows_assessments(patient_id, assessment_date DESC);
CREATE INDEX IF NOT EXISTS idx_ciwa_patient_date ON ciwa_assessments(patient_id, assessment_date DESC);
CREATE INDEX IF NOT EXISTS idx_vitals_patient_date ON vital_signs(patient_id, measurement_date DESC);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient ON prescriptions(patient_id, prescribed_date DESC);
CREATE INDEX IF NOT EXISTS idx_lab_orders_patient ON lab_orders(patient_id, order_date DESC);
CREATE INDEX IF NOT EXISTS idx_lab_results_order ON lab_results(lab_order_id);
CREATE INDEX IF NOT EXISTS idx_productivity_provider_date ON productivity_metrics(provider_id, metric_date DESC);
CREATE INDEX IF NOT EXISTS idx_audit_trail_timestamp ON audit_trail(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_audit_trail_patient ON audit_trail(patient_id, timestamp DESC);
