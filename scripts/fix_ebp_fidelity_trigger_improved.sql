-- ============================================================================
-- IMPROVED FIX FOR EBP FIDELITY ASSESSMENT TRIGGER
-- ============================================================================
-- This script provides a better solution using window functions
-- 
-- Analysis:
-- 1. Current issue: GROUP BY error when using ORDER BY + LIMIT with aggregates
-- 2. App code uses LATEST score (limit 1), but trigger averages last 3
-- 3. Best solution: Use window functions for clarity and performance
-- 
-- Options:
-- A) Use latest score only (matches app code, simpler)
-- B) Average last 3 (more stable, less affected by outliers)
-- C) Use window function for better performance
-- ============================================================================

-- Drop the existing trigger and function
DROP TRIGGER IF EXISTS trigger_update_fidelity_score ON ebp_fidelity_assessments;
DROP FUNCTION IF EXISTS update_ebp_fidelity_score();

-- OPTION A: Use latest score only (matches application logic, simpler)
-- This is the RECOMMENDED approach for consistency
CREATE OR REPLACE FUNCTION update_ebp_fidelity_score()
RETURNS TRIGGER AS $$
DECLARE
    latest_fidelity DECIMAL(5,2);
    latest_review_date DATE;
    target_ebp_id UUID;
BEGIN
    -- Get the EBP ID (from NEW or OLD depending on operation)
    target_ebp_id := COALESCE(NEW.ebp_id, OLD.ebp_id);
    
    -- Get the latest assessment (most recent by date)
    -- Using DISTINCT ON for efficiency and clarity
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

-- Alternative OPTION B: Average of last 3 assessments (if you prefer this approach)
-- Uncomment this and comment out Option A if you want averaging instead
/*
CREATE OR REPLACE FUNCTION update_ebp_fidelity_score()
RETURNS TRIGGER AS $$
DECLARE
    avg_fidelity DECIMAL(5,2);
    latest_review_date DATE;
    target_ebp_id UUID;
BEGIN
    target_ebp_id := COALESCE(NEW.ebp_id, OLD.ebp_id);
    
    -- Use window function approach (more efficient than subquery)
    WITH ranked_assessments AS (
        SELECT 
            fidelity_score,
            assessment_date,
            ROW_NUMBER() OVER (ORDER BY assessment_date DESC, created_at DESC) as rn
        FROM ebp_fidelity_assessments
        WHERE ebp_id = target_ebp_id
    )
    SELECT 
        AVG(fidelity_score),
        MAX(assessment_date)
    INTO avg_fidelity, latest_review_date
    FROM ranked_assessments
    WHERE rn <= 3;
    
    UPDATE evidence_based_practices
    SET 
        fidelity_score = COALESCE(avg_fidelity, 0),
        last_fidelity_review = latest_review_date,
        updated_at = NOW()
    WHERE id = target_ebp_id;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;
*/

-- Recreate the trigger
CREATE TRIGGER trigger_update_fidelity_score
    AFTER INSERT OR UPDATE OR DELETE ON ebp_fidelity_assessments
    FOR EACH ROW
    EXECUTE FUNCTION update_ebp_fidelity_score();

-- Verify the function was created correctly
SELECT 
    proname as function_name,
    pg_get_functiondef(oid) as function_definition
FROM pg_proc
WHERE proname = 'update_ebp_fidelity_score';

