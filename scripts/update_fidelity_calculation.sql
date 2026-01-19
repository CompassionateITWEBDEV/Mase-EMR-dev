-- ============================================================================
-- UPDATE FIDELITY SCORE CALCULATION - LATEST ASSESSMENT APPROACH
-- ============================================================================
-- This script updates the fidelity score trigger to use the LATEST assessment
-- score directly, which is the clinically appropriate approach for EBP fidelity.
-- 
-- Fidelity = Point-in-time measurement of adherence to EBP protocol
-- The latest assessment reflects the CURRENT state of fidelity
-- Historical trends are viewable in the assessment list (View Fidelity button)
-- ============================================================================

-- Drop the existing trigger first
DROP TRIGGER IF EXISTS trigger_update_fidelity_score ON ebp_fidelity_assessments;

-- Create the simplified function using latest assessment score
CREATE OR REPLACE FUNCTION update_ebp_fidelity_score()
RETURNS TRIGGER AS $$
DECLARE
    target_ebp_id UUID;
    latest_score DECIMAL(5,2);
    latest_review_date DATE;
BEGIN
    -- Get the EBP ID (from NEW or OLD depending on operation)
    target_ebp_id := COALESCE(NEW.ebp_id, OLD.ebp_id);
    
    -- Get the latest assessment (most recent by date, then by created_at for tiebreaker)
    SELECT 
        fidelity_score,
        assessment_date
    INTO latest_score, latest_review_date
    FROM ebp_fidelity_assessments
    WHERE ebp_id = target_ebp_id
    ORDER BY assessment_date DESC, created_at DESC
    LIMIT 1;
    
    -- If no assessments found, set score to 0
    IF latest_score IS NULL THEN
        UPDATE evidence_based_practices
        SET 
            fidelity_score = 0,
            last_fidelity_review = NULL,
            updated_at = NOW()
        WHERE id = target_ebp_id;
        RETURN COALESCE(NEW, OLD);
    END IF;
    
    -- Update EBP with the LATEST assessment score directly
    -- This is clinically appropriate - fidelity shows current adherence state
    UPDATE evidence_based_practices
    SET 
        fidelity_score = ROUND(latest_score),
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

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After running this script:
-- 1. Add a new fidelity assessment with score 75%
-- 2. The fidelity_score in evidence_based_practices should be exactly 75%
-- 3. Historical assessments are still viewable via the "View Fidelity" button
-- ============================================================================

-- Add comment to document the approach
COMMENT ON FUNCTION update_ebp_fidelity_score() IS 
'Fidelity Score = Latest Assessment Score (clinically appropriate)
- Fidelity is a point-in-time measurement of EBP protocol adherence
- Shows current state for quality improvement and compliance
- Historical trends viewable in assessment list
- Same-date assessments: most recently created wins';
