-- Team Communication and Notification System Schema

-- Care teams for patient cases
CREATE TABLE IF NOT EXISTS care_teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    team_name VARCHAR(255) NOT NULL,
    primary_provider_id UUID NOT NULL REFERENCES providers(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Care team members
CREATE TABLE IF NOT EXISTS care_team_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    care_team_id UUID NOT NULL REFERENCES care_teams(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES providers(id),
    role VARCHAR(100) NOT NULL, -- 'primary', 'secondary', 'consultant', 'supervisor'
    permissions JSONB DEFAULT '{"read": true, "write": false, "admin": false}',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    UNIQUE(care_team_id, provider_id)
);

-- Patient case communications
CREATE TABLE IF NOT EXISTS case_communications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    care_team_id UUID REFERENCES care_teams(id),
    sender_id UUID NOT NULL REFERENCES providers(id),
    message_type VARCHAR(50) NOT NULL DEFAULT 'general', -- 'general', 'urgent', 'clinical_note', 'medication_update', 'risk_alert'
    subject VARCHAR(255),
    message TEXT NOT NULL,
    priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    attachments JSONB DEFAULT '[]',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_read BOOLEAN DEFAULT false,
    parent_message_id UUID REFERENCES case_communications(id) -- for threading
);

-- Communication recipients (for targeted messaging)
CREATE TABLE IF NOT EXISTS communication_recipients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    communication_id UUID NOT NULL REFERENCES case_communications(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES providers(id),
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(communication_id, recipient_id)
);

-- Team notifications
CREATE TABLE IF NOT EXISTS team_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
    care_team_id UUID REFERENCES care_teams(id),
    recipient_id UUID NOT NULL REFERENCES providers(id),
    sender_id UUID REFERENCES providers(id),
    notification_type VARCHAR(100) NOT NULL, -- 'case_assignment', 'urgent_message', 'risk_alert', 'medication_change', 'appointment_reminder'
    title VARCHAR(255) NOT NULL,
    message TEXT,
    action_url VARCHAR(500),
    priority VARCHAR(20) DEFAULT 'normal',
    metadata JSONB DEFAULT '{}',
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- Communication templates for common scenarios
CREATE TABLE IF NOT EXISTS communication_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL, -- 'clinical', 'administrative', 'emergency', 'routine'
    subject_template VARCHAR(255),
    message_template TEXT NOT NULL,
    default_priority VARCHAR(20) DEFAULT 'normal',
    required_roles TEXT[], -- roles that should receive this type of communication
    created_by UUID REFERENCES providers(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true
);

-- Patient communication preferences
CREATE TABLE IF NOT EXISTS patient_communication_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    preferred_contact_method VARCHAR(50) DEFAULT 'phone', -- 'phone', 'email', 'sms', 'portal'
    allow_sms BOOLEAN DEFAULT false,
    allow_email BOOLEAN DEFAULT true,
    emergency_contact_only BOOLEAN DEFAULT false,
    communication_window_start TIME DEFAULT '09:00:00',
    communication_window_end TIME DEFAULT '17:00:00',
    timezone VARCHAR(50) DEFAULT 'America/New_York',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(patient_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_care_teams_patient_id ON care_teams(patient_id);
CREATE INDEX IF NOT EXISTS idx_care_teams_primary_provider ON care_teams(primary_provider_id);
CREATE INDEX IF NOT EXISTS idx_care_team_members_team_id ON care_team_members(care_team_id);
CREATE INDEX IF NOT EXISTS idx_care_team_members_provider_id ON care_team_members(provider_id);
CREATE INDEX IF NOT EXISTS idx_case_communications_patient_id ON case_communications(patient_id);
CREATE INDEX IF NOT EXISTS idx_case_communications_sender_id ON case_communications(sender_id);
CREATE INDEX IF NOT EXISTS idx_case_communications_created_at ON case_communications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_communication_recipients_recipient_id ON communication_recipients(recipient_id);
CREATE INDEX IF NOT EXISTS idx_team_notifications_recipient_id ON team_notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_team_notifications_created_at ON team_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_team_notifications_is_read ON team_notifications(is_read);

-- Insert default communication templates
INSERT INTO communication_templates (name, category, subject_template, message_template, default_priority, required_roles) VALUES
('Risk Assessment Alert', 'clinical', 'URGENT: Risk Assessment Required - {patient_name}', 'Patient {patient_name} requires immediate risk assessment. Please review and respond within 2 hours.', 'urgent', ARRAY['doctor', 'counselor', 'rn']),
('Medication Change Notification', 'clinical', 'Medication Update - {patient_name}', 'Medication changes have been made for {patient_name}. Please review the updated treatment plan.', 'high', ARRAY['doctor', 'rn', 'counselor']),
('Care Team Assignment', 'administrative', 'Care Team Assignment - {patient_name}', 'You have been assigned to the care team for {patient_name}. Please review the patient chart and coordinate with the primary provider.', 'normal', ARRAY['all']),
('Appointment No-Show', 'administrative', 'Patient No-Show - {patient_name}', 'Patient {patient_name} did not attend their scheduled appointment. Please follow up according to protocol.', 'normal', ARRAY['counselor', 'intake']),
('Emergency Contact Required', 'emergency', 'EMERGENCY: Immediate Contact Required - {patient_name}', 'Emergency situation with {patient_name}. Immediate contact and intervention required.', 'urgent', ARRAY['doctor', 'rn', 'admin'])
ON CONFLICT DO NOTHING;
