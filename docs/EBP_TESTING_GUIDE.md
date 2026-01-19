# Evidence-Based Practices (EBP) Testing Guide

This document provides comprehensive testing procedures for all implemented EBP features.

## Test Environment Setup

1. Ensure database tables are created:
   - Run `scripts/create_evidence_based_practices_tables.sql` in Supabase SQL Editor
   - Verify all tables exist: `evidence_based_practices`, `ebp_fidelity_assessments`, `ebp_staff_assignments`, `ebp_patient_delivery`, `ebp_outcomes`

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Navigate to Research Dashboard → EBP tab

---

## Test Suite 1: Core CRUD Operations

### Test 1.1: Create EBP
**Steps:**
1. Click "Create EBP" button
2. Fill in required fields:
   - Name: "Cognitive Behavioral Therapy"
   - Category: "Counseling"
   - Description: "Evidence-based therapy for depression and anxiety"
   - Total Staff: 10
3. Click "Save"

**Expected Results:**
- ✅ EBP is created successfully
- ✅ Success toast message appears
- ✅ EBP appears in the list
- ✅ Initial metrics are 0 (adoption_rate, fidelity_score, sustainability_score)

### Test 1.2: Edit EBP
**Steps:**
1. Find an existing EBP
2. Click "Edit" button
3. Modify name or description
4. Click "Save"

**Expected Results:**
- ✅ Changes are saved
- ✅ Updated information appears in the list
- ✅ Success toast message appears

### Test 1.3: Delete EBP
**Steps:**
1. Find an existing EBP
2. Click "Delete" button
3. Confirm deletion

**Expected Results:**
- ✅ EBP is removed from the list
- ✅ Success toast message appears
- ✅ EBP no longer appears in searches

---

## Test Suite 2: Date Validation

### Test 2.1: Fidelity Assessment Date Validation
**Steps:**
1. Select an EBP
2. Click "Add Assessment"
3. Try to set assessment_date to a future date
4. Click "Save"

**Expected Results:**
- ✅ Error message: "Assessment date cannot be in the future"
- ✅ Form does not submit

### Test 2.2: Training Date Validation
**Steps:**
1. Select an EBP
2. Click "Assign Staff"
3. Try to set training_date to a future date
4. Click "Save"

**Expected Results:**
- ✅ Error message: "Training date cannot be in the future"
- ✅ Form does not submit

### Test 2.3: Certification Date Validation
**Steps:**
1. Select an EBP
2. Click "Assign Staff"
3. Set training_date to "2024-01-15"
4. Try to set certification_date to "2024-01-10" (before training)
5. Click "Save"

**Expected Results:**
- ✅ Error message: "Certification date cannot be before training date"
- ✅ Form does not submit

### Test 2.4: Certification Expiration Date Validation
**Steps:**
1. Select an EBP
2. Click "Assign Staff"
3. Set certification_date to "2024-01-15"
4. Try to set certification_expires_date to "2024-01-15" (same date)
5. Click "Save"

**Expected Results:**
- ✅ Error message: "Certification expiration date must be after certification date"
- ✅ Form does not submit

### Test 2.5: Delivery Date Validation
**Steps:**
1. Select an EBP
2. Click "Record Delivery"
3. Try to set delivery_date to a future date
4. Click "Save"

**Expected Results:**
- ✅ Error message: "Delivery date cannot be in the future"
- ✅ Form does not submit

### Test 2.6: Outcome Measurement Date Validation
**Steps:**
1. Select an EBP
2. Click "Record Outcome"
3. Try to set measurement_date to a future date
4. Click "Save"

**Expected Results:**
- ✅ Error message: "Measurement date cannot be in the future"
- ✅ Form does not submit

---

## Test Suite 3: Duplicate Prevention

### Test 3.1: Duplicate Fidelity Assessment
**Steps:**
1. Select an EBP
2. Create a fidelity assessment for date "2024-01-15" with assessor "user1"
3. Try to create another assessment for the same date with the same assessor
4. Click "Save"

**Expected Results:**
- ✅ Error message: "A fidelity assessment for this EBP by this assessor already exists for this date"
- ✅ Form does not submit

### Test 3.2: Duplicate Patient Delivery
**Steps:**
1. Select an EBP
2. Record a delivery for patient "patient1" on date "2024-01-15"
3. Try to record another delivery for the same patient on the same date
4. Click "Save"

**Expected Results:**
- ✅ Error message: "A patient delivery for this EBP to this patient already exists for this date"
- ✅ Form does not submit

### Test 3.3: Duplicate Outcome
**Steps:**
1. Select an EBP
2. Record an outcome for patient "patient1", type "Symptom Reduction", date "2024-01-15"
3. Try to record another outcome with the same patient, type, and date
4. Click "Save"

**Expected Results:**
- ✅ Error message: "An outcome of this type for this EBP and patient already exists for this date"
- ✅ Form does not submit

---

## Test Suite 4: Outcome Value Validation

### Test 4.1: Percentage Outcome Validation
**Steps:**
1. Select an EBP
2. Click "Record Outcome"
3. Set outcome_type to "Symptom Reduction Percentage"
4. Try to set outcome_value to "150" (above 100)
5. Click "Save"

**Expected Results:**
- ✅ Error message: "Percentage outcome value must be between 0 and 100"
- ✅ Form does not submit

### Test 4.2: Negative Outcome Value
**Steps:**
1. Select an EBP
2. Click "Record Outcome"
3. Set outcome_type to "Count"
4. Try to set outcome_value to "-5"
5. Click "Save"

**Expected Results:**
- ✅ Error message: "Count outcomes cannot be negative"
- ✅ Form does not submit

### Test 4.3: Invalid Number Format
**Steps:**
1. Select an EBP
2. Click "Record Outcome"
3. Set outcome_value to "abc"
4. Click "Save"

**Expected Results:**
- ✅ Error message: "Outcome value must be a valid number"
- ✅ Form does not submit

---

## Test Suite 5: Pagination

### Test 5.1: Pagination Controls
**Steps:**
1. Ensure there are more than 10 EBPs in the system
2. Navigate to EBP tab
3. Check pagination controls at the bottom

**Expected Results:**
- ✅ Page size selector is visible (default: 10)
- ✅ Page navigation buttons are visible
- ✅ Total count is displayed correctly
- ✅ Current page is highlighted

### Test 5.2: Change Page Size
**Steps:**
1. Change page size to 25
2. Verify list updates

**Expected Results:**
- ✅ List shows 25 items per page
- ✅ Pagination controls update accordingly

### Test 5.3: Navigate Pages
**Steps:**
1. Click "Next" button
2. Click "Previous" button
3. Click on a specific page number

**Expected Results:**
- ✅ List updates to show correct items
- ✅ Current page indicator updates
- ✅ No duplicate items appear

---

## Test Suite 6: Search and Filtering

### Test 6.1: Basic Search
**Steps:**
1. Enter search term "CBT" in search box
2. Verify results

**Expected Results:**
- ✅ Only EBPs matching "CBT" are displayed
- ✅ Search is case-insensitive
- ✅ Search works on name and description

### Test 6.2: Category Filter
**Steps:**
1. Select category "Counseling" from filter dropdown
2. Verify results

**Expected Results:**
- ✅ Only EBPs in "Counseling" category are displayed
- ✅ Filter persists when navigating pages

### Test 6.3: Advanced Filters
**Steps:**
1. Click "Show Advanced Filters"
2. Set minimum adoption rate to 50
3. Set minimum fidelity score to 70
4. Set date range from "2024-01-01" to "2024-12-31"
5. Apply filters

**Expected Results:**
- ✅ Only EBPs meeting all criteria are displayed
- ✅ Filters can be cleared
- ✅ Filters work in combination with search

---

## Test Suite 7: Sorting

### Test 7.1: Sort by Name
**Steps:**
1. Select "Name" from sort dropdown
2. Toggle sort order (asc/desc)

**Expected Results:**
- ✅ List is sorted alphabetically by name
- ✅ Sort order indicator updates (↑/↓)
- ✅ Sort persists when navigating pages

### Test 7.2: Sort by Metrics
**Steps:**
1. Sort by "Adoption Rate"
2. Sort by "Fidelity Score"
3. Sort by "Sustainability Score"

**Expected Results:**
- ✅ List is sorted by selected metric
- ✅ Sort order (asc/desc) works correctly
- ✅ EBPs with null/0 values are handled appropriately

---

## Test Suite 8: Export Functionality

### Test 8.1: Export Summary to Excel
**Steps:**
1. Click "Export" button in EBP list header
2. Verify file download

**Expected Results:**
- ✅ Excel file is downloaded
- ✅ File contains all EBP data
- ✅ File name includes current date
- ✅ All metrics are included in export

### Test 8.2: Export Individual EBP Report
**Steps:**
1. Select an EBP
2. Click "Export" button on EBP card
3. Verify file download

**Expected Results:**
- ✅ Excel file is downloaded
- ✅ File contains detailed EBP information
- ✅ File name includes EBP name and date

---

## Test Suite 9: Trend Charts

### Test 9.1: View Fidelity Trend
**Steps:**
1. Select an EBP with fidelity assessments
2. Click "View Trends"
3. Select time period (e.g., "6 Months")
4. Verify fidelity chart

**Expected Results:**
- ✅ Trend dialog opens
- ✅ Fidelity line chart displays correctly
- ✅ Chart shows monthly averages
- ✅ Time period selector works

### Test 9.2: View Adoption Trend
**Steps:**
1. Select an EBP with staff assignments
2. Click "View Trends"
3. Verify adoption chart

**Expected Results:**
- ✅ Adoption bar chart displays
- ✅ Chart shows trained vs total staff over time
- ✅ Data is grouped by month

### Test 9.3: View Delivery Trend
**Steps:**
1. Select an EBP with patient deliveries
2. Click "View Trends"
3. Verify delivery chart

**Expected Results:**
- ✅ Delivery bar chart displays
- ✅ Chart shows total deliveries and unique patients
- ✅ Data is grouped by month

### Test 9.4: View Outcome Trends
**Steps:**
1. Select an EBP with outcomes
2. Click "View Trends"
3. Verify outcome charts

**Expected Results:**
- ✅ Separate line chart for each outcome type
- ✅ Charts show average values over time
- ✅ Multiple outcome types are displayed separately

### Test 9.5: Change Time Period
**Steps:**
1. Open trends dialog
2. Change period from "6 Months" to "1 Year"
3. Verify data updates

**Expected Results:**
- ✅ Chart data refreshes
- ✅ New time period data is displayed
- ✅ Loading indicator appears during refresh

---

## Test Suite 10: Bulk Operations

### Test 10.1: Bulk Assign Staff
**Steps:**
1. Select an EBP
2. Click "Bulk Operations"
3. Select operation type "Assign/Train Staff"
4. Add multiple staff items in JSON format:
   ```json
   [
     {"staff_id": "staff1", "status": "trained", "training_date": "2024-01-15"},
     {"staff_id": "staff2", "status": "certified", "training_date": "2024-01-15", "certification_date": "2024-01-20"}
   ]
   ```
5. Click "Process Items"

**Expected Results:**
- ✅ All staff are assigned/trained
- ✅ Success message shows count of processed items
- ✅ EBP metrics update (trained_staff, adoption_rate)
- ✅ Errors for invalid items are reported

### Test 10.2: Bulk Record Deliveries
**Steps:**
1. Select an EBP
2. Click "Bulk Operations"
3. Select operation type "Record Patient Deliveries"
4. Add multiple delivery items:
   ```json
   [
     {"patient_id": "patient1", "delivery_date": "2024-01-15", "delivery_type": "session"},
     {"patient_id": "patient2", "delivery_date": "2024-01-15", "delivery_type": "session"}
   ]
   ```
5. Click "Process Items"

**Expected Results:**
- ✅ All deliveries are recorded
- ✅ Success message shows count
- ✅ Duplicate prevention works
- ✅ Date validation works

### Test 10.3: Bulk Record Outcomes
**Steps:**
1. Select an EBP
2. Click "Bulk Operations"
3. Select operation type "Record Outcomes"
4. Add multiple outcome items:
   ```json
   [
     {"patient_id": "patient1", "outcome_type": "Symptom Reduction", "outcome_value": "75", "measurement_date": "2024-01-15"},
     {"patient_id": "patient2", "outcome_type": "Symptom Reduction", "outcome_value": "80", "measurement_date": "2024-01-15"}
   ]
   ```
5. Click "Process Items"

**Expected Results:**
- ✅ All outcomes are recorded
- ✅ Success message shows count
- ✅ Outcome value validation works
- ✅ Duplicate prevention works

### Test 10.4: Bulk Operation Error Handling
**Steps:**
1. Select an EBP
2. Click "Bulk Operations"
3. Add items with invalid data (future dates, missing required fields)
4. Click "Process Items"

**Expected Results:**
- ✅ Valid items are processed
- ✅ Invalid items are skipped
- ✅ Error details are shown in console/logs
- ✅ Success message shows processed vs failed counts

---

## Test Suite 11: EBP Comparison

### Test 11.1: Select EBPs for Comparison
**Steps:**
1. Check checkboxes next to 2 or more EBPs
2. Verify selection indicator appears
3. Click "Compare Selected"

**Expected Results:**
- ✅ Comparison dialog opens
- ✅ Selected EBPs are displayed in comparison table
- ✅ All metrics are shown side by side

### Test 11.2: Comparison Table
**Steps:**
1. Select 3 EBPs
2. Click "Compare Selected"
3. Verify table structure

**Expected Results:**
- ✅ Table has columns for each selected EBP
- ✅ Rows show: Category, Adoption Rate, Fidelity Score, Sustainability Score, Total Staff, Trained Staff, Last Fidelity Review, Status
- ✅ Data is formatted correctly (percentages, dates)

### Test 11.3: Clear Selection
**Steps:**
1. Select multiple EBPs
2. Click "Clear Selection"

**Expected Results:**
- ✅ All checkboxes are unchecked
- ✅ Selection indicator disappears
- ✅ "Compare Selected" button is disabled

### Test 11.4: Comparison with Less Than 2 EBPs
**Steps:**
1. Select only 1 EBP
2. Try to click "Compare Selected"

**Expected Results:**
- ✅ Error message: "Please select at least 2 EBPs to compare"
- ✅ Comparison dialog does not open

---

## Test Suite 12: Metrics Calculation

### Test 12.1: Adoption Rate Calculation
**Steps:**
1. Create an EBP with total_staff = 10
2. Assign 5 staff members with status "trained" or "certified"
3. Verify adoption rate

**Expected Results:**
- ✅ Adoption rate = 50% (5/10 * 100)
- ✅ Metric updates automatically

### Test 12.2: Fidelity Score Calculation
**Steps:**
1. Create an EBP
2. Add fidelity assessments with scores: 80, 85, 90
3. Verify fidelity score

**Expected Results:**
- ✅ Fidelity score = 90 (latest assessment)
- ✅ Last fidelity review date is updated

### Test 12.3: Sustainability Score Calculation
**Steps:**
1. Create an EBP
2. Add multiple outcomes over time
3. Verify sustainability score

**Expected Results:**
- ✅ Sustainability score is calculated based on outcomes
- ✅ Score considers consistency and trends
- ✅ Score is between 0-100

---

## Test Suite 13: Integration Tests

### Test 13.1: Complete Workflow
**Steps:**
1. Create a new EBP
2. Assign staff members
3. Add fidelity assessments
4. Record patient deliveries
5. Record outcomes
6. View trends
7. Export report
8. Compare with another EBP

**Expected Results:**
- ✅ All operations complete successfully
- ✅ Metrics update correctly throughout
- ✅ No errors or data inconsistencies

### Test 13.2: Concurrent Operations
**Steps:**
1. Open multiple browser tabs
2. Perform operations on the same EBP in different tabs
3. Verify data consistency

**Expected Results:**
- ✅ No data conflicts
- ✅ Last write wins (or appropriate conflict resolution)
- ✅ Metrics remain consistent

---

## Test Suite 14: Error Handling

### Test 14.1: Network Error Handling
**Steps:**
1. Disconnect network
2. Try to create an EBP
3. Reconnect network
4. Retry operation

**Expected Results:**
- ✅ Error message is displayed
- ✅ Operation can be retried
- ✅ No data corruption

### Test 14.2: Invalid Data Handling
**Steps:**
1. Try to submit forms with missing required fields
2. Try to submit forms with invalid data types

**Expected Results:**
- ✅ Validation errors are displayed
- ✅ Forms do not submit
- ✅ User-friendly error messages

### Test 14.3: Database Error Handling
**Steps:**
1. Try operations when database is unavailable
2. Verify error messages

**Expected Results:**
- ✅ Appropriate error messages
- ✅ No application crashes
- ✅ User can retry operations

---

## Performance Tests

### Test P.1: Large Dataset Performance
**Steps:**
1. Create 100+ EBPs
2. Test pagination, search, and filtering
3. Verify response times

**Expected Results:**
- ✅ Pagination loads quickly (< 2 seconds)
- ✅ Search is responsive
- ✅ Filters apply quickly
- ✅ No UI freezing

### Test P.2: Trend Chart Performance
**Steps:**
1. Create EBP with 1000+ assessments/deliveries/outcomes
2. Load trend charts
3. Verify performance

**Expected Results:**
- ✅ Charts load in reasonable time (< 5 seconds)
- ✅ Data aggregation is efficient
- ✅ UI remains responsive

---

## Regression Tests

After any code changes, re-run:
- ✅ Test Suite 1 (Core CRUD)
- ✅ Test Suite 2 (Date Validation)
- ✅ Test Suite 3 (Duplicate Prevention)
- ✅ Test Suite 4 (Outcome Validation)
- ✅ Test Suite 8 (Export)
- ✅ Test Suite 12 (Metrics Calculation)

---

## Test Results Template

```
Test Suite: [Name]
Date: [Date]
Tester: [Name]

Test Case | Status | Notes
----------|--------|------
Test 1.1  | ✅/❌  | [Notes]
Test 1.2  | ✅/❌  | [Notes]
...

Overall Status: [Pass/Fail]
Issues Found: [List]
```

---

## Known Issues

- [List any known issues or limitations]

---

## Notes

- All date validations use UTC dates for consistency
- Metrics are recalculated automatically after related data changes
- Bulk operations process items sequentially to maintain data integrity
- Trend charts aggregate data by month for performance

