# Research Studies Automation Setup Guide

This guide explains how to set up automatic status updates for research studies without requiring manual clicks.

## Current Manual Approach

Currently, automation runs when you click "Run Automation" button. This requires manual intervention.

## Automated Approaches (Recommended)

### Option 1: Vercel Cron Jobs (Best for Vercel Deployments)

If you're deploying to Vercel, this is the easiest option.

**Setup:**
1. The `vercel.json` file is already configured
2. Deploy to Vercel
3. Automation will run daily at 2:00 AM UTC

**Schedule:** Daily at 2:00 AM UTC (configurable in `vercel.json`)

**Benefits:**
- ✅ No additional services needed
- ✅ Free on Vercel Pro plan
- ✅ Automatic execution
- ✅ Built-in monitoring

**To change schedule:**
Edit `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/research-automation",
      "schedule": "0 2 * * *"  // Change this (cron format)
    }
  ]
}
```

Common schedules:
- `0 2 * * *` - Daily at 2 AM UTC
- `0 */6 * * *` - Every 6 hours
- `0 9 * * 1-5` - Weekdays at 9 AM UTC
- `*/30 * * * *` - Every 30 minutes

---

### Option 2: External Cron Service (Works with Any Hosting)

Use a free cron service to call your API endpoint automatically.

**Recommended Services:**
- **cron-job.org** (Free)
- **EasyCron** (Free tier available)
- **Cronitor** (Free tier available)
- **GitHub Actions** (Free for public repos)

**Setup Steps:**

1. **Get your API endpoint URL:**
   ```
   https://your-domain.com/api/cron/research-automation
   ```

2. **Set up CRON_SECRET (optional but recommended):**
   Add to your `.env` file:
   ```
   CRON_SECRET=your-secret-token-here
   ```

3. **Configure cron service:**
   - URL: `https://your-domain.com/api/cron/research-automation`
   - Method: GET or POST
   - Schedule: Daily (or as needed)
   - Headers (if using CRON_SECRET):
     ```
     Authorization: Bearer your-secret-token-here
     ```

**Example with cron-job.org:**
1. Sign up at cron-job.org
2. Create new cron job
3. URL: `https://your-domain.com/api/cron/research-automation`
4. Schedule: Daily at 2:00 AM
5. Save

---

### Option 3: Database Triggers (Most Reliable)

This runs at the database level, so it's always active.

**Pros:**
- ✅ Always running
- ✅ No external dependencies
- ✅ Immediate updates
- ✅ Works regardless of hosting

**Cons:**
- ⚠️ More complex to set up
- ⚠️ Requires database access

**Setup:**
Run this SQL in Supabase SQL Editor:

```sql
-- Function to check and update study statuses
CREATE OR REPLACE FUNCTION check_and_update_study_statuses()
RETURNS void AS $$
DECLARE
  study_record RECORD;
  today_date DATE;
BEGIN
  today_date := CURRENT_DATE;
  
  -- Update study statuses
  FOR study_record IN 
    SELECT * FROM research_studies 
    WHERE status IN ('planning', 'active', 'data_collection')
  LOOP
    -- Planning -> Active
    IF study_record.status = 'planning' AND today_date >= study_record.start_date THEN
      UPDATE research_studies 
      SET status = 'active', updated_at = NOW()
      WHERE id = study_record.id;
    END IF;
    
    -- Active/Data Collection -> Analysis
    IF study_record.status IN ('active', 'data_collection') AND today_date > study_record.end_date THEN
      UPDATE research_studies 
      SET status = 'analysis', updated_at = NOW()
      WHERE id = study_record.id;
    END IF;
  END LOOP;
  
  -- Update IRB statuses
  FOR study_record IN 
    SELECT * FROM research_studies 
    WHERE irb_status = 'approved' AND irb_expiration_date IS NOT NULL
  LOOP
    IF today_date > study_record.irb_expiration_date THEN
      UPDATE research_studies 
      SET irb_status = 'expired', updated_at = NOW()
      WHERE id = study_record.id;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Create a scheduled job (requires pg_cron extension)
-- Note: This may not be available on all Supabase plans
-- If not available, use Option 1 or 2 instead

-- Enable pg_cron extension (if available)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule the function to run daily at 2 AM
SELECT cron.schedule(
  'update-research-study-statuses',
  '0 2 * * *',
  $$SELECT check_and_update_study_statuses()$$
);
```

**Note:** pg_cron may not be available on all Supabase plans. If not available, use Option 1 or 2.

---

### Option 4: GitHub Actions (For GitHub Deployments)

If your code is on GitHub, you can use GitHub Actions.

**Create `.github/workflows/research-automation.yml`:**

```yaml
name: Research Studies Automation

on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC
  workflow_dispatch:  # Allow manual trigger

jobs:
  automate:
    runs-on: ubuntu-latest
    steps:
      - name: Run Automation
        run: |
          curl -X GET "${{ secrets.AUTOMATION_URL }}" \
            -H "Authorization: Bearer ${{ secrets.CRON_SECRET }}"
```

**Setup:**
1. Add secrets in GitHub:
   - `AUTOMATION_URL`: Your API endpoint URL
   - `CRON_SECRET`: Your secret token (if using)

---

## Recommended Approach

**For Vercel deployments:** Use Option 1 (Vercel Cron)
**For other hosting:** Use Option 2 (External Cron Service)
**For maximum reliability:** Use Option 3 (Database Triggers) + Option 1/2 as backup

---

## Testing

To test the cron endpoint manually:

```bash
# Without authentication
curl https://your-domain.com/api/cron/research-automation

# With authentication (if CRON_SECRET is set)
curl -H "Authorization: Bearer your-secret-token" \
  https://your-domain.com/api/cron/research-automation
```

---

## Monitoring

Check automation logs:
- Vercel: Dashboard > Functions > Logs
- External cron: Check service dashboard
- Database: Check `research_study_audit_log` table for automated changes

---

## Troubleshooting

**Automation not running:**
1. Check cron service is active
2. Verify endpoint URL is correct
3. Check server logs for errors
4. Verify database connection

**Authentication errors:**
- If using CRON_SECRET, ensure header matches
- Vercel Cron automatically includes `x-vercel-cron` header

**No updates happening:**
- Check if studies meet criteria (dates, statuses)
- Verify automation logic is correct
- Check audit logs for errors

---

## Security Notes

- The cron endpoint should be protected
- Use CRON_SECRET for external cron services
- Vercel Cron is automatically secured
- Never expose sensitive credentials

