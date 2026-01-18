# MASE EMR - SQL Execution Guide

## Quick Start

**Option 1: Execute Master Script (Recommended)**
1. Go to your Supabase project dashboard
2. Click "SQL Editor" in the left sidebar
3. Click "New Query"
4. Copy the entire contents of `scripts/MASTER_COMPLETE_SETUP.sql`
5. Paste into the SQL editor
6. Click "Run" (or press Cmd+Enter / Ctrl+Enter)
7. Wait 2-5 minutes for completion
8. You should see a success message with feature list

**Option 2: Execute Individual Scripts**
If you prefer to run scripts one at a time for better control, execute them in this order:

## Execution Order

### Phase 1: Foundation (REQUIRED FIRST)
```
1. scripts/create_multi_tenant_system.sql
2. scripts/001_create_core_tables.sql
3. scripts/001_create_staff_tables.sql
```

### Phase 2: Clinical Core
```
4. scripts/002_discharge_summaries.sql
5. scripts/009_clinical_alerts_schema.sql
6. scripts/010_check_in_schema.sql
7. scripts/clinical-assessments-schema.sql
8. scripts/medications-prescriptions-schema.sql
9. scripts/consent-forms-schema.sql
```

### Phase 3: Specialty Configuration
```
10. scripts/create_specialty_configuration.sql
11. scripts/create_clinic_onboarding.sql
```

### Phase 4: OTP/MAT Programs
```
12. scripts/create_dispensing_tables.sql
13. scripts/seed_dispensing_data.sql
14. scripts/create_dea_compliance_tables.sql
15. scripts/seed_dea_compliance_data.sql
16. scripts/create_takehome_tables.sql
17. scripts/seed_takehome_rules.sql
18. scripts/create_dea_form_222_tables.sql
19. scripts/seed_dea_form_222_data.sql
```

### Phase 5: Education & Collaboration
```
20. scripts/create_staff_education_tables.sql
21. scripts/seed_training_modules.sql
22. scripts/seed_regulatory_updates.sql
23. scripts/create_provider_collaboration_tables.sql
24. scripts/enhance_provider_collaboration.sql
25. scripts/create_chw_encounter_tables.sql
```

### Phase 6: Quality & Compliance
```
26. scripts/create_market_features.sql
27. scripts/seed_quality_measures.sql
28. scripts/seed_clinical_decision_rules.sql
29. scripts/005_compliance_reporting_tables.sql
30. scripts/004_add_regulatory_roles.sql
```

### Phase 7: Billing & Insurance
```
31. scripts/012_subscription_schema.sql
32. scripts/insurance-payer-schema.sql
33. scripts/clearinghouse-schema.sql
34. scripts/create_insurance_verification.sql
```

### Phase 8: DME, Labs, & Rehab
```
35. scripts/create_dme_tox_rehab_system.sql
36. scripts/create_hep_monitoring_system.sql
37. scripts/create_parachute_verse_integration.sql
```

### Phase 9: Public Health
```
38. scripts/create_pihp_health_dept_vaccination.sql
39. scripts/create_county_health_system.sql
40. scripts/create_county_health_education.sql
```

### Phase 10: Advanced Features
```
41. scripts/create_mase_hie_network.sql
42. scripts/create_advanced_integrations.sql
43. scripts/011_patient_reminders_schema.sql
44. scripts/team-communication-schema.sql
45. scripts/workflows-tasks-schema.sql
46. scripts/assessment-forms-schema.sql
```

### Phase 11: Sample Data (Optional)
```
47. scripts/003_seed_sample_data.sql
```

## Verification

After running all scripts, verify the setup:

```sql
-- Check total table count (should be 100+)
SELECT COUNT(*) as total_tables 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check key tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN (
  'organizations',
  'patients',
  'encounters',
  'medications',
  'vaccinations',
  'dme_orders',
  'toxicology_orders',
  'hep_exercise_library',
  'county_health_programs',
  'hie_network_registry'
)
ORDER BY table_name;

-- Check specialty features are loaded
SELECT COUNT(*) as specialty_features_count 
FROM specialty_features;
-- Should return 40+

-- Verify super admin exists
SELECT * FROM super_admins LIMIT 1;
```

## Troubleshooting

**Error: "relation already exists"**
- This is normal if you're re-running scripts
- The `IF NOT EXISTS` clauses prevent errors
- Safe to continue

**Error: "permission denied"**
- Ensure you're running as database owner
- Check your Supabase project permissions

**Error: "syntax error"**
- Copy/paste the entire script without modifications
- Ensure no characters were corrupted during copy

**Slow execution**
- Large scripts may take 2-5 minutes
- Don't refresh the page during execution
- Watch the status indicator in SQL editor

## Post-Installation

1. **Login as Super Admin**
   - Email: `admin@mase-emr.com`
   - Password: `Admin@123`
   - **IMPORTANT**: Change this password immediately!

2. **Create Your First Clinic**
   - Go to Super Admin Dashboard
   - Click "Create New Organization"
   - Complete the onboarding workflow

3. **Configure Integrations**
   - Go to Settings > Integrations
   - Add API keys for:
     - Vonage Fax (optional)
     - Twilio SMS (optional)
     - PDMP (state-specific, optional)
     - Parachute Health (optional)
     - Verse Medical (optional)

4. **Set Up Specialties**
   - Go to Subscription Management
   - Select your medical specialties
   - System will auto-configure features

## Need Help?

If you encounter any issues:
1. Check the Supabase logs in the dashboard
2. Verify your database has sufficient resources
3. Ensure all required extensions are enabled
4. Contact support with the specific error message

## Success!

Once all scripts are executed successfully, your MASE Behavioral Health EMR is fully operational with:
- ✅ Multi-tenant system
- ✅ 13 medical specialties
- ✅ 100+ database tables
- ✅ All integrations configured
- ✅ AI-powered features ready
- ✅ Public health portals active

**You're ready to start using the EMR!**
