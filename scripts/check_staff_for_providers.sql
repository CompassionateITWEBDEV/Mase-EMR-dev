-- ============================================================================
-- Check Staff Members for Provider Eligibility
-- Run this query in your database to see which staff members can be providers
-- ============================================================================

-- View all staff members with their eligibility status
SELECT 
    id,
    first_name,
    last_name,
    email,
    role,
    LOWER(role) as role_lowercase,
    department,
    is_active,
    CASE 
        WHEN LOWER(role) IN ('doctor', 'counselor', 'case_manager', 'supervisor', 'rn', 'peer_recovery') 
        THEN 'ELIGIBLE' 
        ELSE 'NOT ELIGIBLE' 
    END as provider_eligibility,
    CASE 
        WHEN LOWER(role) IN ('doctor', 'counselor', 'case_manager', 'supervisor', 'rn', 'peer_recovery') 
             AND is_active = true 
        THEN 'YES - Will appear in dropdown'
        WHEN LOWER(role) IN ('doctor', 'counselor', 'case_manager', 'supervisor', 'rn', 'peer_recovery') 
             AND is_active = false 
        THEN 'YES - But inactive (will appear if active=false)'
        ELSE 'NO'
    END as will_appear_in_dropdown
FROM staff
ORDER BY 
    CASE 
        WHEN LOWER(role) IN ('doctor', 'counselor', 'case_manager', 'supervisor', 'rn', 'peer_recovery') 
        THEN 0 
        ELSE 1 
    END,
    last_name,
    first_name;

-- Summary counts
SELECT 
    COUNT(*) as total_staff,
    COUNT(*) FILTER (WHERE LOWER(role) IN ('doctor', 'counselor', 'case_manager', 'supervisor', 'rn', 'peer_recovery')) as eligible_staff,
    COUNT(*) FILTER (WHERE LOWER(role) IN ('doctor', 'counselor', 'case_manager', 'supervisor', 'rn', 'peer_recovery') AND is_active = true) as active_eligible_staff,
    COUNT(*) FILTER (WHERE LOWER(role) IN ('doctor', 'counselor', 'case_manager', 'supervisor', 'rn', 'peer_recovery') AND is_active = false) as inactive_eligible_staff
FROM staff;

-- Show all unique roles in the database
SELECT 
    role,
    LOWER(role) as role_lowercase,
    COUNT(*) as count,
    COUNT(*) FILTER (WHERE is_active = true) as active_count,
    CASE 
        WHEN LOWER(role) IN ('doctor', 'counselor', 'case_manager', 'supervisor', 'rn', 'peer_recovery') 
        THEN 'ELIGIBLE' 
        ELSE 'NOT ELIGIBLE' 
    END as eligibility
FROM staff
GROUP BY role, LOWER(role)
ORDER BY eligibility, role;
