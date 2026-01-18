-- ============================================================================
-- SYNC STAFF TO PROVIDERS TABLE
-- Migration to automatically sync eligible staff members to providers table
-- ============================================================================
-- This migration:
-- 1. Syncs existing staff members with eligible roles to providers table
-- 2. Creates a function to automatically sync staff to providers
-- 3. Creates triggers to maintain sync when staff is added/updated
-- ============================================================================

-- Eligible staff roles that should appear as providers
-- doctor, counselor, case_manager, supervisor, rn, peer_recovery

-- ============================================================================
-- STEP 1: Ensure providers table has is_active column
-- ============================================================================

ALTER TABLE public.providers 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- ============================================================================
-- STEP 2: Create function to map staff role to specialization
-- ============================================================================

CREATE OR REPLACE FUNCTION get_specialization_from_role(role_name TEXT, dept TEXT)
RETURNS TEXT AS $$
BEGIN
  CASE role_name
    WHEN 'doctor' THEN
      RETURN COALESCE('Physician' || CASE WHEN dept IS NOT NULL THEN ' - ' || dept ELSE '' END, 'Physician');
    WHEN 'counselor' THEN
      RETURN COALESCE('Counseling' || CASE WHEN dept IS NOT NULL THEN ' - ' || dept ELSE '' END, 'Counseling');
    WHEN 'case_manager' THEN
      RETURN COALESCE('Case Management' || CASE WHEN dept IS NOT NULL THEN ' - ' || dept ELSE '' END, 'Case Management');
    WHEN 'supervisor' THEN
      RETURN COALESCE('Clinical Supervisor' || CASE WHEN dept IS NOT NULL THEN ' - ' || dept ELSE '' END, 'Clinical Supervisor');
    WHEN 'rn' THEN
      RETURN COALESCE('Nursing' || CASE WHEN dept IS NOT NULL THEN ' - ' || dept ELSE '' END, 'Nursing');
    WHEN 'peer_recovery' THEN
      RETURN COALESCE('Peer Recovery' || CASE WHEN dept IS NOT NULL THEN ' - ' || dept ELSE '' END, 'Peer Recovery');
    ELSE
      RETURN COALESCE(role_name || CASE WHEN dept IS NOT NULL THEN ' - ' || dept ELSE '' END, role_name);
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- STEP 3: Create function to sync staff member to providers table
-- ============================================================================

CREATE OR REPLACE FUNCTION sync_staff_to_providers()
RETURNS TRIGGER AS $$
DECLARE
  eligible_roles TEXT[] := ARRAY['doctor', 'counselor', 'case_manager', 'supervisor', 'rn', 'peer_recovery'];
  staff_specialization TEXT;
BEGIN
  -- Check if staff role is eligible
  IF NEW.role = ANY(eligible_roles) THEN
    -- Get specialization from role and department
    staff_specialization := get_specialization_from_role(NEW.role::TEXT, NEW.department);
    
    -- Insert or update provider record
    INSERT INTO public.providers (
      id,
      first_name,
      last_name,
      email,
      phone,
      license_number,
      license_type,
      specialization,
      is_active,
      created_at,
      updated_at
    )
    VALUES (
      NEW.id,
      NEW.first_name,
      NEW.last_name,
      NEW.email,
      NEW.phone,
      NEW.license_number,
      NEW.license_type,
      staff_specialization,
      NEW.is_active,
      COALESCE(NEW.created_at, NOW()),
      NOW()
    )
    ON CONFLICT (id) 
    DO UPDATE SET
      first_name = EXCLUDED.first_name,
      last_name = EXCLUDED.last_name,
      email = EXCLUDED.email,
      phone = EXCLUDED.phone,
      license_number = EXCLUDED.license_number,
      license_type = EXCLUDED.license_type,
      specialization = EXCLUDED.specialization,
      is_active = EXCLUDED.is_active,
      updated_at = NOW();
  ELSE
    -- If role is not eligible, remove from providers table if exists
    DELETE FROM public.providers WHERE id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- STEP 4: Create triggers to auto-sync staff to providers
-- ============================================================================

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS sync_staff_to_providers_on_insert ON public.staff;
DROP TRIGGER IF EXISTS sync_staff_to_providers_on_update ON public.staff;

-- Create trigger for new staff insertions
CREATE TRIGGER sync_staff_to_providers_on_insert
  AFTER INSERT ON public.staff
  FOR EACH ROW
  EXECUTE FUNCTION sync_staff_to_providers();

-- Create trigger for staff updates
CREATE TRIGGER sync_staff_to_providers_on_update
  AFTER UPDATE ON public.staff
  FOR EACH ROW
  WHEN (
    OLD.role IS DISTINCT FROM NEW.role OR
    OLD.first_name IS DISTINCT FROM NEW.first_name OR
    OLD.last_name IS DISTINCT FROM NEW.last_name OR
    OLD.email IS DISTINCT FROM NEW.email OR
    OLD.phone IS DISTINCT FROM NEW.phone OR
    OLD.department IS DISTINCT FROM NEW.department OR
    OLD.license_number IS DISTINCT FROM NEW.license_number OR
    OLD.license_type IS DISTINCT FROM NEW.license_type OR
    OLD.is_active IS DISTINCT FROM NEW.is_active
  )
  EXECUTE FUNCTION sync_staff_to_providers();

-- ============================================================================
-- STEP 5: Sync existing staff members to providers table
-- ============================================================================

-- Insert existing eligible staff members into providers table
INSERT INTO public.providers (
  id,
  first_name,
  last_name,
  email,
  phone,
  license_number,
  license_type,
  specialization,
  is_active,
  created_at,
  updated_at
)
SELECT 
  s.id,
  s.first_name,
  s.last_name,
  s.email,
  s.phone,
  s.license_number,
  s.license_type,
  get_specialization_from_role(s.role::TEXT, s.department) as specialization,
  s.is_active,
  s.created_at,
  NOW() as updated_at
FROM public.staff s
WHERE s.role IN ('doctor', 'counselor', 'case_manager', 'supervisor', 'rn', 'peer_recovery')
  AND s.is_active = true
  AND NOT EXISTS (
    SELECT 1 FROM public.providers p WHERE p.id = s.id
  )
ON CONFLICT (id) 
DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  license_number = EXCLUDED.license_number,
  license_type = EXCLUDED.license_type,
  specialization = EXCLUDED.specialization,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- ============================================================================
-- STEP 6: Update existing providers that are staff members
-- ============================================================================

-- Update providers table with latest staff information for existing records
UPDATE public.providers p
SET
  first_name = s.first_name,
  last_name = s.last_name,
  email = s.email,
  phone = s.phone,
  license_number = s.license_number,
  license_type = s.license_type,
  specialization = get_specialization_from_role(s.role::TEXT, s.department),
  is_active = s.is_active,
  updated_at = NOW()
FROM public.staff s
WHERE p.id = s.id
  AND s.role IN ('doctor', 'counselor', 'case_manager', 'supervisor', 'rn', 'peer_recovery');

-- ============================================================================
-- STEP 7: Remove providers that are no longer eligible staff
-- ============================================================================

-- Remove providers that are staff but no longer have eligible roles or are inactive
DELETE FROM public.providers p
WHERE EXISTS (
  SELECT 1 FROM public.staff s 
  WHERE s.id = p.id 
  AND (
    s.role NOT IN ('doctor', 'counselor', 'case_manager', 'supervisor', 'rn', 'peer_recovery')
    OR s.is_active = false
  )
);

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON FUNCTION sync_staff_to_providers() IS 
  'Automatically syncs staff members with eligible roles (doctor, counselor, case_manager, supervisor, rn, peer_recovery) to the providers table';

COMMENT ON FUNCTION get_specialization_from_role(TEXT, TEXT) IS 
  'Maps staff role and department to a display specialization string for the providers table';

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Run these queries to verify the sync:
-- 
-- 1. Count eligible staff members:
-- SELECT COUNT(*) FROM public.staff 
-- WHERE role IN ('doctor', 'counselor', 'case_manager', 'supervisor', 'rn', 'peer_recovery') 
-- AND is_active = true;
--
-- 2. Count providers synced from staff:
-- SELECT COUNT(*) FROM public.providers p
-- INNER JOIN public.staff s ON p.id = s.id
-- WHERE s.role IN ('doctor', 'counselor', 'case_manager', 'supervisor', 'rn', 'peer_recovery');
--
-- 3. View synced providers:
-- SELECT 
--   p.id,
--   p.first_name,
--   p.last_name,
--   p.specialization,
--   s.role,
--   s.department,
--   p.is_active
-- FROM public.providers p
-- INNER JOIN public.staff s ON p.id = s.id
-- WHERE s.role IN ('doctor', 'counselor', 'case_manager', 'supervisor', 'rn', 'peer_recovery')
-- ORDER BY p.last_name, p.first_name;
