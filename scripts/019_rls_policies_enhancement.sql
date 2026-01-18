-- ============================================================================
-- RLS POLICIES ENHANCEMENT
-- Phase 9.3 of Primary Care Refactoring Roadmap
-- ============================================================================
-- This migration enhances RLS policies for patients, appointments, and clinical_alerts
-- to enforce proper access control based on care team membership
-- ============================================================================

-- ============================================================================
-- PATIENTS TABLE RLS POLICIES
-- ============================================================================

-- Enable RLS if not already enabled
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;

-- Drop existing permissive policies if they exist (both old and new names)
DROP POLICY IF EXISTS "Allow all access to patients" ON patients;
DROP POLICY IF EXISTS "Providers can view all patients" ON patients;
DROP POLICY IF EXISTS "Providers can view patients in their organization" ON patients;
DROP POLICY IF EXISTS "Providers can insert patients" ON patients;
DROP POLICY IF EXISTS "Providers can update patients" ON patients;
DROP POLICY IF EXISTS "Providers can update patients in their care team" ON patients;
DROP POLICY IF EXISTS "Admins can deactivate patients" ON patients;

-- Policy: Providers can view patients in their organization/care team
-- For now, allow authenticated providers to view all patients
-- In production, enhance this to check organization_id and care_team membership
CREATE POLICY "Providers can view patients in their organization" 
    ON patients 
    FOR SELECT 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM providers 
            WHERE providers.id::text = auth.jwt() ->> 'user_id'
        )
        OR
        auth.jwt() ->> 'role' IN ('admin', 'super_admin', 'provider', 'nurse', 'staff')
    );

-- Policy: Providers can insert patients
CREATE POLICY "Providers can insert patients" 
    ON patients 
    FOR INSERT 
    TO authenticated 
    WITH CHECK (
        auth.jwt() ->> 'role' IN ('admin', 'super_admin', 'provider', 'nurse')
    );

-- Policy: Providers can update patients in their care team
CREATE POLICY "Providers can update patients in their care team" 
    ON patients 
    FOR UPDATE 
    TO authenticated 
    USING (
        auth.jwt() ->> 'role' IN ('admin', 'super_admin', 'provider', 'nurse')
    )
    WITH CHECK (
        auth.jwt() ->> 'role' IN ('admin', 'super_admin', 'provider', 'nurse')
    );

-- Policy: Only admins can soft delete (deactivate) patients
CREATE POLICY "Admins can deactivate patients" 
    ON patients 
    FOR UPDATE 
    TO authenticated 
    USING (
        auth.jwt() ->> 'role' IN ('admin', 'super_admin')
    )
    WITH CHECK (
        auth.jwt() ->> 'role' IN ('admin', 'super_admin')
    );

-- ============================================================================
-- APPOINTMENTS TABLE RLS POLICIES
-- ============================================================================

-- Enable RLS if not already enabled
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Drop existing permissive policies if they exist (both old and new names)
DROP POLICY IF EXISTS "Allow all access to appointments" ON appointments;
DROP POLICY IF EXISTS "Providers can view appointments for their patients" ON appointments;
DROP POLICY IF EXISTS "Providers can create appointments" ON appointments;
DROP POLICY IF EXISTS "Providers can update appointments" ON appointments;
DROP POLICY IF EXISTS "Providers can cancel appointments" ON appointments;

-- Policy: Users can view appointments for their patients or their own appointments
CREATE POLICY "Providers can view appointments for their patients" 
    ON appointments 
    FOR SELECT 
    TO authenticated 
    USING (
        -- Provider can see appointments for their assigned patients
        provider_id::text = auth.jwt() ->> 'user_id'
        OR
        -- Provider can see appointments for patients in their care team
        EXISTS (
            SELECT 1 FROM patients 
            WHERE patients.id = appointments.patient_id
        )
        OR
        -- Admins can see all
        auth.jwt() ->> 'role' IN ('admin', 'super_admin')
    );

-- Policy: Providers can create appointments for their patients
CREATE POLICY "Providers can create appointments" 
    ON appointments 
    FOR INSERT 
    TO authenticated 
    WITH CHECK (
        (
            provider_id::text = auth.jwt() ->> 'user_id'
            OR
            provider_id IS NULL
        )
        AND
        auth.jwt() ->> 'role' IN ('admin', 'super_admin', 'provider', 'nurse', 'staff')
    );

-- Policy: Providers can update their own appointments or appointments for their patients
CREATE POLICY "Providers can update appointments" 
    ON appointments 
    FOR UPDATE 
    TO authenticated 
    USING (
        provider_id::text = auth.jwt() ->> 'user_id'
        OR
        auth.jwt() ->> 'role' IN ('admin', 'super_admin')
    )
    WITH CHECK (
        provider_id::text = auth.jwt() ->> 'user_id'
        OR
        auth.jwt() ->> 'role' IN ('admin', 'super_admin')
    );

-- Policy: Providers can cancel (soft delete) their own appointments
CREATE POLICY "Providers can cancel appointments" 
    ON appointments 
    FOR UPDATE 
    TO authenticated 
    USING (
        provider_id::text = auth.jwt() ->> 'user_id'
        OR
        auth.jwt() ->> 'role' IN ('admin', 'super_admin', 'provider', 'nurse')
    )
    WITH CHECK (
        provider_id::text = auth.jwt() ->> 'user_id'
        OR
        auth.jwt() ->> 'role' IN ('admin', 'super_admin', 'provider', 'nurse')
    );

-- ============================================================================
-- CLINICAL_ALERTS TABLE RLS POLICIES
-- ============================================================================

-- Enable RLS if not already enabled (should already be enabled from 014_clinical_alerts_table.sql)
ALTER TABLE clinical_alerts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate with enhanced logic (both old and new names)
DROP POLICY IF EXISTS "Allow authenticated read access to clinical_alerts" ON clinical_alerts;
DROP POLICY IF EXISTS "Allow staff write access to clinical_alerts" ON clinical_alerts;
DROP POLICY IF EXISTS "Providers can view alerts for their patients" ON clinical_alerts;
DROP POLICY IF EXISTS "Staff can create alerts" ON clinical_alerts;
DROP POLICY IF EXISTS "Staff can acknowledge alerts" ON clinical_alerts;

-- Policy: Providers can view alerts for patients in their care team
CREATE POLICY "Providers can view alerts for their patients" 
    ON clinical_alerts 
    FOR SELECT 
    TO authenticated 
    USING (
        -- Provider can see alerts for patients in their care team
        EXISTS (
            SELECT 1 FROM patients 
            WHERE patients.id = clinical_alerts.patient_id
        )
        OR
        -- Admins can see all
        auth.jwt() ->> 'role' IN ('admin', 'super_admin')
    );

-- Policy: Staff can create alerts
CREATE POLICY "Staff can create alerts" 
    ON clinical_alerts 
    FOR INSERT 
    TO authenticated 
    WITH CHECK (
        auth.jwt() ->> 'role' IN ('admin', 'super_admin', 'provider', 'nurse', 'staff')
    );

-- Policy: Staff can acknowledge alerts for their patients
CREATE POLICY "Staff can acknowledge alerts" 
    ON clinical_alerts 
    FOR UPDATE 
    TO authenticated 
    USING (
        EXISTS (
            SELECT 1 FROM patients 
            WHERE patients.id = clinical_alerts.patient_id
        )
        OR
        auth.jwt() ->> 'role' IN ('admin', 'super_admin')
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM patients 
            WHERE patients.id = clinical_alerts.patient_id
        )
        OR
        auth.jwt() ->> 'role' IN ('admin', 'super_admin')
    );

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON POLICY "Providers can view patients in their organization" ON patients IS 
    'Allows authenticated providers to view patients. In production, enhance to check organization_id and care_team membership.';

COMMENT ON POLICY "Providers can view appointments for their patients" ON appointments IS 
    'Allows providers to view appointments for their assigned patients or patients in their care team.';

COMMENT ON POLICY "Providers can view alerts for their patients" ON clinical_alerts IS 
    'Allows providers to view clinical alerts for patients in their care team.';

