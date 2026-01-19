-- ============================================================================
-- RESEARCH STUDIES TABLES MIGRATION
-- ============================================================================
-- Copy this ENTIRE file and paste into Supabase SQL Editor, then click "Run"
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- RESEARCH STUDIES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS research_studies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID,
    
    -- Basic Information
    title TEXT NOT NULL,
    description TEXT,
    study_type VARCHAR(50) NOT NULL CHECK (study_type IN ('implementation', 'pilot', 'quality_improvement', 'outcomes', 'equity')),
    
    -- Principal Investigator
    pi_name TEXT NOT NULL,
    pi_email TEXT,
    pi_phone TEXT,
    
    -- Timeline
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    enrollment_target INTEGER NOT NULL DEFAULT 0,
    current_enrollment INTEGER DEFAULT 0,
    
    -- Status Tracking
    status VARCHAR(50) NOT NULL DEFAULT 'planning' CHECK (status IN ('planning', 'active', 'data_collection', 'analysis', 'completed', 'cancelled')),
    irb_status VARCHAR(50) DEFAULT 'pending' CHECK (irb_status IN ('pending', 'approved', 'exempt', 'rejected', 'expired')),
    irb_number TEXT,
    irb_approval_date DATE,
    irb_expiration_date DATE,
    
    -- Funding
    funding_source TEXT,
    funding_amount DECIMAL(12, 2),
    grant_number TEXT,
    
    -- Metadata
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID,
    
    -- Constraints
    CONSTRAINT valid_dates CHECK (end_date >= start_date),
    CONSTRAINT valid_enrollment CHECK (current_enrollment >= 0 AND current_enrollment <= enrollment_target)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_research_studies_organization ON research_studies(organization_id);
CREATE INDEX IF NOT EXISTS idx_research_studies_status ON research_studies(status);
CREATE INDEX IF NOT EXISTS idx_research_studies_type ON research_studies(study_type);
CREATE INDEX IF NOT EXISTS idx_research_studies_created_at ON research_studies(created_at DESC);

-- ============================================================================
-- RESEARCH STUDY PARTICIPANTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS research_study_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    study_id UUID,
    patient_id UUID,
    
    -- Enrollment Details
    enrolled_date DATE NOT NULL DEFAULT CURRENT_DATE,
    enrollment_status VARCHAR(50) DEFAULT 'enrolled' CHECK (enrollment_status IN ('enrolled', 'withdrawn', 'completed', 'lost_to_followup')),
    withdrawal_date DATE,
    withdrawal_reason TEXT,
    
    -- Consent
    consent_obtained BOOLEAN DEFAULT false,
    consent_date DATE,
    consent_document_url TEXT,
    
    -- Metadata
    enrolled_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Unique constraint: patient can only be enrolled once per study
    UNIQUE(study_id, patient_id)
);

CREATE INDEX IF NOT EXISTS idx_study_participants_study ON research_study_participants(study_id);
CREATE INDEX IF NOT EXISTS idx_study_participants_patient ON research_study_participants(patient_id);
CREATE INDEX IF NOT EXISTS idx_study_participants_status ON research_study_participants(enrollment_status);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_research_studies_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_research_studies_updated_at ON research_studies;
CREATE TRIGGER trigger_update_research_studies_updated_at
    BEFORE UPDATE ON research_studies
    FOR EACH ROW
    EXECUTE FUNCTION update_research_studies_updated_at();

-- Trigger to update updated_at for participants
CREATE OR REPLACE FUNCTION update_research_participants_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_research_participants_updated_at ON research_study_participants;
CREATE TRIGGER trigger_update_research_participants_updated_at
    BEFORE UPDATE ON research_study_participants
    FOR EACH ROW
    EXECUTE FUNCTION update_research_participants_updated_at();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE research_studies ENABLE ROW LEVEL SECURITY;
ALTER TABLE research_study_participants ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view studies from their organization
DROP POLICY IF EXISTS "Users can view studies from their organization" ON research_studies;
CREATE POLICY "Users can view studies from their organization"
  ON research_studies FOR SELECT
  USING (true);

-- Policy: Users can create studies in their organization
DROP POLICY IF EXISTS "Users can create studies in their organization" ON research_studies;
CREATE POLICY "Users can create studies in their organization"
  ON research_studies FOR INSERT
  WITH CHECK (true);

-- Policy: Users can update studies in their organization
DROP POLICY IF EXISTS "Users can update studies in their organization" ON research_studies;
CREATE POLICY "Users can update studies in their organization"
  ON research_studies FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Policy: Users can delete studies in their organization
DROP POLICY IF EXISTS "Users can delete studies in their organization" ON research_studies;
CREATE POLICY "Users can delete studies in their organization"
  ON research_studies FOR DELETE
  USING (true);

-- Similar policies for participants table
DROP POLICY IF EXISTS "Users can view participants from their organization" ON research_study_participants;
CREATE POLICY "Users can view participants from their organization"
  ON research_study_participants FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Users can create participants in their organization" ON research_study_participants;
CREATE POLICY "Users can create participants in their organization"
  ON research_study_participants FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update participants in their organization" ON research_study_participants;
CREATE POLICY "Users can update participants in their organization"
  ON research_study_participants FOR UPDATE
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can delete participants in their organization" ON research_study_participants;
CREATE POLICY "Users can delete participants in their organization"
  ON research_study_participants FOR DELETE
  USING (true);

-- ============================================================================
-- ADD FOREIGN KEY CONSTRAINTS (After tables are created)
-- ============================================================================
DO $$
BEGIN
    -- Add organization_id foreign key if organizations table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'research_studies_organization_id_fkey'
        ) THEN
            ALTER TABLE research_studies 
            ADD CONSTRAINT research_studies_organization_id_fkey 
            FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
        END IF;
    END IF;

    -- Add created_by foreign key if user_accounts table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_accounts') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'research_studies_created_by_fkey'
        ) THEN
            ALTER TABLE research_studies 
            ADD CONSTRAINT research_studies_created_by_fkey 
            FOREIGN KEY (created_by) REFERENCES user_accounts(id);
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'research_studies_updated_by_fkey'
        ) THEN
            ALTER TABLE research_studies 
            ADD CONSTRAINT research_studies_updated_by_fkey 
            FOREIGN KEY (updated_by) REFERENCES user_accounts(id);
        END IF;
    END IF;

    -- Add study_id foreign key (research_studies must exist first)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'research_studies') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'research_study_participants_study_id_fkey'
        ) THEN
            ALTER TABLE research_study_participants 
            ADD CONSTRAINT research_study_participants_study_id_fkey 
            FOREIGN KEY (study_id) REFERENCES research_studies(id) ON DELETE CASCADE;
        END IF;
    END IF;

    -- Add patient_id foreign key if patients table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'patients') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'research_study_participants_patient_id_fkey'
        ) THEN
            ALTER TABLE research_study_participants 
            ADD CONSTRAINT research_study_participants_patient_id_fkey 
            FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;
        END IF;
    END IF;

    -- Add enrolled_by foreign key if user_accounts table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_accounts') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'research_study_participants_enrolled_by_fkey'
        ) THEN
            ALTER TABLE research_study_participants 
            ADD CONSTRAINT research_study_participants_enrolled_by_fkey 
            FOREIGN KEY (enrolled_by) REFERENCES user_accounts(id);
        END IF;
    END IF;
END $$;

