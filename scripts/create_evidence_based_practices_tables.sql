-- ============================================================================
-- EVIDENCE-BASED PRACTICES (EBP) TABLES
-- ============================================================================
-- Creates tables for tracking Evidence-Based Practices implementation,
-- fidelity assessments, training records, and outcomes
-- ============================================================================

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- EVIDENCE-BASED PRACTICES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS evidence_based_practices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID,
    
    -- Basic Information
    name TEXT NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('Counseling', 'Behavioral', 'Medical', 'Organizational')),
    description TEXT,
    
    -- Calculated Metrics (computed from related tables via triggers/functions)
    adoption_rate DECIMAL(5,2) DEFAULT 0 CHECK (adoption_rate >= 0 AND adoption_rate <= 100),
    fidelity_score DECIMAL(5,2) DEFAULT 0 CHECK (fidelity_score >= 0 AND fidelity_score <= 100),
    sustainability_score DECIMAL(5,2) DEFAULT 0 CHECK (sustainability_score >= 0 AND sustainability_score <= 100),
    
    -- Staff Tracking (computed)
    total_staff INTEGER DEFAULT 0,
    trained_staff INTEGER DEFAULT 0,
    
    -- Last Review Date
    last_fidelity_review DATE,
    
    -- Outcomes Tracked (stored as JSONB array)
    outcomes_tracked JSONB DEFAULT '[]'::jsonb,
    
    -- Metadata
    created_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    updated_by UUID,
    is_active BOOLEAN DEFAULT true
);

-- ============================================================================
-- EBP FIDELITY ASSESSMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS ebp_fidelity_assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ebp_id UUID NOT NULL,
    organization_id UUID,
    
    -- Assessment Details
    assessment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    assessor_id UUID,  -- Staff member who conducted assessment
    assessment_type VARCHAR(50) DEFAULT 'standard' CHECK (assessment_type IN ('standard', 'spot_check', 'comprehensive', 'self_assessment')),
    
    -- Fidelity Score
    fidelity_score DECIMAL(5,2) NOT NULL CHECK (fidelity_score >= 0 AND fidelity_score <= 100),
    
    -- Assessment Details (JSONB for flexible structure)
    assessment_criteria JSONB,  -- Store specific criteria scores
    notes TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- EBP STAFF ASSIGNMENTS TABLE
-- ============================================================================
-- Links staff members to EBPs they are trained/certified in
CREATE TABLE IF NOT EXISTS ebp_staff_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ebp_id UUID NOT NULL,
    staff_id UUID NOT NULL,
    organization_id UUID,
    
    -- Training Status
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'trained', 'certified', 'inactive')),
    training_date DATE,
    certification_date DATE,
    certification_expires_date DATE,
    certificate_url TEXT,
    
    -- Training Module Reference (link to existing training_modules if applicable)
    training_module_id UUID,
    
    -- Metadata
    assigned_by UUID,  -- Who assigned this staff member
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one record per staff-ebp combination
    UNIQUE(ebp_id, staff_id)
);

-- ============================================================================
-- EBP PATIENT DELIVERY TABLE
-- ============================================================================
-- Tracks when EBPs are delivered to patients (for adoption rate calculation)
CREATE TABLE IF NOT EXISTS ebp_patient_delivery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ebp_id UUID NOT NULL,
    patient_id UUID NOT NULL,
    organization_id UUID,
    
    -- Delivery Details
    delivery_date DATE NOT NULL DEFAULT CURRENT_DATE,
    encounter_id UUID,  -- Link to encounter if applicable
    delivered_by UUID,  -- Staff member who delivered
    
    -- Delivery Type
    delivery_type VARCHAR(50) DEFAULT 'session' CHECK (delivery_type IN ('session', 'intervention', 'assessment', 'group', 'individual')),
    
    -- Notes
    notes TEXT,
    
    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- EBP OUTCOMES TRACKING TABLE
-- ============================================================================
-- Links patient outcomes to specific EBPs
CREATE TABLE IF NOT EXISTS ebp_outcomes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ebp_id UUID NOT NULL,
    patient_id UUID NOT NULL,
    organization_id UUID,
    
    -- Outcome Details
    outcome_type VARCHAR(100) NOT NULL,  -- e.g., "Treatment retention", "Depression scores"
    outcome_value DECIMAL(10,2),
    outcome_unit VARCHAR(50),  -- e.g., "percentage", "score", "days"
    measurement_date DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Context
    encounter_id UUID,
    assessment_id UUID,  -- Link to clinical assessment if applicable
    
    -- Notes
    notes TEXT,
    
    -- Metadata
    recorded_by UUID,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_ebp_organization ON evidence_based_practices(organization_id);
CREATE INDEX IF NOT EXISTS idx_ebp_category ON evidence_based_practices(category);
CREATE INDEX IF NOT EXISTS idx_ebp_active ON evidence_based_practices(is_active);
CREATE INDEX IF NOT EXISTS idx_ebp_created_at ON evidence_based_practices(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_fidelity_ebp ON ebp_fidelity_assessments(ebp_id);
CREATE INDEX IF NOT EXISTS idx_fidelity_date ON ebp_fidelity_assessments(assessment_date DESC);
CREATE INDEX IF NOT EXISTS idx_fidelity_organization ON ebp_fidelity_assessments(organization_id);

CREATE INDEX IF NOT EXISTS idx_staff_assign_ebp ON ebp_staff_assignments(ebp_id);
CREATE INDEX IF NOT EXISTS idx_staff_assign_staff ON ebp_staff_assignments(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_assign_status ON ebp_staff_assignments(status);
CREATE INDEX IF NOT EXISTS idx_staff_assign_organization ON ebp_staff_assignments(organization_id);

CREATE INDEX IF NOT EXISTS idx_delivery_ebp ON ebp_patient_delivery(ebp_id);
CREATE INDEX IF NOT EXISTS idx_delivery_patient ON ebp_patient_delivery(patient_id);
CREATE INDEX IF NOT EXISTS idx_delivery_date ON ebp_patient_delivery(delivery_date DESC);
CREATE INDEX IF NOT EXISTS idx_delivery_organization ON ebp_patient_delivery(organization_id);

CREATE INDEX IF NOT EXISTS idx_outcomes_ebp ON ebp_outcomes(ebp_id);
CREATE INDEX IF NOT EXISTS idx_outcomes_patient ON ebp_outcomes(patient_id);
CREATE INDEX IF NOT EXISTS idx_outcomes_type ON ebp_outcomes(outcome_type);
CREATE INDEX IF NOT EXISTS idx_outcomes_date ON ebp_outcomes(measurement_date DESC);
CREATE INDEX IF NOT EXISTS idx_outcomes_organization ON ebp_outcomes(organization_id);

-- ============================================================================
-- TRIGGERS FOR AUTO-UPDATING TIMESTAMPS
-- ============================================================================

-- Trigger to update updated_at for EBPs
CREATE OR REPLACE FUNCTION update_ebp_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_ebp_updated_at ON evidence_based_practices;
CREATE TRIGGER trigger_update_ebp_updated_at
    BEFORE UPDATE ON evidence_based_practices
    FOR EACH ROW
    EXECUTE FUNCTION update_ebp_updated_at();

-- Trigger to update updated_at for fidelity assessments
CREATE OR REPLACE FUNCTION update_fidelity_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_fidelity_updated_at ON ebp_fidelity_assessments;
CREATE TRIGGER trigger_update_fidelity_updated_at
    BEFORE UPDATE ON ebp_fidelity_assessments
    FOR EACH ROW
    EXECUTE FUNCTION update_fidelity_updated_at();

-- Trigger to update updated_at for staff assignments
CREATE OR REPLACE FUNCTION update_staff_assign_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_staff_assign_updated_at ON ebp_staff_assignments;
CREATE TRIGGER trigger_update_staff_assign_updated_at
    BEFORE UPDATE ON ebp_staff_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_staff_assign_updated_at();

-- ============================================================================
-- FUNCTIONS FOR CALCULATING METRICS
-- ============================================================================

-- Function to calculate and update EBP fidelity score (uses latest assessment)
-- NOTE: This matches the application logic in calculate-metrics.ts which uses limit 1
-- Using latest score ensures consistency between database trigger and application code
CREATE OR REPLACE FUNCTION update_ebp_fidelity_score()
RETURNS TRIGGER AS $$
DECLARE
    latest_fidelity DECIMAL(5,2);
    latest_review_date DATE;
    target_ebp_id UUID;
BEGIN
    -- Get the EBP ID (from NEW or OLD depending on operation)
    target_ebp_id := COALESCE(NEW.ebp_id, OLD.ebp_id);
    
    -- Get the latest assessment (most recent by date, then by created_at for tiebreaker)
    -- This matches the application logic and avoids GROUP BY issues
    SELECT 
        fidelity_score,
        assessment_date
    INTO latest_fidelity, latest_review_date
    FROM ebp_fidelity_assessments
    WHERE ebp_id = target_ebp_id
    ORDER BY assessment_date DESC, created_at DESC
    LIMIT 1;
    
    -- Update EBP with latest fidelity and review date
    UPDATE evidence_based_practices
    SET 
        fidelity_score = COALESCE(latest_fidelity, 0),
        last_fidelity_review = latest_review_date,
        updated_at = NOW()
    WHERE id = target_ebp_id;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update fidelity score when assessments are added/updated
DROP TRIGGER IF EXISTS trigger_update_fidelity_score ON ebp_fidelity_assessments;
CREATE TRIGGER trigger_update_fidelity_score
    AFTER INSERT OR UPDATE OR DELETE ON ebp_fidelity_assessments
    FOR EACH ROW
    EXECUTE FUNCTION update_ebp_fidelity_score();

-- Function to calculate and update trained staff count
CREATE OR REPLACE FUNCTION update_ebp_trained_staff_count()
RETURNS TRIGGER AS $$
DECLARE
    trained_count INTEGER;
    total_count INTEGER;
BEGIN
    -- Count trained staff (status = 'trained' or 'certified')
    SELECT COUNT(*)
    INTO trained_count
    FROM ebp_staff_assignments
    WHERE ebp_id = COALESCE(NEW.ebp_id, OLD.ebp_id)
    AND status IN ('trained', 'certified');
    
    -- Get total staff count for organization (if staff table exists)
    -- For now, we'll use a placeholder - this should be updated based on actual staff table
    total_count := trained_count;  -- Placeholder - should query actual staff table
    
    -- Update EBP with trained staff count
    UPDATE evidence_based_practices
    SET trained_staff = trained_count
    WHERE id = COALESCE(NEW.ebp_id, OLD.ebp_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to update trained staff count when assignments change
DROP TRIGGER IF EXISTS trigger_update_trained_staff_count ON ebp_staff_assignments;
CREATE TRIGGER trigger_update_trained_staff_count
    AFTER INSERT OR UPDATE OR DELETE ON ebp_staff_assignments
    FOR EACH ROW
    EXECUTE FUNCTION update_ebp_trained_staff_count();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================================

-- Enable RLS
ALTER TABLE evidence_based_practices ENABLE ROW LEVEL SECURITY;
ALTER TABLE ebp_fidelity_assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ebp_staff_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE ebp_patient_delivery ENABLE ROW LEVEL SECURITY;
ALTER TABLE ebp_outcomes ENABLE ROW LEVEL SECURITY;

-- Policies: Users can view EBPs from their organization
CREATE POLICY "Users can view EBPs from their organization"
  ON evidence_based_practices FOR SELECT
  USING (true); -- For now, allow all reads (adjust based on your auth system)

CREATE POLICY "Users can create EBPs in their organization"
  ON evidence_based_practices FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update EBPs in their organization"
  ON evidence_based_practices FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Users can delete EBPs in their organization"
  ON evidence_based_practices FOR DELETE
  USING (true);

-- Similar policies for other tables
CREATE POLICY "Users can view fidelity assessments from their organization"
  ON ebp_fidelity_assessments FOR SELECT
  USING (true);

CREATE POLICY "Users can create fidelity assessments in their organization"
  ON ebp_fidelity_assessments FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view staff assignments from their organization"
  ON ebp_staff_assignments FOR SELECT
  USING (true);

CREATE POLICY "Users can create staff assignments in their organization"
  ON ebp_staff_assignments FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view patient delivery from their organization"
  ON ebp_patient_delivery FOR SELECT
  USING (true);

CREATE POLICY "Users can create patient delivery in their organization"
  ON ebp_patient_delivery FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can view outcomes from their organization"
  ON ebp_outcomes FOR SELECT
  USING (true);

CREATE POLICY "Users can create outcomes in their organization"
  ON ebp_outcomes FOR INSERT
  WITH CHECK (true);

-- ============================================================================
-- ADD FOREIGN KEY CONSTRAINTS (After tables are created)
-- ============================================================================
DO $$
BEGIN
    -- Add organization_id foreign key if organizations table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'organizations') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'ebp_organization_id_fkey'
        ) THEN
            ALTER TABLE evidence_based_practices 
            ADD CONSTRAINT ebp_organization_id_fkey 
            FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE;
        END IF;
    END IF;

    -- Add created_by foreign key if user_accounts table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_accounts') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'ebp_created_by_fkey'
        ) THEN
            ALTER TABLE evidence_based_practices 
            ADD CONSTRAINT ebp_created_by_fkey 
            FOREIGN KEY (created_by) REFERENCES user_accounts(id);
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'ebp_updated_by_fkey'
        ) THEN
            ALTER TABLE evidence_based_practices 
            ADD CONSTRAINT ebp_updated_by_fkey 
            FOREIGN KEY (updated_by) REFERENCES user_accounts(id);
        END IF;
    END IF;

    -- Add ebp_id foreign key (evidence_based_practices must exist first)
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'evidence_based_practices') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'fidelity_ebp_id_fkey'
        ) THEN
            ALTER TABLE ebp_fidelity_assessments 
            ADD CONSTRAINT fidelity_ebp_id_fkey 
            FOREIGN KEY (ebp_id) REFERENCES evidence_based_practices(id) ON DELETE CASCADE;
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'staff_assign_ebp_id_fkey'
        ) THEN
            ALTER TABLE ebp_staff_assignments 
            ADD CONSTRAINT staff_assign_ebp_id_fkey 
            FOREIGN KEY (ebp_id) REFERENCES evidence_based_practices(id) ON DELETE CASCADE;
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'delivery_ebp_id_fkey'
        ) THEN
            ALTER TABLE ebp_patient_delivery 
            ADD CONSTRAINT delivery_ebp_id_fkey 
            FOREIGN KEY (ebp_id) REFERENCES evidence_based_practices(id) ON DELETE CASCADE;
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'outcomes_ebp_id_fkey'
        ) THEN
            ALTER TABLE ebp_outcomes 
            ADD CONSTRAINT outcomes_ebp_id_fkey 
            FOREIGN KEY (ebp_id) REFERENCES evidence_based_practices(id) ON DELETE CASCADE;
        END IF;
    END IF;

    -- Add patient_id foreign key if patients table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'patients') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'delivery_patient_id_fkey'
        ) THEN
            ALTER TABLE ebp_patient_delivery 
            ADD CONSTRAINT delivery_patient_id_fkey 
            FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;
        END IF;
        
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'outcomes_patient_id_fkey'
        ) THEN
            ALTER TABLE ebp_outcomes 
            ADD CONSTRAINT outcomes_patient_id_fkey 
            FOREIGN KEY (patient_id) REFERENCES patients(id) ON DELETE CASCADE;
        END IF;
    END IF;

    -- Add staff_id foreign key if staff or user_accounts table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'staff') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'staff_assign_staff_id_fkey'
        ) THEN
            ALTER TABLE ebp_staff_assignments 
            ADD CONSTRAINT staff_assign_staff_id_fkey 
            FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE;
        END IF;
    ELSIF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_accounts') THEN
        IF NOT EXISTS (
            SELECT 1 FROM information_schema.table_constraints 
            WHERE constraint_name = 'staff_assign_staff_id_fkey'
        ) THEN
            ALTER TABLE ebp_staff_assignments 
            ADD CONSTRAINT staff_assign_staff_id_fkey 
            FOREIGN KEY (staff_id) REFERENCES user_accounts(id) ON DELETE CASCADE;
        END IF;
    END IF;
END $$;

