CREATE TABLE IF NOT EXISTS recipient_rights_complaints (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID,
    
    -- Complainant Information
    complainant_type VARCHAR(50) NOT NULL, -- 'patient', 'family', 'guardian', 'staff', 'anonymous'
    complainant_patient_id UUID REFERENCES patients(id),
    complainant_name VARCHAR(255),
    complainant_phone VARCHAR(50),
    complainant_email VARCHAR(255),
    complainant_relationship VARCHAR(100),
    is_anonymous BOOLEAN DEFAULT false,
    
    -- Complaint Details
    complaint_number VARCHAR(50) UNIQUE NOT NULL,
    complaint_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    incident_date DATE,
    incident_time TIME,
    incident_location TEXT,
    
    -- Subject of Complaint
    complaint_category VARCHAR(100), -- 'rights_violation', 'treatment', 'abuse', 'neglect', 'discrimination', 'confidentiality', 'other'
    complaint_type VARCHAR(100), -- 'informed_consent', 'dignity_respect', 'communication', 'restraint_seclusion', 'medication', etc.
    complaint_description TEXT NOT NULL,
    rights_allegedly_violated TEXT[],
    witnesses TEXT[],
    
    -- Staff/Provider Involved
    staff_involved UUID[],
    provider_involved UUID,
    department_involved VARCHAR(100),
    
    -- Investigation
    investigation_status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'assigned', 'investigating', 'completed', 'closed'
    assigned_officer_id UUID, -- Recipient Rights Officer
    assigned_at TIMESTAMP WITH TIME ZONE,
    investigation_start_date DATE,
    investigation_due_date DATE,
    investigation_completed_date DATE,
    investigation_findings TEXT,
    investigation_notes TEXT,
    evidence_collected JSONB,
    interviews_conducted JSONB,
    
    -- Resolution
    rights_violation_confirmed BOOLEAN,
    violation_type VARCHAR(100),
    corrective_actions_taken TEXT,
    corrective_actions_plan TEXT,
    corrective_action_due_date DATE,
    policy_changes_needed BOOLEAN,
    policy_changes_description TEXT,
    training_required BOOLEAN,
    training_completed BOOLEAN,
    training_completion_date DATE,
    
    -- Reporting
    reported_to_external_agency BOOLEAN DEFAULT false,
    external_agency_name VARCHAR(255),
    external_report_date DATE,
    external_case_number VARCHAR(100),
    
    -- Complainant Communication
    complainant_notified BOOLEAN DEFAULT false,
    complainant_notification_date DATE,
    complainant_notification_method VARCHAR(50),
    complainant_satisfied BOOLEAN,
    complainant_appeal_requested BOOLEAN,
    appeal_date DATE,
    appeal_reason TEXT,
    appeal_outcome TEXT,
    appeal_completed_date DATE,
    
    -- Confidentiality & Access
    confidential BOOLEAN DEFAULT true,
    access_restricted_to JSONB, -- Array of user IDs who can view
    
    -- Metadata
    priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    severity VARCHAR(20), -- 'minor', 'moderate', 'major', 'critical'
    status VARCHAR(50) DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed', 'appealed'
    resolution_date DATE,
    closed_by UUID,
    closed_at TIMESTAMP WITH TIME ZONE,
    closure_notes TEXT,
    
    -- Audit Trail
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    updated_by UUID
);

-- Recipient Rights Officers Table
CREATE TABLE IF NOT EXISTS recipient_rights_officers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID,
    staff_id UUID REFERENCES staff(id),
    employee_id VARCHAR(50),
    officer_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    phone VARCHAR(50),
    certification_number VARCHAR(100),
    certification_date DATE,
    certification_expiration DATE,
    training_completed BOOLEAN DEFAULT false,
    training_completion_date DATE,
    is_primary_officer BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    assigned_departments VARCHAR(100)[],
    max_active_cases INTEGER DEFAULT 20,
    current_active_cases INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Complaint Activity Log
CREATE TABLE IF NOT EXISTS recipient_rights_activity_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    complaint_id UUID REFERENCES recipient_rights_complaints(id),
    action VARCHAR(100) NOT NULL,
    action_description TEXT,
    performed_by UUID,
    performed_by_name VARCHAR(255),
    performed_by_role VARCHAR(100),
    action_timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ip_address INET,
    user_agent TEXT,
    metadata JSONB
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_recipient_complaints_patient ON recipient_rights_complaints(complainant_patient_id);
CREATE INDEX IF NOT EXISTS idx_recipient_complaints_officer ON recipient_rights_complaints(assigned_officer_id);
CREATE INDEX IF NOT EXISTS idx_recipient_complaints_status ON recipient_rights_complaints(investigation_status, status);
CREATE INDEX IF NOT EXISTS idx_recipient_complaints_date ON recipient_rights_complaints(complaint_date);
CREATE INDEX IF NOT EXISTS idx_recipient_officers_staff ON recipient_rights_officers(staff_id);
CREATE INDEX IF NOT EXISTS idx_recipient_officers_active ON recipient_rights_officers(is_active, current_active_cases);

-- Additional updates can be added here if needed
