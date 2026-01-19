-- ============================================================================
-- FINAL FIX FOR EBP FIDELITY ASSESSMENT TRIGGER
-- ============================================================================
-- This script fixes the GROUP BY error by using the latest score only
-- 
-- Solution Benefits:
-- ✅ Matches application logic (calculate-metrics.ts uses limit 1)
-- ✅ Simpler query (better performance)
-- ✅ No GROUP BY issues
-- ✅ More intuitive (shows current assessment state)
-- ============================================================================

-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS trigger_update_fidelity_score ON ebp_fidelity_assessments;
DROP FUNCTION IF EXISTS update_ebp_fidelity_score();

-- Recreate the function with the improved solution (latest score only)
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

-- Verify the function was created successfully
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_proc 
        WHERE proname = 'update_ebp_fidelity_score'
    ) THEN
        RAISE NOTICE 'Function update_ebp_fidelity_score() created successfully';
    ELSE
        RAISE EXCEPTION 'Failed to create function update_ebp_fidelity_score()';
    END IF;
    
    IF EXISTS (
        SELECT 1 FROM pg_trigger 
        WHERE tgname = 'trigger_update_fidelity_score'
    ) THEN
        RAISE NOTICE 'Trigger trigger_update_fidelity_score created successfully';
    ELSE
        RAISE EXCEPTION 'Failed to create trigger trigger_update_fidelity_score';
    END IF;
END $$;

