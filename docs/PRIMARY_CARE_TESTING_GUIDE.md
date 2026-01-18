# Primary Care Functionality Testing Guide

This comprehensive guide covers testing procedures for the new Primary Care features implemented during the Next.js 16 upgrade session. The guide is designed for both technical QA testers and non-technical stakeholders.

---

## Table of Contents

1. [Setup Instructions](#1-setup-instructions)
2. [Test Data Preparation](#2-test-data-preparation)
3. [Manual Testing Steps](#3-manual-testing-steps)
4. [Automated Testing](#4-automated-testing)
5. [API Testing](#5-api-testing)
6. [Troubleshooting](#6-troubleshooting)

---

## 1. Setup Instructions

### 1.1 Prerequisites

Before testing, ensure you have:

- Node.js 18+ installed
- pnpm package manager installed (`npm install -g pnpm`)
- Access to the Supabase database (development or staging)
- A web browser with developer tools (Chrome, Firefox, or Edge recommended)

### 1.2 Starting the Development Server

1. Open a terminal in the project root directory
2. Install dependencies (if not already done):
   ```bash
   pnpm install
   ```
3. Start the development server:
   ```bash
   pnpm dev
   ```
4. Wait for the message: `Ready in X seconds`
5. Open your browser to: **http://localhost:3000**

### 1.3 Accessing the Primary Care Dashboard

1. Navigate to: **http://localhost:3000/primary-care-dashboard**
2. Or use the sidebar navigation:
   - Click "Specialties" in the main menu
   - Select "Primary Care" from the specialty list

### 1.4 Accessing the Specialty Configuration Page

1. Navigate to: **http://localhost:3000/specialty/primary-care**
2. This page shows the specialty-specific settings and features

---

## 2. Test Data Preparation

### 2.1 Database Migrations

Run the following SQL scripts in order using Supabase SQL Editor or `psql`:

```bash
# 1. Specialty billing codes (CPT codes for Primary Care)
psql -f scripts/013_specialty_billing_codes.sql

# 2. Clinical alerts table
psql -f scripts/014_clinical_alerts_table.sql

# 3. Specialty constraints
psql -f scripts/015_add_specialty_constraints.sql
```

### 2.2 Seed Primary Care Data

Run these seed scripts to populate test data:

```bash
# Seed Primary Care CPT codes (billing codes)
psql -f scripts/seed_primary_care_cpt_codes.sql

# Seed Primary Care specialty features and configuration
psql -f scripts/seed_primary_care_specialty_features.sql
```

### 2.3 Using Supabase Dashboard

Alternatively, run the scripts via Supabase Dashboard:

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy/paste the content of each script
5. Click **Run** to execute

### 2.4 Sample Test Data

After running seed scripts, you should have:

| Data Type          | Records         | Purpose                                         |
| ------------------ | --------------- | ----------------------------------------------- |
| CPT Codes          | 50+             | Primary Care billing codes (99213, 99214, etc.) |
| Specialty Features | 15+             | Feature flags for Primary Care                  |
| Clinical Alerts    | Sample alerts   | Test alert display and acknowledgment           |
| Appointments       | Sample schedule | Test schedule display                           |

---

## 3. Manual Testing Steps

### 3.1 Appointment Scheduling Features

#### Viewing Today's Schedule

1. Navigate to **Primary Care Dashboard** (`/primary-care-dashboard`)
2. Look for the "Today's Schedule" section
3. **Expected Result**:
   - Schedule displays appointment cards with patient names
   - Each card shows time, patient name, appointment type
   - Status badges show "Scheduled", "In Progress", "Completed"

#### Creating a New Appointment

1. Click the **"New Appointment"** button (if available)
2. Select a patient from the dropdown
3. Choose a date and time
4. Select appointment type (e.g., "Annual Physical", "Follow-up")
5. Click **Save**
6. **Expected Result**:
   - Success notification appears
   - New appointment shows in the schedule
   - Page refreshes automatically (React Query invalidation)

#### Updating an Appointment

1. Click on an existing appointment card
2. Modify the time, type, or notes
3. Click **Update**
4. **Expected Result**:
   - Changes are saved
   - Schedule updates to reflect changes

### 3.2 Clinical Alerts System

#### Viewing Clinical Alerts

1. Navigate to **Primary Care Dashboard**
2. Locate the "Clinical Alerts" panel (usually in sidebar or header area)
3. **Expected Result**:
   - Alerts display with color-coded priority badges
   - High priority = Red/Destructive
   - Medium priority = Yellow/Warning
   - Low priority = Blue/Info
   - Unacknowledged count badge shows total pending alerts

#### Acknowledging an Alert

1. Find an unacknowledged alert (no checkmark)
2. Click the **"Acknowledge"** button or checkmark icon
3. **Expected Result**:
   - Alert is marked as acknowledged
   - Unacknowledged count decreases
   - Alert may move to "Acknowledged" section

#### Alert Priority Filtering

1. Use priority filter dropdown (if available)
2. Select "High Priority Only"
3. **Expected Result**:
   - Only high-priority alerts are displayed
   - Count updates to show filtered total

### 3.3 AI-Powered Assistant

#### Drug Interaction Checking

1. Navigate to a patient's chart or the Primary Care Dashboard
2. Find the **"AI Assistant"** or **"Drug Interactions"** section
3. Click **"Check Drug Interactions"**
4. **Expected Result**:
   - Loading indicator appears briefly
   - Results show list of current medications
   - Any interactions are highlighted with severity levels
   - Recommendations are displayed for concerning combinations

#### AI Clinical Recommendations

1. Open a patient encounter
2. Look for the **"AI Recommendations"** panel
3. Click **"Get Recommendations"** or wait for auto-load
4. **Expected Result**:
   - AI generates clinical recommendations based on:
     - Patient demographics
     - Current medications
     - Recent lab results
     - Preventive care gaps
   - Recommendations are categorized by urgency

### 3.4 Specialty Configuration System

#### Viewing Primary Care Settings

1. Navigate to **Specialty Page** (`/specialty/primary-care`)
2. Review the configuration panels:
   - Enabled features list
   - Default visit duration
   - Quality measure settings
3. **Expected Result**:
   - Page shows Primary Care specialty configuration
   - Feature toggles show current enabled/disabled state
   - Settings reflect database values

#### Enabling/Disabling Features

1. Find a feature toggle (e.g., "AI Recommendations")
2. Click to toggle the setting
3. **Expected Result**:
   - Toggle state changes visually
   - Success notification appears
   - Feature becomes available/unavailable in dashboard

### 3.5 Quality Measures

1. Navigate to Primary Care Dashboard
2. Find the "Quality Measures" or "Care Gaps" section
3. **Expected Result**:
   - List of quality measures with compliance percentages
   - Color-coded indicators (green = good, yellow = needs attention, red = critical)
   - Click on a measure to see patient-level details

---

## 4. Automated Testing

### 4.1 Running All Tests

Execute the complete test suite:

```bash
pnpm test:run
```

**Expected Output**:

```
 ✓ __tests__/api/appointments.test.ts (4 tests)
 ✓ __tests__/api/clinical-alerts.test.ts (5 tests)
 ✓ __tests__/api/ai-assistant.test.ts (6 tests)
 ✓ __tests__/hooks/use-appointments.test.tsx (4 tests)
 ✓ __tests__/hooks/use-clinical-alerts.test.tsx (5 tests)
 ...

 Test Files  XX passed
 Tests       XX passed
```

### 4.2 Running Specific Test Files

Test only Primary Care features:

```bash
# Appointments API tests
pnpm test:run __tests__/api/appointments.test.ts

# Clinical Alerts API tests
pnpm test:run __tests__/api/clinical-alerts.test.ts

# AI Assistant tests
pnpm test:run __tests__/api/ai-assistant.test.ts

# Drug Interactions tests
pnpm test:run __tests__/api/drug-interactions.test.ts

# All Primary Care hook tests
pnpm test:run __tests__/hooks/use-appointments.test.tsx
pnpm test:run __tests__/hooks/use-clinical-alerts.test.tsx
pnpm test:run __tests__/hooks/use-ai-assistant.test.tsx
pnpm test:run __tests__/hooks/use-quality-measures.test.tsx
pnpm test:run __tests__/hooks/use-specialty-config.test.tsx

# Component tests
pnpm test:run __tests__/components/primary-care/primary-care-dashboard.test.tsx
pnpm test:run __tests__/components/specialty/specialty-page.test.tsx
```

### 4.3 Running Tests in Watch Mode

For development, use watch mode to re-run tests on file changes:

```bash
pnpm test
```

Press `q` to quit watch mode.

### 4.4 Generating Coverage Reports

Generate detailed test coverage:

```bash
pnpm test:coverage
```

**Output Location**: `coverage/index.html`

Open in browser to see:

- Line coverage percentage
- Branch coverage
- Uncovered lines highlighted
- File-by-file breakdown

### 4.5 Interpreting Test Results

| Symbol        | Meaning        |
| ------------- | -------------- |
| ✓             | Test passed    |
| ✗             | Test failed    |
| ○             | Test skipped   |
| Duration (ms) | Execution time |

**If tests fail:**

1. Read the error message carefully
2. Check the "Expected" vs "Received" values
3. Verify database/mock data is set up correctly
4. Ensure environment variables are configured

---

## 5. API Testing

### 5.1 Testing with Browser Developer Console

Open Developer Tools (F12) and use the Console tab:

#### Fetch Appointments

```javascript
// Get today's appointments
fetch("/api/appointments?date=2025-01-15")
  .then((r) => r.json())
  .then(console.log);

// Get appointments summary
fetch("/api/appointments?summary=true")
  .then((r) => r.json())
  .then(console.log);
```

#### Fetch Clinical Alerts

```javascript
// Get all alerts
fetch("/api/clinical-alerts")
  .then((r) => r.json())
  .then(console.log);

// Get unacknowledged alerts only
fetch("/api/clinical-alerts?acknowledged=false")
  .then((r) => r.json())
  .then(console.log);

// Get high priority alerts
fetch("/api/clinical-alerts?priority=high")
  .then((r) => r.json())
  .then(console.log);
```

#### Test AI Assistant

```javascript
// Get AI recommendations for a patient
fetch("/api/ai-assistant?patientId=YOUR_PATIENT_UUID")
  .then((r) => r.json())
  .then(console.log);

// Check drug interactions
fetch("/api/ai-assistant/drug-interactions?patientId=YOUR_PATIENT_UUID")
  .then((r) => r.json())
  .then(console.log);
```

### 5.2 Testing with curl (Command Line)

#### Appointments

```bash
# GET - Fetch appointments
curl http://localhost:3000/api/appointments

# GET - Fetch with date filter
curl "http://localhost:3000/api/appointments?date=2025-01-15"

# POST - Create appointment
curl -X POST http://localhost:3000/api/appointments \
  -H "Content-Type: application/json" \
  -d '{"patient_id":"uuid-here","appointment_date":"2025-01-15T10:00:00","appointment_type":"follow-up"}'
```

#### Clinical Alerts

```bash
# GET - Fetch all alerts
curl http://localhost:3000/api/clinical-alerts

# POST - Create alert
curl -X POST http://localhost:3000/api/clinical-alerts \
  -H "Content-Type: application/json" \
  -d '{"patient_id":"uuid-here","message":"Lab results require attention","priority":"high"}'

# POST - Acknowledge alert
curl -X POST http://localhost:3000/api/clinical-alerts/ALERT_ID/acknowledge
```

#### Specialty Configuration

```bash
# GET - Fetch specialty config
curl "http://localhost:3000/api/specialty-config?specialtyId=primary-care"
```

### 5.3 Testing with Postman

1. Import the following collection or create manually:

**Collection: MASE Primary Care API**

| Request Name            | Method | URL                                                                      |
| ----------------------- | ------ | ------------------------------------------------------------------------ |
| Get Appointments        | GET    | `{{baseUrl}}/api/appointments`                                           |
| Get Appointment by ID   | GET    | `{{baseUrl}}/api/appointments/{{appointmentId}}`                         |
| Create Appointment      | POST   | `{{baseUrl}}/api/appointments`                                           |
| Get Clinical Alerts     | GET    | `{{baseUrl}}/api/clinical-alerts`                                        |
| Acknowledge Alert       | POST   | `{{baseUrl}}/api/clinical-alerts/{{alertId}}/acknowledge`                |
| Get AI Recommendations  | GET    | `{{baseUrl}}/api/ai-assistant?patientId={{patientId}}`                   |
| Check Drug Interactions | GET    | `{{baseUrl}}/api/ai-assistant/drug-interactions?patientId={{patientId}}` |

2. Set environment variable: `baseUrl = http://localhost:3000`

### 5.4 Expected API Responses

#### Appointments Response

```json
{
  "appointments": [
    {
      "id": "uuid",
      "patient_id": "uuid",
      "appointment_date": "2025-01-15T10:00:00Z",
      "appointment_type": "follow-up",
      "status": "scheduled",
      "patients": { "first_name": "John", "last_name": "Doe" },
      "providers": { "first_name": "Dr.", "last_name": "Smith" }
    }
  ],
  "pagination": { "page": 1, "pageSize": 50, "total": 1 }
}
```

#### Clinical Alerts Response

```json
{
  "alerts": [
    {
      "patient": "John Doe",
      "patientId": "uuid",
      "message": "A1C result elevated at 7.8%",
      "priority": "high",
      "type": "warning",
      "time": "2 hours ago",
      "isAcknowledged": false
    }
  ],
  "count": { "total": 5, "unacknowledged": 3 }
}
```

---

## 6. Troubleshooting

### 6.1 Common Issues

#### Development Server Won't Start

**Symptom**: `pnpm dev` fails with errors

**Solutions**:

1. Delete `node_modules` and reinstall:
   ```bash
   rm -rf node_modules
   pnpm install
   ```
2. Check Node.js version: `node --version` (should be 18+)
3. Check for port conflicts: ensure port 3000 is free

#### Database Connection Errors

**Symptom**: "Failed to fetch" or "Database error" in console

**Solutions**:

1. Verify `.env.local` contains correct Supabase credentials:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
2. Check Supabase project status in dashboard
3. Ensure database migrations have been run

#### Tests Failing

**Symptom**: `pnpm test:run` shows failures

**Solutions**:

1. Clear test cache: `pnpm test:run --clearCache`
2. Check mock data in `__tests__/utils/mock-data.ts`
3. Ensure all dependencies are installed

#### Empty Data on Dashboard

**Symptom**: Dashboard shows no appointments/alerts

**Solutions**:

1. Run seed scripts (see Section 2)
2. Check browser console for API errors
3. Verify user authentication status

#### React Query Not Updating

**Symptom**: Data doesn't refresh after changes

**Solutions**:

1. Open React Query DevTools (if installed)
2. Check query invalidation in hook code
3. Try hard refresh: `Ctrl+Shift+R`

### 6.2 Debugging Tips

#### Enable Verbose Logging

Add to browser console:

```javascript
localStorage.setItem("debug", "true");
```

#### Check API Response

1. Open Network tab in Developer Tools
2. Filter by "XHR" or "Fetch"
3. Click on API request to see response

#### Verify Database State

Use Supabase Dashboard:

1. Go to **Table Editor**
2. Check `appointments`, `clinical_alerts` tables
3. Verify data exists and is correct

### 6.3 Getting Help

If issues persist:

1. Check the console for error messages
2. Review recent git commits for changes
3. Consult the Primary Care Refactoring Analysis: `docs/PRIMARY_CARE_REFACTORING_ANALYSIS.md`
4. Contact the development team with:
   - Error message
   - Steps to reproduce
   - Browser/OS information

---

## Appendix: Test File Reference

| Test File                                                           | Purpose                   |
| ------------------------------------------------------------------- | ------------------------- |
| `__tests__/api/appointments.test.ts`                                | Appointments API GET/POST |
| `__tests__/api/appointments-id.test.ts`                             | Single appointment CRUD   |
| `__tests__/api/clinical-alerts.test.ts`                             | Clinical alerts API       |
| `__tests__/api/clinical-alerts-acknowledge.test.ts`                 | Alert acknowledgment      |
| `__tests__/api/ai-assistant.test.ts`                                | AI recommendations API    |
| `__tests__/api/drug-interactions.test.ts`                           | Drug interaction checking |
| `__tests__/hooks/use-appointments.test.tsx`                         | Appointments React hook   |
| `__tests__/hooks/use-clinical-alerts.test.tsx`                      | Clinical alerts hook      |
| `__tests__/hooks/use-ai-assistant.test.tsx`                         | AI assistant hook         |
| `__tests__/hooks/use-quality-measures.test.tsx`                     | Quality measures hook     |
| `__tests__/hooks/use-specialty-config.test.tsx`                     | Specialty config hook     |
| `__tests__/components/primary-care/primary-care-dashboard.test.tsx` | Dashboard component       |
| `__tests__/components/specialty/specialty-page.test.tsx`            | Specialty page component  |

---

_Document generated: 2025-12-29_
_Version: 1.0_
_Related: Next.js 16 Upgrade and Primary Care Refactoring_
