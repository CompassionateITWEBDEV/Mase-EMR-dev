# Research Study Date Validation - Implementation Guide

## Overview

This document explains the date validation approach for research studies, including how study start/end dates work, enrollment validation, and the calendar system used.

## Recommendation: Server-Side UTC Date Validation Only

**Decision:** Implement server-side UTC date validation. **Skip complex timezone handling.**

### Why This Approach?

1. **Security & Data Integrity**: Server-side validation prevents client manipulation
2. **Simplicity**: DATE fields in PostgreSQL are timezone-agnostic (perfect for calendar dates)
3. **Consistency**: Using UTC for "today" comparisons ensures consistent behavior across servers
4. **No Redundancy**: Complex timezone libraries not needed for calendar date comparisons

## How It Works

### 1. Study Start/End Dates

- **Storage**: PostgreSQL `DATE` type (YYYY-MM-DD format, timezone-agnostic)
- **Source**: Manually set when creating/editing studies
- **Display**: Formatted as M/D/YYYY for user display
- **Validation**: Server validates end_date >= start_date

### 2. Enrollment Date Validation

**Server-Side (Primary Validation):**
- Uses UTC date for "today" comparison (consistent across servers)
- Validates enrollment_date is within study.start_date and study.end_date
- Validates study is currently active (today is within study dates)
- Prevents enrollment outside study timeline

**Client-Side (UX Only):**
- Provides immediate feedback to users
- Can be bypassed - server validation is authoritative

### 3. Calendar System

**Current Implementation:**
- **Client**: Uses PC/system date via `new Date().toISOString().split('T')[0]`
- **Server**: Uses UTC date via `getUTCDateString()` helper function
- **Database**: Stores as DATE (timezone-agnostic)

**Why UTC on Server?**
- Server may be in different timezone than users
- UTC ensures consistent "today" comparison regardless of server location
- DATE fields don't store timezone, so UTC date string comparison is correct

## Implementation Details

### Server-Side Helper Function

```typescript
// Helper function to get UTC date string (YYYY-MM-DD) for consistent date comparisons
function getUTCDateString(date?: Date): string {
  const d = date || new Date()
  const year = d.getUTCFullYear()
  const month = String(d.getUTCMonth() + 1).padStart(2, '0')
  const day = String(d.getUTCDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
```

### Validation Logic

1. **Enrollment Date Normalization**: Converts client-provided date to UTC date string
2. **Date Range Check**: Validates enrollment_date is within study.start_date and study.end_date
3. **Active Study Check**: Validates today (UTC) is within study dates
4. **Format Validation**: Ensures dates are in YYYY-MM-DD format

### Key Files Modified

- `app/api/research/studies/[id]/participants/route.ts`
  - Added `getUTCDateString()` helper
  - Updated `validateEnrollment()` to accept and validate enrollment_date
  - Normalizes all dates to UTC before comparison

## Timeline Display

The timeline shows:
- **Study Duration**: Calculated from start_date to end_date (static)
- **Days Remaining**: Calculated from today (client PC date) to end_date (for display only)

**Note**: Client-side "Days Remaining" is for UX only. Server validation uses UTC date.

## Enrollment Flow

1. **User clicks "Enroll Patient"**
   - Client checks if enrollment allowed (uses PC date for UX)
   - Shows error immediately if not allowed

2. **User submits enrollment**
   - Client sends enrollment_date (defaults to PC date, can be edited)
   - Server validates using UTC date
   - Server checks:
     - Enrollment date within study dates
     - Today (UTC) within study dates
     - Study status, IRB approval, capacity

3. **Enrollment saved**
   - enrolled_date stored as DATE in database
   - No timezone information stored (calendar date only)

## Why Not Full Timezone Handling?

1. **DATE Type is Timezone-Agnostic**: PostgreSQL DATE fields don't store timezone
2. **Calendar Dates**: Study dates are calendar dates (Jan 1, 2026), not timestamps
3. **Complexity vs Benefit**: Full timezone handling adds complexity without clear benefit
4. **Consistency**: UTC date comparison is sufficient for calendar date validation

## Edge Cases Handled

1. **Server in Different Timezone**: UTC date ensures consistent comparison
2. **Client Date Manipulation**: Server validation prevents bypass
3. **Date Format Issues**: Server validates and normalizes date format
4. **Enrollment Outside Study Dates**: Server rejects with clear error message

## Future Considerations

If timezone handling becomes necessary (e.g., studies need to start at specific local times):
1. Add `timezone` field to research_studies table
2. Use TIMESTAMPTZ instead of DATE for start/end dates
3. Convert to organization's timezone for display
4. Use UTC for all server-side comparisons

**Current recommendation**: Not needed for calendar date-based studies.

## Testing Checklist

- [x] Server validates enrollment date within study range
- [x] Server validates study is currently active (today within dates)
- [x] Client can display timeline with local date
- [x] Server uses UTC for consistent validation
- [x] Date format validation works correctly
- [x] Error messages are clear and helpful

## Summary

**Approach**: Server-side UTC date validation only
**Reason**: Simple, secure, sufficient for calendar date comparisons
**Timezone Handling**: Not needed (DATE fields are timezone-agnostic)
**Result**: Consistent, secure date validation without unnecessary complexity

