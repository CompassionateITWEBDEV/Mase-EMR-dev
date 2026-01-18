-- Community Outreach Module Schema
-- Supports anonymous screenings, referrals, and outreach tracking

-- =====================================================
-- SCREENING RESPONSES TABLE
-- Stores anonymous pre-intake screening results
-- =====================================================
CREATE TABLE IF NOT EXISTS community_screenings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Screening identification
    screening_type VARCHAR(50) NOT NULL, -- 'general', 'substance-use', 'anxiety', 'depression', 'ptsd', 'bipolar'
    session_id VARCHAR(100), -- Anonymous session identifier (no PII)
    
    -- Screening results (stored as JSONB for flexibility)
    responses JSONB NOT NULL, -- Array of question/answer pairs
    total_score INTEGER,
    severity_level VARCHAR(20), -- 'minimal', 'mild', 'moderate', 'severe'
    
    -- Recommendations generated
    recommendations JSONB, -- Array of recommended actions
    resources_provided JSONB, -- Array of resources shown
    
    -- Follow-up tracking (only if user opts in)
    follow_up_requested BOOLEAN DEFAULT FALSE,
    follow_up_email VARCHAR(255), -- Only stored if user provides
    follow_up_phone VARCHAR(20),
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    ip_region VARCHAR(100), -- General region only, no exact IP
    user_agent_summary VARCHAR(255), -- Browser/device type
    referral_source VARCHAR(100) -- How they found us
);

-- Index for analytics
CREATE INDEX IF NOT EXISTS idx_screenings_type ON community_screenings(screening_type);
CREATE INDEX IF NOT EXISTS idx_screenings_created ON community_screenings(created_at);
CREATE INDEX IF NOT EXISTS idx_screenings_severity ON community_screenings(severity_level);

-- =====================================================
-- COMMUNITY REFERRALS TABLE
-- Tracks incoming referrals from various sources
-- =====================================================
CREATE TABLE IF NOT EXISTS community_referrals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referral_number VARCHAR(20) UNIQUE NOT NULL, -- Human-readable ID like 'REF-2025-0001'
    
    -- Referral source information
    referral_type VARCHAR(20) NOT NULL, -- 'self', 'family', 'professional'
    referrer_name VARCHAR(100),
    referrer_relationship VARCHAR(50), -- For family: 'parent', 'spouse', etc.
    referrer_organization VARCHAR(150),
    referrer_title VARCHAR(100),
    referrer_email VARCHAR(255),
    referrer_phone VARCHAR(20),
    
    -- Client information (prospective patient)
    client_first_name VARCHAR(100) NOT NULL,
    client_last_name VARCHAR(100) NOT NULL,
    client_date_of_birth DATE,
    client_email VARCHAR(255),
    client_phone VARCHAR(20) NOT NULL,
    client_preferred_contact VARCHAR(20) DEFAULT 'phone', -- 'phone', 'email', 'text'
    client_preferred_time VARCHAR(50), -- 'morning', 'afternoon', 'evening'
    client_address_city VARCHAR(100),
    client_address_state VARCHAR(50),
    client_address_zip VARCHAR(10),
    
    -- Clinical information
    primary_concerns TEXT[], -- Array of concern categories
    additional_concerns TEXT,
    urgency_level VARCHAR(20) DEFAULT 'routine', -- 'routine', 'soon', 'urgent'
    current_crisis BOOLEAN DEFAULT FALSE,
    previous_treatment BOOLEAN,
    previous_treatment_details TEXT,
    current_medications TEXT,
    
    -- Insurance information
    insurance_type VARCHAR(50), -- 'private', 'medicaid', 'medicare', 'uninsured', 'unknown'
    insurance_provider VARCHAR(100),
    insurance_member_id VARCHAR(50),
    
    -- Consent and compliance
    hipaa_acknowledged BOOLEAN DEFAULT FALSE,
    consent_to_contact BOOLEAN DEFAULT FALSE,
    consent_to_share_with_referrer BOOLEAN DEFAULT FALSE,
    
    -- Status tracking
    status VARCHAR(30) DEFAULT 'new', -- 'new', 'contacted', 'scheduled', 'no-response', 'completed', 'declined', 'transferred'
    assigned_staff_id UUID REFERENCES staff(id),
    
    -- Timestamps
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    last_contact_at TIMESTAMPTZ,
    scheduled_date TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    -- Conversion tracking
    converted_to_patient BOOLEAN DEFAULT FALSE,
    patient_id UUID REFERENCES patients(id),
    
    -- Source tracking
    source_url VARCHAR(255),
    utm_source VARCHAR(100),
    utm_campaign VARCHAR(100)
);

-- Indexes for referral management
CREATE INDEX IF NOT EXISTS idx_referrals_status ON community_referrals(status);
CREATE INDEX IF NOT EXISTS idx_referrals_submitted ON community_referrals(submitted_at);
CREATE INDEX IF NOT EXISTS idx_referrals_urgency ON community_referrals(urgency_level);
CREATE INDEX IF NOT EXISTS idx_referrals_assigned ON community_referrals(assigned_staff_id);
CREATE INDEX IF NOT EXISTS idx_referrals_client_name ON community_referrals(client_last_name, client_first_name);

-- =====================================================
-- REFERRAL NOTES TABLE
-- Activity log and notes for each referral
-- =====================================================
CREATE TABLE IF NOT EXISTS community_referral_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referral_id UUID NOT NULL REFERENCES community_referrals(id) ON DELETE CASCADE,
    
    -- Note content
    note_type VARCHAR(30) NOT NULL, -- 'call', 'email', 'text', 'voicemail', 'status_change', 'general'
    content TEXT NOT NULL,
    
    -- Contact attempt tracking
    contact_successful BOOLEAN,
    follow_up_required BOOLEAN DEFAULT FALSE,
    follow_up_date DATE,
    
    -- Author information
    created_by UUID REFERENCES staff(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referral_notes_referral ON community_referral_notes(referral_id);
CREATE INDEX IF NOT EXISTS idx_referral_notes_created ON community_referral_notes(created_at);

-- =====================================================
-- OUTREACH CAMPAIGNS TABLE
-- For tracking community outreach efforts
-- =====================================================
CREATE TABLE IF NOT EXISTS outreach_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Campaign details
    name VARCHAR(150) NOT NULL,
    description TEXT,
    campaign_type VARCHAR(50), -- 'community_event', 'school_program', 'employer_partnership', 'digital_marketing'
    
    -- Dates
    start_date DATE NOT NULL,
    end_date DATE,
    
    -- Targeting
    target_audience TEXT,
    target_region VARCHAR(100),
    
    -- Results tracking
    estimated_reach INTEGER,
    actual_reach INTEGER,
    referrals_generated INTEGER DEFAULT 0,
    conversions INTEGER DEFAULT 0,
    
    -- Budget
    budget_allocated DECIMAL(10, 2),
    budget_spent DECIMAL(10, 2),
    
    -- Status
    status VARCHAR(20) DEFAULT 'planned', -- 'planned', 'active', 'completed', 'cancelled'
    
    -- Metadata
    created_by UUID REFERENCES staff(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- COMMUNITY PARTNERS TABLE
-- Organizations we work with for referrals
-- =====================================================
CREATE TABLE IF NOT EXISTS community_partners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Organization info
    name VARCHAR(150) NOT NULL,
    organization_type VARCHAR(50), -- 'hospital', 'school', 'employer', 'social_services', 'law_enforcement', 'other'
    
    -- Contact information
    primary_contact_name VARCHAR(100),
    primary_contact_title VARCHAR(100),
    primary_contact_email VARCHAR(255),
    primary_contact_phone VARCHAR(20),
    
    -- Address
    address_street VARCHAR(255),
    address_city VARCHAR(100),
    address_state VARCHAR(50),
    address_zip VARCHAR(10),
    
    -- Partnership details
    partnership_start_date DATE,
    mou_signed BOOLEAN DEFAULT FALSE,
    mou_expiration_date DATE,
    
    -- Referral tracking
    total_referrals INTEGER DEFAULT 0,
    successful_conversions INTEGER DEFAULT 0,
    
    -- Status
    status VARCHAR(20) DEFAULT 'active', -- 'active', 'inactive', 'pending'
    notes TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partners_type ON community_partners(organization_type);
CREATE INDEX IF NOT EXISTS idx_partners_status ON community_partners(status);

-- =====================================================
-- HELPER FUNCTION: Generate Referral Number
-- =====================================================
CREATE OR REPLACE FUNCTION generate_referral_number()
RETURNS TRIGGER AS $$
DECLARE
    year_str VARCHAR(4);
    next_num INTEGER;
BEGIN
    year_str := EXTRACT(YEAR FROM NOW())::VARCHAR;
    
    SELECT COALESCE(MAX(
        CAST(SUBSTRING(referral_number FROM 10 FOR 4) AS INTEGER)
    ), 0) + 1
    INTO next_num
    FROM community_referrals
    WHERE referral_number LIKE 'REF-' || year_str || '-%';
    
    NEW.referral_number := 'REF-' || year_str || '-' || LPAD(next_num::VARCHAR, 4, '0');
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for auto-generating referral numbers
DROP TRIGGER IF EXISTS trigger_generate_referral_number ON community_referrals;
CREATE TRIGGER trigger_generate_referral_number
    BEFORE INSERT ON community_referrals
    FOR EACH ROW
    WHEN (NEW.referral_number IS NULL)
    EXECUTE FUNCTION generate_referral_number();

-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE community_screenings ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_referral_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE outreach_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_partners ENABLE ROW LEVEL SECURITY;

-- Screenings: Allow anonymous insert, restrict read to authenticated staff
CREATE POLICY "Allow anonymous screening submissions"
    ON community_screenings FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Staff can view screenings"
    ON community_screenings FOR SELECT
    USING (auth.role() = 'authenticated');

-- Referrals: Allow anonymous insert, staff can manage
CREATE POLICY "Allow public referral submissions"
    ON community_referrals FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Staff can view all referrals"
    ON community_referrals FOR SELECT
    USING (auth.role() = 'authenticated');

CREATE POLICY "Staff can update referrals"
    ON community_referrals FOR UPDATE
    USING (auth.role() = 'authenticated');

-- Referral Notes: Staff only
CREATE POLICY "Staff can manage referral notes"
    ON community_referral_notes FOR ALL
    USING (auth.role() = 'authenticated');

-- Campaigns: Staff only
CREATE POLICY "Staff can manage campaigns"
    ON outreach_campaigns FOR ALL
    USING (auth.role() = 'authenticated');

-- Partners: Staff only
CREATE POLICY "Staff can manage partners"
    ON community_partners FOR ALL
    USING (auth.role() = 'authenticated');

-- =====================================================
-- SEED SAMPLE DATA (for development/testing)
-- =====================================================
INSERT INTO community_referrals (
    referral_type, referrer_name, referrer_organization,
    client_first_name, client_last_name, client_phone, client_email,
    primary_concerns, urgency_level, insurance_type,
    status, hipaa_acknowledged, consent_to_contact
) VALUES 
    ('self', NULL, NULL, 'Sarah', 'Johnson', '(555) 123-4567', 'sarah.j@email.com',
     ARRAY['Anxiety', 'Depression'], 'urgent', 'private',
     'new', true, true),
    ('professional', 'Dr. Lisa Wong', 'Community Health Center', 'Michael', 'Chen', '(555) 987-6543', 'm.chen@email.com',
     ARRAY['Substance Use', 'Trauma / PTSD'], 'soon', 'medicaid',
     'contacted', true, true),
    ('family', 'Robert Rodriguez', NULL, 'Emily', 'Rodriguez', '(555) 456-7890', 'emily.r@email.com',
     ARRAY['Grief / Loss', 'Sleep Problems'], 'routine', 'medicare',
     'scheduled', true, true)
ON CONFLICT DO NOTHING;

-- Add some sample screening data
INSERT INTO community_screenings (
    screening_type, responses, total_score, severity_level, recommendations
) VALUES 
    ('anxiety', '{"questions": [{"q": "Feeling nervous", "a": 2}, {"q": "Unable to stop worrying", "a": 3}]}', 
     14, 'moderate', '["Consider professional consultation", "Practice relaxation techniques"]'),
    ('depression', '{"questions": [{"q": "Little interest", "a": 1}, {"q": "Feeling down", "a": 2}]}',
     8, 'mild', '["Self-care activities", "Monitor symptoms"]')
ON CONFLICT DO NOTHING;

-- Sample community partner
INSERT INTO community_partners (
    name, organization_type, primary_contact_name, primary_contact_email,
    partnership_start_date, mou_signed, status
) VALUES 
    ('Community Health Center', 'hospital', 'Dr. Lisa Wong', 'lwong@chc.org', '2024-01-15', true, 'active'),
    ('Local School District', 'school', 'Amy Park', 'apark@schooldistrict.edu', '2024-03-01', true, 'active')
ON CONFLICT DO NOTHING;
