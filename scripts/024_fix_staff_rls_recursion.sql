-- =====================================================
-- Fix Staff Table RLS Infinite Recursion
-- Run this script on Supabase SQL Editor
-- =====================================================

-- OPTION 1: Just disable RLS on staff table (quickest fix)
-- Uncomment and run this if you want to quickly test:
ALTER TABLE staff DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- OPTION 2: Drop and recreate policies (better for production)
-- Comment out the DISABLE line above and uncomment below:
-- =====================================================

/*
-- Drop ALL existing policies on staff table
DO $$ 
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname FROM pg_policies WHERE tablename = 'staff'
    LOOP
        EXECUTE 'DROP POLICY IF EXISTS "' || pol.policyname || '" ON staff';
    END LOOP;
END $$;

-- Re-enable RLS
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

-- Create simple non-recursive policies
CREATE POLICY "staff_read_all" 
ON staff FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "staff_manage_all" 
ON staff FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);
*/

-- =====================================================
-- Done! Run this script in Supabase SQL Editor.
-- =====================================================
