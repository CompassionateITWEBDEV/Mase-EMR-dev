# Discharge Summary Feature Guide

## Overview

The Behavioral Health EMR system includes a comprehensive **Discharge Summary** feature that allows providers to create, manage, and finalize detailed discharge documentation for patients transitioning out of care.

## Features

### 1. **Discharge Summary List** (`/discharge-summaries`)
- View all discharge summaries with filtering and search capabilities
- Filter by status: Draft, Pending Review, Finalized
- Search by patient name, provider, or diagnosis
- Statistics dashboard showing:
  - Total summaries
  - Draft summaries
  - Pending review summaries
  - Finalized summaries

### 2. **Create New Discharge Summary**
- Accessible via the "New Discharge Summary" button
- Select patient from dropdown
- Comprehensive form with the following sections:

#### **Admission & Discharge Information**
- Admission date
- Discharge date
- Length of stay (auto-calculated)
- Admission diagnosis
- Discharge diagnosis
- Diagnosis codes (ICD-10)
- Reason for admission

#### **Treatment Summary**
- Clinical course description
- Treatment summary
- Response to treatment
- Complications (if any)
- Medications at admission (JSONB array)
- Medications at discharge (JSONB array)
- Procedures performed (JSONB array)
- Therapies provided (JSONB array)

#### **Final Assessment**
- Discharge diagnosis
- Functional status
- Final mental status exam (JSONB)
- Final risk assessment (JSONB)

#### **Discharge Planning**
- Discharge disposition (e.g., home, facility, AMA)
- Discharge condition (e.g., improved, stable, unchanged)
- Follow-up appointments (JSONB array)
- Follow-up provider
- Follow-up date
- Referrals (JSONB array)
- Community resources (JSONB array)

#### **Discharge Instructions**
- General discharge instructions
- Medication instructions
- Activity restrictions
- Diet recommendations
- Warning signs to watch for
- Emergency contact information

#### **Aftercare Planning**
- Aftercare plan
- Support system notes
- Patient education provided
- Family involvement
- Barriers to discharge
- Special considerations

### 3. **View Discharge Summary** (`/discharge-summary/[id]`)
- Comprehensive read-only view of all discharge summary data
- Organized into clear sections with cards
- Print functionality for physical copies
- Export to PDF (coming soon)
- Edit button (only for non-finalized summaries)
- Status badge showing current state

### 4. **Edit Discharge Summary** (`/discharge-summary/[id]/edit`)
- Edit existing draft or pending review summaries
- Cannot edit finalized summaries
- All fields editable
- Save as draft or submit for review

### 5. **Status Workflow**
The discharge summary follows a three-stage workflow:

1. **Draft** - Initial creation, can be edited freely
2. **Pending Review** - Submitted for supervisor review
3. **Finalized** - Approved and locked, cannot be edited

When finalized:
- `finalized_at` timestamp is set
- `finalized_by` provider ID is recorded
- Summary becomes read-only

## Database Schema

The `discharge_summaries` table includes:

### Core Fields
- `id` (UUID) - Primary key
- `patient_id` (UUID) - Foreign key to patients
- `provider_id` (UUID) - Foreign key to providers
- `status` (text) - draft, pending-review, finalized
- `created_at`, `updated_at` (timestamps)
- `finalized_at` (timestamp)
- `finalized_by` (UUID) - Foreign key to providers

### Date Fields
- `admission_date` (date)
- `discharge_date` (date)
- `length_of_stay` (integer)
- `follow_up_date` (date)

### Text Fields
- `admission_diagnosis` (text)
- `discharge_diagnosis` (text)
- `reason_for_admission` (text)
- `clinical_course` (text)
- `treatment_summary` (text)
- `response_to_treatment` (text)
- `complications` (text)
- `discharge_condition` (text)
- `discharge_disposition` (text)
- `functional_status` (text)
- `aftercare_plan` (text)
- `discharge_instructions` (text)
- `medication_instructions` (text)
- `activity_restrictions` (text)
- `diet_recommendations` (text)
- `warning_signs` (text)
- `follow_up_provider` (text)
- `special_considerations` (text)
- `barriers_to_discharge` (text)
- `family_involvement` (text)
- `support_system_notes` (text)
- `patient_education_provided` (text)
- `emergency_contact_info` (text)

### Array Fields (text[])
- `diagnosis_codes` - ICD-10 codes

### JSONB Fields
- `medications_at_admission` - Array of medication objects
- `medications_at_discharge` - Array of medication objects
- `procedures_performed` - Array of procedure objects
- `therapies_provided` - Array of therapy objects
- `final_mental_status_exam` - Mental status exam data
- `final_risk_assessment` - Risk assessment data
- `follow_up_appointments` - Array of appointment objects
- `referrals` - Array of referral objects
- `community_resources` - Array of resource objects

## API Endpoints

### GET `/api/discharge-summary`
Fetches all discharge summaries with patient and provider information.

**Response:**
```json
[
  {
    "id": "uuid",
    "patient_id": "uuid",
    "patient_name": "John Doe",
    "provider_id": "uuid",
    "provider_name": "Dr. Smith",
    "status": "draft",
    "admission_date": "2025-01-01",
    "discharge_date": "2025-01-15",
    "length_of_stay": 14,
    ...
  }
]
```

### POST `/api/discharge-summary`
Creates a new discharge summary.

**Request Body:**
```json
{
  "patient_id": "uuid",
  "provider_id": "uuid",
  "admission_date": "2025-01-01",
  "discharge_date": "2025-01-15",
  "admission_diagnosis": "Major Depressive Disorder",
  "discharge_diagnosis": "Major Depressive Disorder, in remission",
  "status": "draft",
  ...
}
```

### GET `/api/discharge-summary/[id]`
Fetches a specific discharge summary by ID.

### PUT `/api/discharge-summary/[id]`
Updates an existing discharge summary.

### DELETE `/api/discharge-summary/[id]`
Deletes a discharge summary (only if not finalized).

## Components

### `CreateDischargeSummaryDialog`
Dialog component for creating a new discharge summary with patient selection.

**Props:**
- `providerId` (string) - Current provider's ID
- `patients` (array) - List of patients to choose from
- `children` (ReactNode) - Trigger button

### `ViewDischargeSummaryDialog`
Dialog component for viewing a discharge summary in a modal.

**Props:**
- `summary` (object) - Discharge summary data
- `children` (ReactNode) - Trigger button

### `DischargeSummaryForm`
Comprehensive form component for creating/editing discharge summaries.

**Props:**
- `existingSummary` (object, optional) - Existing summary data for editing
- `isEditing` (boolean) - Whether in edit mode

## Usage Examples

### Creating a New Discharge Summary

1. Navigate to `/discharge-summaries`
2. Click "New Discharge Summary" button
3. Select patient from dropdown
4. Fill in all required fields across the tabs
5. Click "Save as Draft" to save progress
6. Click "Submit for Review" when complete

### Viewing a Discharge Summary

1. Navigate to `/discharge-summaries`
2. Click "View" button on any summary
3. Review all sections
4. Click "Print" to print a physical copy
5. Click "Export PDF" to download (coming soon)

### Editing a Discharge Summary

1. Navigate to `/discharge-summaries`
2. Click "View" on a draft or pending review summary
3. Click "Edit" button
4. Make changes to any fields
5. Click "Save Changes" or "Submit for Review"

### Finalizing a Discharge Summary

1. Review the discharge summary thoroughly
2. Ensure all required fields are complete
3. Click "Finalize Summary" button
4. Confirm finalization
5. Summary is now locked and cannot be edited

## Integration with Other Features

### Patient Records
- Discharge summaries are linked to patient records
- Accessible from patient detail pages
- Included in patient history

### Provider Workflow
- Appears in provider work queue when pending review
- Counts toward productivity metrics
- Included in provider reports

### Compliance & Regulatory
- Discharge summaries are included in regulatory reports
- Audit trail tracks all changes
- Required for Joint Commission compliance

### Billing Integration
- Discharge summaries can trigger final billing
- Length of stay affects billing calculations
- Discharge disposition affects claim coding

## Best Practices

1. **Complete Documentation**: Fill in all relevant sections for comprehensive care transition
2. **Timely Completion**: Complete discharge summaries within 24-48 hours of discharge
3. **Clear Instructions**: Provide specific, actionable discharge instructions
4. **Follow-up Planning**: Always include follow-up appointments and provider information
5. **Medication Reconciliation**: Carefully document medication changes from admission to discharge
6. **Risk Assessment**: Document any ongoing risks or safety concerns
7. **Family Involvement**: Note family participation in discharge planning
8. **Community Resources**: Provide specific community resources and referrals

## Print Formatting

The discharge summary view includes print-optimized CSS:
- Hides navigation and action buttons
- Adjusts layout for paper size
- Includes header with patient and provider information
- Maintains professional formatting

## Future Enhancements

- [ ] PDF export functionality
- [ ] Electronic signature for finalization
- [ ] Template library for common discharge scenarios
- [ ] AI-assisted summary generation
- [ ] Integration with e-prescribing for medication lists
- [ ] Automated follow-up appointment scheduling
- [ ] Patient portal access to discharge instructions
- [ ] Multi-language support for patient instructions

## Troubleshooting

### Issue: Cannot create discharge summary
**Solution**: Ensure you have the correct provider role and permissions

### Issue: Cannot finalize summary
**Solution**: Verify all required fields are completed and you have supervisor permissions

### Issue: Print layout is incorrect
**Solution**: Use Chrome or Firefox for best print results, check print preview before printing

### Issue: Cannot edit finalized summary
**Solution**: Finalized summaries are locked. Contact administrator if changes are needed.

## Support

For technical support or feature requests related to discharge summaries, contact the EMR support team or submit a ticket through the help desk.
