-- Consent Forms Management System
-- Create tables for managing all required consent forms

-- Form templates table
CREATE TABLE IF NOT EXISTS form_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100),
    is_required BOOLEAN DEFAULT false,
    version VARCHAR(50) DEFAULT '1.0',
    template_content JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Patient consent records
CREATE TABLE IF NOT EXISTS patient_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    form_template_id UUID NOT NULL REFERENCES form_templates(id),
    status VARCHAR(50) DEFAULT 'pending', -- pending, signed, declined, expired
    signed_date TIMESTAMP WITH TIME ZONE,
    expiry_date TIMESTAMP WITH TIME ZONE,
    signed_by VARCHAR(255),
    witness_name VARCHAR(255),
    witness_signature TEXT,
    patient_signature TEXT,
    form_data JSONB,
    document_url TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Consent form audit trail
CREATE TABLE IF NOT EXISTS consent_audit_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_consent_id UUID NOT NULL REFERENCES patient_consents(id),
    action VARCHAR(100) NOT NULL,
    performed_by UUID REFERENCES staff(id),
    details JSONB,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert all required form templates
INSERT INTO form_templates (name, description, category, is_required) VALUES
-- COVID and Health Screening
('COVID-19 Patient Screening Form', 'Health screening questionnaire for COVID-19 symptoms and exposure', 'Health Screening', true),

-- Program Policies
('Take Home Policy', 'Agreement for take-home medication policies and procedures', 'Program Policies', true),
('Program Description', 'Overview of treatment program services and expectations', 'Program Information', true),
('Program Rules and Expectations', 'Detailed program rules and behavioral expectations', 'Program Policies', true),

-- Grievance and Complaints
('Client Grievance and Complaint Process', 'Information about filing grievances and complaints', 'Patient Rights', true),

-- Drug Testing and Monitoring
('Random Drug Testing', 'Consent for random drug testing procedures', 'Testing Procedures', true),
('Urine Drug Screen Policy', 'Policy and procedures for urine drug screening', 'Testing Procedures', true),

-- Media and Documentation
('Video Testimonial Release Form', 'Permission to use patient testimonials in video format', 'Media Release', false),
('Consent for Camera Surveillance & Therapeutic Photograph', 'Authorization for facility surveillance and therapeutic photography', 'Media Release', true),

-- Treatment and Care
('Patient Orientation Checklist', 'Checklist of orientation topics covered with patient', 'Orientation', true),
('Consent for Treatment', 'General consent for medical and behavioral health treatment', 'Treatment Consent', true),
('Safety Contract', 'Agreement regarding safety protocols and emergency procedures', 'Safety', true),

-- Medication Management
('Locked Boxes for Take-Outs Policy/Agreement Certification', 'Agreement for secure storage of take-home medications', 'Medication Management', true),
('Medication Destruction', 'Policy for proper disposal of unused medications', 'Medication Management', true),

-- Telemedicine and Technology
('Informed Consent for Telemedicine Services', 'Consent for receiving services via telemedicine platforms', 'Telemedicine', false),

-- Information and Privacy
('Release of Information', 'Authorization to release patient information to specified parties', 'Privacy', false),
('Confidentiality, HIPAA, and Privacy Practice Notice', 'Notice of privacy practices and HIPAA rights', 'Privacy', true),

-- Health and Safety
('Universal Infection Control and HIV Assessment', 'Consent for infection control measures and HIV assessment', 'Health Assessment', true),

-- Assessment and Intake
('Pre-Admission Assessment', 'Comprehensive assessment prior to program admission', 'Assessment', true),
('Drug and Alcohol Use Policy', 'Policy regarding drug and alcohol use during treatment', 'Program Policies', true)

ON CONFLICT (name) DO NOTHING;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_patient_consents_patient_id ON patient_consents(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_consents_form_template_id ON patient_consents(form_template_id);
CREATE INDEX IF NOT EXISTS idx_patient_consents_status ON patient_consents(status);
CREATE INDEX IF NOT EXISTS idx_consent_audit_log_patient_consent_id ON consent_audit_log(patient_consent_id);

-- Enable RLS
ALTER TABLE form_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_consents ENABLE ROW LEVEL SECURITY;
ALTER TABLE consent_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Staff can view all form templates" ON form_templates FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admin can manage form templates" ON form_templates FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM staff WHERE staff.user_id = auth.uid() AND staff.role IN ('admin', 'clinical_director'))
);

CREATE POLICY "Staff can view patient consents" ON patient_consents FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM staff WHERE staff.user_id = auth.uid())
);
CREATE POLICY "Staff can manage patient consents" ON patient_consents FOR ALL TO authenticated USING (
    EXISTS (SELECT 1 FROM staff WHERE staff.user_id = auth.uid() AND staff.role IN ('admin', 'intake', 'counselor', 'doctor', 'rn'))
);

CREATE POLICY "Staff can view audit log" ON consent_audit_log FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM staff WHERE staff.user_id = auth.uid())
);
CREATE POLICY "System can insert audit log" ON consent_audit_log FOR INSERT TO authenticated WITH CHECK (true);
