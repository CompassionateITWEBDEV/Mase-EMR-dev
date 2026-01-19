-- ============================================================================
-- FIX FOR INFINITE RECURSION IN STAFF TABLE RLS POLICIES
-- ============================================================================
-- Problem: Policies query the staff table to check admin role, causing recursion
-- Solution: Create SECURITY DEFINER function to bypass RLS for admin checks
-- ============================================================================

-- Drop existing policies
DROP POLICY IF EXISTS "staff_select_own_or_admin" ON public.staff;
DROP POLICY IF EXISTS "staff_insert_admin_only" ON public.staff;
DROP POLICY IF EXISTS "staff_update_own_or_admin" ON public.staff;
DROP POLICY IF EXISTS "staff_permissions_select" ON public.staff_permissions;
DROP POLICY IF EXISTS "staff_permissions_admin_only" ON public.staff_permissions;
DROP POLICY IF EXISTS "patient_medications_healthcare_staff" ON public.patient_medications;
DROP POLICY IF EXISTS "patient_medications_prescriber_insert" ON public.patient_medications;
DROP POLICY IF EXISTS "patient_medications_prescriber_update" ON public.patient_medications;
DROP POLICY IF EXISTS "prescriptions_healthcare_staff_select" ON public.prescriptions;
DROP POLICY IF EXISTS "prescriptions_doctor_only" ON public.prescriptions;
DROP POLICY IF EXISTS "prescriptions_prescriber_update" ON public.prescriptions;
DROP POLICY IF EXISTS "staff_activity_log_own_or_admin" ON public.staff_activity_log;
DROP POLICY IF EXISTS "staff_activity_log_insert_own" ON public.staff_activity_log;

-- Create SECURITY DEFINER function to check if user is admin
-- This function bypasses RLS, preventing infinite recursion
CREATE OR REPLACE FUNCTION public.is_staff_admin(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.staff
    WHERE id = user_id AND role = 'admin' AND is_active = true
  );
END;
$$;

-- Create SECURITY DEFINER function to check if user is active staff
CREATE OR REPLACE FUNCTION public.is_active_staff(user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.staff
    WHERE id = user_id AND is_active = true
  );
END;
$$;

-- Create SECURITY DEFINER function to check if user has specific role
CREATE OR REPLACE FUNCTION public.has_staff_role(user_id UUID, role_name TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.staff
    WHERE id = user_id AND role::TEXT = role_name AND is_active = true
  );
END;
$$;

-- Create SECURITY DEFINER function to check if user has any of the specified roles
CREATE OR REPLACE FUNCTION public.has_staff_roles(user_id UUID, role_names TEXT[])
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.staff
    WHERE id = user_id 
    AND role::TEXT = ANY(role_names) 
    AND is_active = true
  );
END;
$$;

-- Recreate RLS Policies using the helper functions (no recursion!)

-- Staff table policies
CREATE POLICY "staff_select_own_or_admin" ON public.staff
  FOR SELECT USING (
    auth.uid() = id OR 
    public.is_staff_admin(auth.uid())
  );

CREATE POLICY "staff_insert_admin_only" ON public.staff
  FOR INSERT WITH CHECK (
    public.is_staff_admin(auth.uid())
  );

CREATE POLICY "staff_update_own_or_admin" ON public.staff
  FOR UPDATE USING (
    auth.uid() = id OR 
    public.is_staff_admin(auth.uid())
  );

-- Staff permissions policies
CREATE POLICY "staff_permissions_select" ON public.staff_permissions
  FOR SELECT USING (
    staff_id = auth.uid() OR
    public.is_staff_admin(auth.uid())
  );

CREATE POLICY "staff_permissions_admin_only" ON public.staff_permissions
  FOR ALL USING (
    public.is_staff_admin(auth.uid())
  );

-- Patient medications policies
CREATE POLICY "patient_medications_healthcare_staff" ON public.patient_medications
  FOR SELECT USING (
    public.is_active_staff(auth.uid())
  );

CREATE POLICY "patient_medications_prescriber_insert" ON public.patient_medications
  FOR INSERT WITH CHECK (
    public.has_staff_roles(auth.uid(), ARRAY['doctor', 'rn'])
  );

CREATE POLICY "patient_medications_prescriber_update" ON public.patient_medications
  FOR UPDATE USING (
    prescribed_by = auth.uid() OR
    public.has_staff_roles(auth.uid(), ARRAY['doctor', 'admin'])
  );

-- Prescriptions policies
CREATE POLICY "prescriptions_healthcare_staff_select" ON public.prescriptions
  FOR SELECT USING (
    public.is_active_staff(auth.uid())
  );

CREATE POLICY "prescriptions_doctor_only" ON public.prescriptions
  FOR INSERT WITH CHECK (
    public.has_staff_role(auth.uid(), 'doctor')
  );

CREATE POLICY "prescriptions_prescriber_update" ON public.prescriptions
  FOR UPDATE USING (
    prescribed_by = auth.uid() OR
    public.has_staff_roles(auth.uid(), ARRAY['doctor', 'admin'])
  );

-- Activity log policies
CREATE POLICY "staff_activity_log_own_or_admin" ON public.staff_activity_log
  FOR SELECT USING (
    staff_id = auth.uid() OR
    public.is_staff_admin(auth.uid())
  );

CREATE POLICY "staff_activity_log_insert_own" ON public.staff_activity_log
  FOR INSERT WITH CHECK (staff_id = auth.uid());

-- Verify functions were created
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_staff_admin') THEN
        RAISE NOTICE 'Function is_staff_admin() created successfully';
    ELSE
        RAISE EXCEPTION 'Failed to create function is_staff_admin()';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'is_active_staff') THEN
        RAISE NOTICE 'Function is_active_staff() created successfully';
    ELSE
        RAISE EXCEPTION 'Failed to create function is_active_staff()';
    END IF;
END $$;

