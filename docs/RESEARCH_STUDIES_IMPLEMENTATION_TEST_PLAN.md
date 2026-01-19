# Research Studies Implementation - Comprehensive Test Plan

## Implementation Summary

All three phases have been implemented:

### Phase 1: Participant Status Management ✅
- PATCH endpoint: `/api/research/studies/[id]/participants/[participantId]`
- UI dialog for status updates (withdraw, complete, lost to follow-up)
- Withdrawal reason form with validation
- Status change buttons in participant lists

### Phase 2: Enhanced Features ✅
- Participant detail dialog with full information
- File upload for consent documents
- Patient information display in detail view

### Phase 3: Advanced Features ✅
- Audit trail system with logging
- Notifications/alerts system (IRB expiration, enrollment targets)
- Study status automation
- Advanced analytics and reporting

---

## Testing Checklist

### Phase 1: Participant Status Management

#### API Testing
- [ ] **PATCH /api/research/studies/[id]/participants/[participantId]**
  - [ ] Update status to "withdrawn" with date and reason
  - [ ] Update status to "completed"
  - [ ] Update status to "lost_to_followup"
  - [ ] Update status back to "enrolled"
  - [ ] Validation: withdrawal requires date and reason
  - [ ] Validation: invalid status rejected
  - [ ] Enrollment count updates correctly after status change
  - [ ] Audit trail logged for status changes

- [ ] **GET /api/research/studies/[id]/participants/[participantId]**
  - [ ] Returns participant with patient information
  - [ ] Returns 404 for non-existent participant
  - [ ] Returns 400 for missing IDs

- [ ] **DELETE /api/research/studies/[id]/participants/[participantId]**
  - [ ] Soft deletes by setting status to withdrawn
  - [ ] Enrollment count decreases
  - [ ] Audit trail logged

#### UI Testing
- [ ] **Participant Status Dialog**
  - [ ] Opens when clicking edit button on participant
  - [ ] Shows current status
  - [ ] Shows withdrawal fields when status is "withdrawn"
  - [ ] Validates withdrawal date and reason
  - [ ] Updates status successfully
  - [ ] Shows error messages for validation failures
  - [ ] Refreshes participant list after update

- [ ] **Participant List Actions**
  - [ ] View button opens detail dialog
  - [ ] Edit button opens status dialog
  - [ ] Buttons visible in both View Details and Data Dashboard dialogs

### Phase 2: Enhanced Features

#### File Upload Testing
- [ ] **File Upload API**
  - [ ] Uploads PDF files successfully
  - [ ] Uploads image files (JPEG, PNG)
  - [ ] Rejects invalid file types
  - [ ] Rejects files over 10MB
  - [ ] Returns public URL after upload
  - [ ] Handles missing bucket gracefully

- [ ] **File Upload UI**
  - [ ] File input accepts correct file types
  - [ ] Shows upload progress
  - [ ] Shows success message
  - [ ] Updates consent_document_url in form
  - [ ] Allows manual URL entry as fallback
  - [ ] Displays uploaded document link

#### Participant Detail Dialog
- [ ] **Detail View**
  - [ ] Opens when clicking view button
  - [ ] Shows patient information (name, DOB, phone, email)
  - [ ] Shows enrollment information (status, dates)
  - [ ] Shows consent information
  - [ ] Shows withdrawal information if applicable
  - [ ] Shows metadata (created/updated dates)
  - [ ] "Update Status" button works
  - [ ] Handles loading state

### Phase 3: Advanced Features

#### Audit Trail Testing
- [ ] **Audit Logging**
  - [ ] Study creation logged
  - [ ] Study update logged with changed fields
  - [ ] Study deletion logged
  - [ ] Participant enrollment logged
  - [ ] Participant status change logged
  - [ ] Audit log includes user ID
  - [ ] Audit log includes old/new values
  - [ ] Audit log includes change description

- [ ] **Audit Trail API**
  - [ ] GET /api/research/studies/[id]/audit returns logs
  - [ ] Logs ordered by date (newest first)
  - [ ] Returns empty array if no logs

#### Notifications Testing
- [ ] **Notification System**
  - [ ] Detects IRB expiration (within 30 days)
  - [ ] Detects IRB expired
  - [ ] Detects enrollment at 90%+ of target
  - [ ] Detects enrollment at 100%
  - [ ] Detects study should be activated (start date passed)
  - [ ] Detects study should be ended (end date passed)
  - [ ] Detects study ending soon (within 30 days)
  - [ ] Notifications sorted by severity
  - [ ] Notification panel shows/hides correctly
  - [ ] "View Study" button works from notifications

- [ ] **Notifications API**
  - [ ] GET /api/research/notifications returns all notifications
  - [ ] Returns correct notification types
  - [ ] Returns correct severity levels
  - [ ] Returns action_required flags

#### Automation Testing
- [ ] **Status Automation**
  - [ ] Planning → Active when start date passed
  - [ ] Active/Data Collection → Analysis when end date passed
  - [ ] Does not change status if dates not met
  - [ ] Logs audit trail for automated changes
  - [ ] Returns list of changes made

- [ ] **Automation API**
  - [ ] POST /api/research/automate runs automation
  - [ ] GET /api/research/automate shows what would change (dry run)
  - [ ] Returns count of updates
  - [ ] Returns list of changes

#### Analytics Testing
- [ ] **Analytics API**
  - [ ] GET /api/research/analytics returns overview stats
  - [ ] Returns enrollment trends (12 months)
  - [ ] Returns status distribution
  - [ ] Returns enrollment by month
  - [ ] Returns consent rates by study
  - [ ] Filters by studyId when provided
  - [ ] Handles empty data gracefully

- [ ] **Analytics UI**
  - [ ] Analytics data displayed in dashboard
  - [ ] Charts render correctly (if implemented)
  - [ ] Consent rate shown in data dashboard

---

## Integration Testing

### End-to-End Workflows

#### Workflow 1: Complete Participant Lifecycle
1. [ ] Create a study
2. [ ] Enroll a patient (with consent document upload)
3. [ ] View participant details
4. [ ] Update participant status to "withdrawn" (with reason)
5. [ ] Verify enrollment count decreased
6. [ ] Verify audit trail logged all actions
7. [ ] Update status back to "enrolled"
8. [ ] Verify enrollment count increased

#### Workflow 2: Study Status Automation
1. [ ] Create study with start_date = today - 1 day, status = "planning"
2. [ ] Run automation
3. [ ] Verify status changed to "active"
4. [ ] Verify audit trail logged
5. [ ] Create study with end_date = today - 1 day, status = "active"
6. [ ] Run automation
7. [ ] Verify status changed to "analysis"

#### Workflow 3: Notifications
1. [ ] Create study with IRB expiration = today + 15 days
2. [ ] Verify notification appears
3. [ ] Create study with enrollment at 95% of target
4. [ ] Verify notification appears
5. [ ] Create study with start_date = today - 1 day, status = "planning"
6. [ ] Verify notification appears

#### Workflow 4: File Upload
1. [ ] Select file in enrollment dialog
2. [ ] Verify upload progress shown
3. [ ] Verify success message
4. [ ] Verify URL populated in form
5. [ ] Complete enrollment
6. [ ] Verify document URL saved in database
7. [ ] View participant detail
8. [ ] Verify document link works

---

## Technical Validation

### Database
- [ ] Audit trail table created (`research_study_audit_log`)
- [ ] Foreign keys work correctly
- [ ] Triggers update enrollment counts
- [ ] Indexes exist for performance

### API Endpoints
- [ ] All endpoints return proper HTTP status codes
- [ ] Error messages are user-friendly
- [ ] Validation works correctly
- [ ] Authentication/authorization (if implemented)

### UI Components
- [ ] All dialogs open/close correctly
- [ ] Forms validate input
- [ ] Loading states show during API calls
- [ ] Error messages display correctly
- [ ] Success messages display correctly
- [ ] Data refreshes after mutations

### Data Integrity
- [ ] Enrollment counts match actual enrolled participants
- [ ] Status changes update counts correctly
- [ ] Dates validated correctly
- [ ] Foreign key constraints enforced

---

## Edge Cases

- [ ] Update participant status multiple times rapidly
- [ ] Upload very large file (should reject)
- [ ] Upload invalid file type (should reject)
- [ ] Update status without required fields (should validate)
- [ ] Run automation on study with no date changes
- [ ] Get notifications when no studies exist
- [ ] Get analytics when no data exists
- [ ] View participant detail for non-existent participant
- [ ] Update participant status for non-existent participant
- [ ] Delete participant that doesn't exist

---

## Performance Testing

- [ ] Load study with 100+ participants (list performance)
- [ ] Fetch notifications with 50+ studies
- [ ] Run analytics on large dataset
- [ ] Upload large file (up to 10MB limit)

---

## Security Testing

- [ ] Cannot update participant from different study
- [ ] Cannot access audit logs without proper permissions
- [ ] File upload validates file types
- [ ] File upload validates file size
- [ ] SQL injection protection (parameterized queries)

---

## Browser Compatibility

- [ ] Chrome/Edge
- [ ] Firefox
- [ ] Safari
- [ ] Mobile browsers (if applicable)

---

## Test Execution Instructions

1. **Setup**
   - Ensure database tables are created (run migration script)
   - Ensure Supabase Storage bucket "research-consents" exists
   - Create test studies with various statuses and dates
   - Create test participants

2. **Run Tests**
   - Test each feature systematically
   - Document any issues found
   - Verify fixes

3. **Regression Testing**
   - Ensure existing features still work
   - Test backward compatibility

---

## Known Issues / Notes

- File upload requires Supabase Storage bucket "research-consents" to be created manually
- Automation should be run via cron job for production (currently manual)
- Notifications refresh on page load (could be real-time with WebSockets)

---

## Success Criteria

✅ All Phase 1 features work correctly
✅ All Phase 2 features work correctly
✅ All Phase 3 features work correctly
✅ No critical bugs
✅ All edge cases handled
✅ Performance acceptable
✅ Security validated

---

## Test Results Template

```
Feature: [Feature Name]
Status: [PASS/FAIL]
Issues: [List any issues]
Notes: [Additional notes]
```

