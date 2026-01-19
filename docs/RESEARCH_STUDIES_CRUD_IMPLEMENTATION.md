# Research Studies CRUD Implementation

## Overview
Complete CRUD (Create, Read, Update, Delete) functionality has been implemented for Research Studies in the Research Dashboard.

## What Was Implemented

### 1. Database Schema
**File:** `scripts/create_research_studies_tables.sql`

- **`research_studies` table**: Stores all research study information
  - Basic info: title, description, study_type
  - PI information: name, email, phone
  - Timeline: start_date, end_date, enrollment_target, current_enrollment
  - Status: status, irb_status, irb_number, irb dates
  - Funding: funding_source, funding_amount, grant_number
  - Metadata: organization_id, created_by, timestamps

- **`research_study_participants` table**: Tracks patient enrollment
  - Links studies to patients
  - Tracks enrollment status, consent, withdrawal

- **Indexes**: Added for performance on organization_id, status, type, created_at
- **Triggers**: Auto-update `updated_at` timestamps
- **RLS Policies**: Row-level security enabled (currently permissive, adjust for production)

### 2. API Routes

#### GET `/api/research/studies`
- Lists all research studies with pagination
- Supports search (title, description, PI name)
- Supports filtering by status and type
- Returns participant counts for each study

**Query Parameters:**
- `search`: Search term
- `status`: Filter by status (all, planning, active, etc.)
- `type`: Filter by study type (all, implementation, pilot, etc.)
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 10)
- `organization_id`: Filter by organization

#### POST `/api/research/studies`
- Creates a new research study
- Validates all required fields
- Validates date ranges and enrollment targets
- Returns created study

**Request Body:**
```json
{
  "title": "Study Title",
  "description": "Study description",
  "study_type": "implementation",
  "pi_name": "Dr. John Doe",
  "pi_email": "john@example.com",
  "pi_phone": "(555) 123-4567",
  "start_date": "2025-01-01",
  "end_date": "2026-01-01",
  "enrollment_target": 100,
  "funding_source": "NIH",
  "irb_status": "pending"
}
```

#### GET `/api/research/studies/[id]`
- Gets a single study by ID
- Includes current enrollment count

#### PATCH `/api/research/studies/[id]`
- Updates an existing study
- Validates all fields
- Prevents invalid updates (e.g., enrollment target < current enrollment)

#### DELETE `/api/research/studies/[id]`
- Deletes a study if no enrolled participants
- Soft deletes (sets status to "cancelled") if participants exist

### 3. Frontend Integration

**File:** `app/research-dashboard/page.tsx`

**Features Implemented:**
- ✅ Real-time data fetching from API
- ✅ Loading states and error handling
- ✅ Search functionality with debouncing
- ✅ Filter by status and type
- ✅ Create new study form
- ✅ Edit existing study
- ✅ Delete study with confirmation
- ✅ Pagination support
- ✅ Real-time enrollment progress
- ✅ Overview metrics calculated from real data

**State Management:**
- `studies`: Array of research studies
- `loading`: Loading state
- `error`: Error messages
- `searchTerm`: Search input
- `statusFilter`: Status filter value
- `typeFilter`: Type filter value
- `formData`: Form state for create/edit
- `editingStudy`: Currently editing study (null for new)

## Setup Instructions

### 1. Run Database Migration

Execute the SQL script in your Supabase SQL Editor:

```bash
# Run this in Supabase SQL Editor
scripts/create_research_studies_tables.sql
```

### 2. Verify API Routes

The API routes are already created:
- `app/api/research/studies/route.ts`
- `app/api/research/studies/[id]/route.ts`

### 3. Test the Implementation

1. Navigate to `/research-dashboard`
2. Click on "Research Studies" tab
3. Click "New Study" to create a study
4. Fill in the form and submit
5. Verify the study appears in the list
6. Test search and filter functionality
7. Test edit and delete operations

## API Usage Examples

### Create a Study
```typescript
const response = await fetch('/api/research/studies', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    title: 'My Research Study',
    study_type: 'implementation',
    pi_name: 'Dr. Jane Smith',
    start_date: '2025-01-01',
    end_date: '2026-01-01',
    enrollment_target: 100,
    irb_status: 'pending'
  })
})
```

### Get Studies with Filters
```typescript
const response = await fetch('/api/research/studies?status=active&type=implementation&search=contingency')
const data = await response.json()
```

### Update a Study
```typescript
const response = await fetch(`/api/research/studies/${studyId}`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    status: 'active',
    current_enrollment: 50
  })
})
```

### Delete a Study
```typescript
const response = await fetch(`/api/research/studies/${studyId}`, {
  method: 'DELETE'
})
```

## Validation Rules

### Required Fields
- title (3-500 characters)
- study_type (enum: implementation, pilot, quality_improvement, outcomes, equity)
- pi_name (2-200 characters)
- start_date (valid date)
- end_date (valid date, must be >= start_date)
- enrollment_target (integer > 0)

### Optional Fields
- description (max 5000 characters)
- pi_email, pi_phone
- funding_source, funding_amount, grant_number
- irb_status, irb_number, irb dates

### Business Rules
- End date must be after start date
- Enrollment target must be >= current enrollment
- Cannot hard delete study with enrolled participants (soft delete instead)

## Error Handling

All API routes include comprehensive error handling:
- 400: Validation errors
- 404: Study not found
- 500: Server errors

Frontend displays errors in user-friendly format with retry options.

## Security Considerations

1. **Row Level Security**: RLS is enabled but currently permissive. Update policies for production:
   ```sql
   -- Example: Restrict to organization
   CREATE POLICY "Users can view studies from their organization"
     ON research_studies FOR SELECT
     USING (organization_id = current_setting('app.current_organization_id')::uuid);
   ```

2. **Input Validation**: All inputs are validated on both client and server

3. **SQL Injection**: Supabase client handles parameterization automatically

## Next Steps

1. **Authentication Integration**: Add organization_id and user_id from auth session
2. **Participant Enrollment**: Implement enrollment API endpoint
3. **Permissions**: Add role-based access control
4. **Audit Logging**: Track all CRUD operations
5. **Export Functionality**: Implement data export for studies
6. **Notifications**: Add alerts for study milestones

## Troubleshooting

### Studies not loading
- Check browser console for errors
- Verify database tables exist
- Check API route logs
- Verify Supabase connection

### Create/Update failing
- Check validation errors in response
- Verify all required fields are provided
- Check date format (YYYY-MM-DD)
- Verify enrollment_target is a positive integer

### Delete not working
- Check if study has enrolled participants
- Verify study exists
- Check API response for error message

## Files Modified/Created

**Created:**
- `scripts/create_research_studies_tables.sql`
- `app/api/research/studies/route.ts`
- `app/api/research/studies/[id]/route.ts`
- `docs/RESEARCH_STUDIES_CRUD_IMPLEMENTATION.md`

**Modified:**
- `app/research-dashboard/page.tsx`

## Testing Checklist

- [x] Create new study
- [x] List all studies
- [x] Search studies
- [x] Filter by status
- [x] Filter by type
- [x] Edit study
- [x] Delete study (no participants)
- [x] Delete study (with participants - soft delete)
- [x] Pagination
- [x] Error handling
- [x] Loading states
- [x] Form validation

