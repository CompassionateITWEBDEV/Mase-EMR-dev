# EBP Fidelity Trigger - Solution Analysis

## Problem
Error: `column "ebp_fidelity_assessments.assessment_date" must appear in the GROUP BY clause`

## Root Cause
The original trigger function tried to use `ORDER BY` and `LIMIT` directly with aggregate functions (`AVG`, `MAX`), which PostgreSQL doesn't allow without proper grouping.

## Current Inconsistency Found
- **Application Code** (`calculate-metrics.ts`): Uses **LATEST** fidelity score (limit 1)
- **Database Trigger**: Tries to **AVERAGE** last 3 assessments

This inconsistency could cause confusion where the displayed score doesn't match the stored score.

## Solution Options

### Option A: Use Latest Score Only (RECOMMENDED) ✅
**Pros:**
- Matches application logic (consistent)
- Simpler query (better performance)
- More intuitive (shows current state)
- No GROUP BY issues

**Cons:**
- More sensitive to outliers
- May fluctuate more

**Best for:** When you want to see the most recent assessment score

### Option B: Average Last 3 Assessments
**Pros:**
- More stable (less affected by outliers)
- Smoothes out variations
- Better for trend analysis

**Cons:**
- Doesn't match application code
- Slightly more complex query
- May hide recent changes

**Best for:** When you want a rolling average

### Option C: Window Function Approach (Most Elegant)
**Pros:**
- Most efficient for large datasets
- Very clear and readable
- Best performance

**Cons:**
- Slightly more complex syntax

## Recommended Solution

**Use Option A (Latest Score Only)** because:
1. ✅ Matches existing application logic
2. ✅ Simpler and faster
3. ✅ More intuitive for users
4. ✅ No GROUP BY complexity
5. ✅ Consistent behavior across system

## Implementation

The improved solution uses a simple `LIMIT 1` query which:
- Gets the most recent assessment by date
- Uses `created_at DESC` as tiebreaker for same-date assessments
- No aggregation needed, so no GROUP BY issues
- Matches what the application code expects

