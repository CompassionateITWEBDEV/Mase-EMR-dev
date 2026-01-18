-- Assessment Forms Master Library Schema
-- Comprehensive clinical assessment tools for behavioral health

-- Master assessment forms catalog
CREATE TABLE IF NOT EXISTS assessment_forms_catalog (
    id SERIAL PRIMARY KEY,
    form_code VARCHAR(20) UNIQUE NOT NULL, -- e.g., 'ANSA', 'BAM', 'CGI'
    form_name VARCHAR(255) NOT NULL,
    full_name TEXT NOT NULL,
    category VARCHAR(100) NOT NULL, -- 'Depression', 'Anxiety', 'Substance Use', etc.
    description TEXT,
    scoring_guidelines TEXT,
    clinical_guidelines TEXT,
    version VARCHAR(20) DEFAULT '1.0',
    is_active BOOLEAN DEFAULT true,
    requires_training BOOLEAN DEFAULT false,
    frequency_recommendation VARCHAR(100), -- 'Weekly', 'Monthly', 'At Admission', etc.
    estimated_completion_minutes INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Assessment form questions/items
CREATE TABLE IF NOT EXISTS assessment_form_items (
    id SERIAL PRIMARY KEY,
    form_id INTEGER REFERENCES assessment_forms_catalog(id) ON DELETE CASCADE,
    item_number INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    response_type VARCHAR(50) NOT NULL, -- 'likert_5', 'yes_no', 'numeric', 'text', 'multiple_choice'
    response_options JSONB, -- For multiple choice options
    scoring_weight DECIMAL(5,2) DEFAULT 1.0,
    reverse_scored BOOLEAN DEFAULT false,
    is_required BOOLEAN DEFAULT true,
    section VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Patient assessment responses
CREATE TABLE IF NOT EXISTS patient_assessments (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL,
    form_id INTEGER REFERENCES assessment_forms_catalog(id),
    provider_id INTEGER NOT NULL,
    encounter_id INTEGER,
    assessment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) DEFAULT 'in_progress', -- 'in_progress', 'completed', 'reviewed', 'finalized'
    total_score DECIMAL(10,2),
    severity_level VARCHAR(50), -- 'Minimal', 'Mild', 'Moderate', 'Severe'
    clinical_interpretation TEXT,
    recommendations TEXT,
    next_assessment_due DATE,
    completed_at TIMESTAMP,
    reviewed_by INTEGER,
    reviewed_at TIMESTAMP,
    finalized_by INTEGER,
    finalized_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Individual item responses
CREATE TABLE IF NOT EXISTS assessment_responses (
    id SERIAL PRIMARY KEY,
    assessment_id INTEGER REFERENCES patient_assessments(id) ON DELETE CASCADE,
    item_id INTEGER REFERENCES assessment_form_items(id),
    response_value TEXT NOT NULL,
    numeric_value DECIMAL(10,2), -- For scoring calculations
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Provider work queue for "My Work" dashboard
CREATE TABLE IF NOT EXISTS provider_work_queue (
    id SERIAL PRIMARY KEY,
    provider_id INTEGER NOT NULL,
    patient_id INTEGER NOT NULL,
    task_type VARCHAR(100) NOT NULL, -- 'assessment_due', 'review_required', 'signature_needed'
    task_description TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
    due_date DATE,
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'overdue'
    related_assessment_id INTEGER REFERENCES patient_assessments(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
);

-- Encounter alerts and notifications
CREATE TABLE IF NOT EXISTS encounter_alerts (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL,
    provider_id INTEGER NOT NULL,
    encounter_id INTEGER,
    alert_type VARCHAR(100) NOT NULL, -- 'assessment_due', 'high_risk_score', 'missing_documentation'
    alert_message TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    is_acknowledged BOOLEAN DEFAULT false,
    acknowledged_by INTEGER,
    acknowledged_at TIMESTAMP,
    auto_dismiss_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Supervisory review tracking
CREATE TABLE IF NOT EXISTS supervisory_reviews (
    id SERIAL PRIMARY KEY,
    assessment_id INTEGER REFERENCES patient_assessments(id),
    supervisor_id INTEGER NOT NULL,
    provider_id INTEGER NOT NULL,
    review_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'approved', 'needs_revision', 'rejected'
    review_notes TEXT,
    feedback TEXT,
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert standard assessment forms
INSERT INTO assessment_forms_catalog (form_code, form_name, full_name, category, description, scoring_guidelines, clinical_guidelines, estimated_completion_minutes) VALUES
('ANSA', 'ANSA', 'Adult Needs and Strengths Assessment', 'Comprehensive Assessment', 'Comprehensive assessment tool for adults in behavioral health services', 'Scores range from 0-3 for each domain', 'Use for treatment planning and outcome measurement', 45),
('BAM', 'BAM', 'Brief Addiction Monitor', 'Substance Use', 'Brief assessment with scoring and clinical guidelines for addiction monitoring', 'Total score interpretation provided with clinical guidelines', 'Monitor treatment progress and identify areas of concern', 10),
('CGI', 'CGI', 'Clinical Global Impression', 'General Assessment', 'Global assessment of illness severity and improvement', '1-7 scale for severity and improvement', 'Use for overall clinical status evaluation', 5),
('C-SSRS', 'C-SSRS', 'Columbia Suicide Severity Rating Scale', 'Suicide Risk', 'Gold standard for suicide risk assessment', 'Binary and severity scoring for suicidal ideation and behavior', 'Critical for safety planning and risk management', 15),
('DASS-21', 'DASS-21', 'Depression, Anxiety and Stress Scale', 'Depression/Anxiety', '21-item assessment of depression, anxiety, and stress', 'Separate scores for each subscale with severity ranges', 'Useful for screening and monitoring treatment progress', 10),
('DERS', 'DERS', 'Difficulties in Emotion Regulation Scale', 'Emotion Regulation', 'Assessment of emotion regulation difficulties', 'Higher scores indicate greater difficulties', 'Helpful for trauma and personality disorder treatment', 15),
('DES-11', 'DES-11', 'Dissociative Experiences Scale', 'Trauma/Dissociation', 'Brief screening for dissociative experiences', 'Percentage scores with clinical cutoffs', 'Screen for dissociative disorders', 10),
('DLA-20', 'DLA-20', 'Daily Living Activities', 'Functional Assessment', 'Assessment of daily living skills and functioning', 'Functional capacity scoring', 'Treatment planning for independent living skills', 20),
('DSM5-CC', 'DSM-5 Level 1', 'DSM-5 Self Rated Level 1 Cross-Cutting Symptom Measure', 'Screening', 'Broad screening across multiple symptom domains', 'Domain-specific scoring with follow-up recommendations', 'Initial screening and ongoing monitoring', 15),
('FIAT-Q-SF', 'FIAT-Q-SF', 'Interpersonal Relationships Questionnaire', 'Relationships', 'Assessment of interpersonal relationship patterns', 'Relationship functioning scores', 'Treatment planning for relationship issues', 15),
('GAD-7', 'GAD-7', 'Generalized Anxiety Disorder', 'Anxiety', 'Seven-item anxiety screening and severity measure', '0-21 scale with severity categories', 'Primary care and specialty anxiety assessment', 5),
('LDQ', 'LDQ', 'Leeds Dependence Questionnaire', 'Substance Use', 'Assessment of psychological dependence on substances', 'Total dependence score with clinical interpretation', 'Substance use treatment planning', 10),
('MDI', 'MDI', 'Major Depression Inventory', 'Depression', 'Depression screening and severity assessment', 'DSM-5 compatible scoring for depression diagnosis', 'Depression screening and monitoring', 10),
('MFQ', 'MFQ', 'Adult Self Report', 'General Mental Health', 'Comprehensive adult mental health self-report measure', 'Multiple domain scoring with normative data', 'Comprehensive mental health assessment', 30),
('PCL-5', 'PCL-5', 'PTSD Checklist for DSM-5', 'PTSD/Trauma', 'Gold standard PTSD assessment for DSM-5', 'Total severity score with diagnostic cutoff', 'PTSD screening, diagnosis, and monitoring', 10),
('PHQ-4', 'PHQ-4', 'Patient Health Questionnaire-4', 'Depression/Anxiety', 'Ultra-brief screening for depression and anxiety', 'Combined and separate anxiety/depression scores', 'Quick screening in primary care', 2),
('PHQ-9', 'PHQ-9', 'Patient Health Questionnaire-9', 'Depression', 'Nine-item depression screening and severity measure', '0-27 scale with severity categories and diagnostic algorithm', 'Depression screening and monitoring', 5),
('PHQ-15', 'PHQ-15', 'Patient Health Questionnaire-15', 'Somatic Symptoms', 'Somatic symptom severity assessment', 'Total somatic symptom severity score', 'Assessment of physical symptom burden', 5),
('SADD', 'SADD', 'Short Alcohol Dependence Data Questionnaire', 'Alcohol Use', 'Brief alcohol dependence screening', 'Total dependence score with severity levels', 'Alcohol use disorder assessment', 5),
('SDS', 'SDS', 'Zung Self-Rating Depression Scale', 'Depression', 'Classic depression self-rating scale', 'Index score with depression severity levels', 'Depression screening and monitoring', 10),
('SOCRATES', 'SOCRATES 8A', 'Personal Drinking Questionnaire', 'Substance Use', 'Motivation for change in drinking behavior', 'Subscale scores for recognition, ambivalence, and taking steps', 'Motivational interviewing and treatment planning', 10),
('URICA', 'URICA', 'Change Assessment Scale', 'Motivation', 'Assessment of readiness to change behavior', 'Stage of change scoring', 'Treatment planning and motivational enhancement', 15);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_patient_assessments_patient_id ON patient_assessments(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_assessments_provider_id ON patient_assessments(provider_id);
CREATE INDEX IF NOT EXISTS idx_patient_assessments_status ON patient_assessments(status);
CREATE INDEX IF NOT EXISTS idx_provider_work_queue_provider_id ON provider_work_queue(provider_id);
CREATE INDEX IF NOT EXISTS idx_provider_work_queue_status ON provider_work_queue(status);
CREATE INDEX IF NOT EXISTS idx_encounter_alerts_patient_id ON encounter_alerts(patient_id);
CREATE INDEX IF NOT EXISTS idx_encounter_alerts_provider_id ON encounter_alerts(provider_id);
