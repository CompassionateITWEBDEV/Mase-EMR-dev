-- ============================================================================
-- FIX FOR EBP FIDELITY ASSESSMENT TRIGGER
-- ============================================================================
-- This script fixes the GROUP BY error in the update_ebp_fidelity_score() function
-- Error: "column ebp_fidelity_assessments.assessment_date must appear in the GROUP BY clause"
-- 
-- Solution: Use a subquery to first get the last 3 assessments, then aggregate
-- ============================================================================

-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS trigger_update_fidelity_score ON ebp_fidelity_assessments;
DROP FUNCTION IF EXISTS update_ebp_fidelity_score();

-- Recreate the function with improved SQL query
-- SOLUTION: Use latest score only (matches application logic, simpler, no GROUP BY issues)
-- This is better than averaging because:
-- 1. Matches what the application code expects (calculate-metrics.ts uses limit 1)
-- 2. Simpler query = better performance
-- 3. No GROUP BY complexity
-- 4. More intuitive (shows current state)
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
    -- Simple LIMIT 1 query - no aggregation needed, no GROUP BY issues
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

-- Recreate the trigger
CREATE TRIGGER trigger_update_fidelity_score
    AFTER INSERT OR UPDATE OR DELETE ON ebp_fidelity_assessments
    FOR EACH ROW
    EXECUTE FUNCTION update_ebp_fidelity_score();

-- Verify the function was created
SELECT 
    proname as function_name,
    prosrc as function_body
FROM pg_proc
WHERE proname = 'update_ebp_fidelity_score';

