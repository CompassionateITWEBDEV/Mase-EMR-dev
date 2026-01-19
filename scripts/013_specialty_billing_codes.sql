-- ============================================================================
-- SPECIALTY BILLING CODES TABLE
-- Phase 5.1 of Primary Care Refactoring Roadmap
-- ============================================================================
-- This migration creates the specialty_billing_codes table for storing
-- CPT/HCPCS billing codes specific to each medical specialty.
-- ============================================================================

-- Create the specialty_billing_codes table
CREATE TABLE IF NOT EXISTS specialty_billing_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Specialty association
    specialty_id VARCHAR(100) NOT NULL,
    
    -- Code information
    code VARCHAR(20) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(100),
    
    -- Billing details
    base_rate NUMERIC(10, 2),
    
    -- Code type (CPT, HCPCS, etc.)
    code_type VARCHAR(20) DEFAULT 'CPT' CHECK (code_type IN ('CPT', 'HCPCS', 'ICD-10', 'CUSTOM')),
    
    -- Modifier support
    common_modifiers TEXT[],
    
    -- Status and metadata
    is_active BOOLEAN DEFAULT true,
    effective_date DATE,
    termination_date DATE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Unique constraint to prevent duplicate codes per specialty
    UNIQUE(specialty_id, code)
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- Index on specialty_id for filtering by specialty
CREATE INDEX IF NOT EXISTS idx_specialty_billing_codes_specialty 
    ON specialty_billing_codes(specialty_id);

-- Index on code for quick code lookups
CREATE INDEX IF NOT EXISTS idx_specialty_billing_codes_code 
    ON specialty_billing_codes(code);

-- Composite index for specialty + category filtering
CREATE INDEX IF NOT EXISTS idx_specialty_billing_codes_specialty_category 
    ON specialty_billing_codes(specialty_id, category);

-- Index on active codes for common queries
CREATE INDEX IF NOT EXISTS idx_specialty_billing_codes_active 
    ON specialty_billing_codes(is_active) WHERE is_active = true;

-- Index on code_type for filtering
CREATE INDEX IF NOT EXISTS idx_specialty_billing_codes_type 
    ON specialty_billing_codes(code_type);

-- ============================================================================
-- ROW LEVEL SECURITY
-- ============================================================================

-- Enable RLS on the table
ALTER TABLE specialty_billing_codes ENABLE ROW LEVEL SECURITY;

-- Policy: Allow read access for all authenticated users
CREATE POLICY "Allow authenticated read access to specialty_billing_codes" 
    ON specialty_billing_codes 
    FOR SELECT 
    TO authenticated 
    USING (true);

-- Policy: Allow full access for service role (API operations)
CREATE POLICY "Allow service role full access to specialty_billing_codes" 
    ON specialty_billing_codes 
    FOR ALL 
    TO service_role 
    USING (true) 
    WITH CHECK (true);

-- Policy: Allow insert/update for admin users (based on auth.jwt() claims)
-- Note: In production, tighten this based on your role system
CREATE POLICY "Allow admin write access to specialty_billing_codes" 
    ON specialty_billing_codes 
    FOR ALL 
    USING (
        auth.jwt() ->> 'role' IN ('admin', 'super_admin', 'billing_admin')
    )
    WITH CHECK (
        auth.jwt() ->> 'role' IN ('admin', 'super_admin', 'billing_admin')
    );

-- ============================================================================
-- TRIGGER FOR UPDATED_AT
-- ============================================================================

-- Create or replace function for updating timestamps
CREATE OR REPLACE FUNCTION update_specialty_billing_codes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
DROP TRIGGER IF EXISTS trigger_specialty_billing_codes_updated_at ON specialty_billing_codes;
CREATE TRIGGER trigger_specialty_billing_codes_updated_at
    BEFORE UPDATE ON specialty_billing_codes
    FOR EACH ROW
    EXECUTE FUNCTION update_specialty_billing_codes_updated_at();

-- ============================================================================
-- TABLE COMMENTS
-- ============================================================================

COMMENT ON TABLE specialty_billing_codes IS 'Stores CPT/HCPCS billing codes specific to each medical specialty';
COMMENT ON COLUMN specialty_billing_codes.specialty_id IS 'Specialty identifier (e.g., primary-care, behavioral-health)';
COMMENT ON COLUMN specialty_billing_codes.code IS 'CPT, HCPCS, or custom billing code';
COMMENT ON COLUMN specialty_billing_codes.description IS 'Human-readable description of the billing code';
COMMENT ON COLUMN specialty_billing_codes.category IS 'Category grouping (e.g., office_visit, preventive, procedure)';
COMMENT ON COLUMN specialty_billing_codes.base_rate IS 'Base fee for this code (clinic-specific, can be overridden)';
COMMENT ON COLUMN specialty_billing_codes.code_type IS 'Type of code: CPT, HCPCS, ICD-10, or CUSTOM';
COMMENT ON COLUMN specialty_billing_codes.common_modifiers IS 'Array of commonly used modifiers for this code';

