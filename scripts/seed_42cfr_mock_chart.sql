-- ================================================
-- MOCK PATIENT CHART WITH FULL 42 CFR PART 2 COMPLIANCE
-- Opioid Treatment Program (OTP) Patient Record
-- ================================================

-- Insert Mock OTP Patient
INSERT INTO patients (
  id,
  first_name,
  last_name,
  date_of_birth,
  gender,
  phone,
  email,
  address,
  city,
  state,
  zip_code,
  emergency_contact_name,
  emergency_contact_phone,
  emergency_contact_relationship,
  created_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  'Michael',
  'Thompson',
  '1985-06-15',
  'Male',
  '555-0123',
  'michael.thompson@example.com',
  '742 Maple Street, Apt 3B',
  'Detroit',
  'MI',
  '48201',
  'Sarah Thompson',
  '555-0124',
  'Spouse',
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name;

-- Insert 42 CFR Part 2 Consent Forms
INSERT INTO consent_forms (
  id,
  patient_id,
  consent_type,
  consent_status,
  signed_date,
  expiration_date,
  purpose,
  information_disclosed,
  recipient_name,
  recipient_organization,
  disclosure_restrictions,
  revocation_rights_explained,
  patient_signature,
  witness_signature,
  consent_document_url,
  notes,
  created_at
) VALUES 
-- General Treatment Consent with 42 CFR Part 2 Notice
(
  gen_random_uuid(),
  '550e8400-e29b-41d4-a716-446655440001',
  'Treatment Consent',
  'Active',
  NOW() - INTERVAL '30 days',
  NOW() + INTERVAL '335 days',
  'Consent for opioid use disorder treatment at Metro OTP Clinic',
  'Medical records, treatment progress, medication dosing, counseling notes, drug screening results',
  'Metro OTP Clinic Staff',
  'Metro OTP Clinic - Detroit',
  '42 CFR Part 2 PROTECTED: This information has been disclosed to you from records protected by Federal confidentiality rules (42 CFR Part 2). The Federal rules prohibit you from making any further disclosure of this information unless further disclosure is expressly permitted by the written consent of the person to whom it pertains or as otherwise permitted by 42 CFR Part 2.',
  true,
  'Michael Thompson (Electronic Signature)',
  'Jane Wilson, RN (Witness)',
  '/consents/42cfr-treatment-consent-001.pdf',
  'Patient verbalized understanding of 42 CFR Part 2 protections and treatment consent',
  NOW() - INTERVAL '30 days'
),
-- Disclosure to Emergency Contacts
(
  gen_random_uuid(),
  '550e8400-e29b-41d4-a716-446655440001',
  'Disclosure Authorization',
  'Active',
  NOW() - INTERVAL '30 days',
  NOW() + INTERVAL '335 days',
  'Authorization to disclose limited treatment information to emergency contact in case of medical emergency',
  'Treatment attendance status, emergency medical information only',
  'Sarah Thompson',
  'Emergency Contact (Spouse)',
  'Disclosure limited to: (1) Confirmation of treatment enrollment (2) Medical emergencies only (3) No specific substance use information unless life-threatening. Protected by 42 CFR Part 2.',
  true,
  'Michael Thompson (Electronic Signature)',
  'Jane Wilson, RN (Witness)',
  '/consents/42cfr-emergency-disclosure-001.pdf',
  'Limited disclosure authorization for emergency situations only',
  NOW() - INTERVAL '30 days'
),
-- Disclosure to Primary Care Provider
(
  gen_random_uuid(),
  '550e8400-e29b-41d4-a716-446655440001',
  'Provider Disclosure',
  'Active',
  NOW() - INTERVAL '25 days',
  NOW() + INTERVAL '340 days',
  'Authorization to coordinate care with primary care physician',
  'Methadone dosing information, drug interaction alerts, medical conditions, UDS results',
  'Dr. Jennifer Martinez',
  'Detroit Primary Care Associates',
  '42 CFR Part 2 PROTECTED: Disclosure limited to coordination of medical care. Recipient may not re-disclose without additional patient authorization.',
  true,
  'Michael Thompson (Electronic Signature)',
  'Dr. Robert Chen, Medical Director',
  '/consents/42cfr-pcp-disclosure-001.pdf',
  'Patient requested care coordination with PCP for management of hypertension and diabetes',
  NOW() - INTERVAL '25 days'
);

-- Insert OTP Admission Record
INSERT INTO otp_admissions (
  id,
  patient_id,
  admission_date,
  program_type,
  primary_substance,
  secondary_substances,
  previous_treatment_episodes,
  admission_status,
  referring_provider,
  initial_dose_mg,
  target_dose_mg,
  medical_director_id,
  counselor_id,
  treatment_plan_date,
  estimated_treatment_duration_days,
  created_at
) VALUES (
  gen_random_uuid(),
  '550e8400-e29b-41d4-a716-446655440001',
  NOW() - INTERVAL '30 days',
  'Methadone Maintenance',
  'Heroin',
  ARRAY['Cocaine', 'Benzodiazepines'],
  3,
  'Active',
  'Detroit Emergency Department',
  30,
  80,
  (SELECT id FROM staff WHERE role = 'provider' LIMIT 1),
  (SELECT id FROM staff WHERE role = 'counselor' LIMIT 1),
  NOW() - INTERVAL '28 days',
  365,
  NOW() - INTERVAL '30 days'
) ON CONFLICT DO NOTHING;

-- Insert Initial Assessment
INSERT INTO assessments (
  id,
  patient_id,
  assessment_type,
  assessment_date,
  performed_by,
  chief_complaint,
  history_present_illness,
  substance_use_history,
  mental_health_history,
  medical_history,
  current_medications,
  allergies,
  social_history,
  risk_assessment,
  diagnosis_codes,
  treatment_recommendations,
  assessment_status,
  confidentiality_notice,
  created_at
) VALUES (
  gen_random_uuid(),
  '550e8400-e29b-41d4-a716-446655440001',
  'Initial OTP Assessment',
  NOW() - INTERVAL '30 days',
  'Dr. Robert Chen, MD',
  'Seeking treatment for opioid use disorder. 10-year history of heroin use, last use 36 hours ago.',
  'Patient reports escalating heroin use over past 10 years. Started with prescription opioids after work injury in 2014. Progressed to heroin use within 2 years. Multiple quit attempts, longest abstinence 4 months. Experiencing withdrawal symptoms: muscle aches, anxiety, insomnia, GI distress.',
  'Age of first opioid use: 28 years old (prescription). Heroin use began age 30. Current use: 1-2 grams/day IV heroin. Previous substances: alcohol (social use), cocaine (occasional), marijuana (discontinued 5 years ago). 3 previous treatment episodes: 2 detox programs, 1 outpatient counseling (2 months). Family history: father with alcohol use disorder.',
  'Patient reports depression and anxiety symptoms. PHQ-9 score: 16 (moderately severe depression). GAD-7 score: 14 (moderate anxiety). Denies current suicidal ideation. Past suicide attempt age 32 (overdose, 2 days hospitalization). No psychiatric hospitalizations. No history of psychosis or mania.',
  'Medical conditions: Hypertension (diagnosed 2019), Type 2 Diabetes (diagnosed 2020), Hepatitis C antibody positive (RNA negative - spontaneously cleared). History of endocarditis 2021 (treated, resolved). No HIV. Surgical history: appendectomy age 22. Current PCP: Dr. Jennifer Martinez, Detroit Primary Care.',
  'Lisinopril 10mg daily, Metformin 1000mg BID',
  'Penicillin (rash)',
  'Married, 2 children ages 8 and 5. Currently unemployed (laid off 6 months ago). Wife working full-time. High school graduate, 1 year technical college. Lives in apartment. Stable housing. Supportive spouse. History of legal issues: 2 possession charges (2018, 2020), currently on probation.',
  'COWS Score: 12 (moderate withdrawal). Suicide risk: Low (supportive family, engaged in treatment, denies SI/HI). Overdose risk: High (recent daily IV use, lost tolerance during withdrawal). Violence risk: Low. Readiness to change: Action stage (URICA).',
  ARRAY['F11.20 - Opioid Dependence, Uncomplicated', 'F33.1 - Major Depressive Disorder, Recurrent, Moderate', 'F41.1 - Generalized Anxiety Disorder', 'I10 - Essential Hypertension', 'E11.9 - Type 2 Diabetes Mellitus'],
  '1. Initiate methadone maintenance therapy, start 30mg, titrate to effective dose (target 80-120mg)
2. Individual counseling weekly, group counseling twice weekly
3. Random UDS monitoring per federal guidelines
4. Coordinate care with PCP for hypertension and diabetes management
5. Psychiatric evaluation for depression/anxiety treatment
6. Case management for employment assistance
7. Family therapy assessment
8. Hepatitis C monitoring
9. Overdose prevention education, naloxone prescription',
  'Completed',
  '42 CFR PART 2 CONFIDENTIALITY NOTICE: This assessment contains substance use disorder treatment information protected by Federal confidentiality rules (42 CFR Part 2). Unauthorized disclosure is prohibited.',
  NOW() - INTERVAL '30 days'
);

-- Insert Dosing History (30 days of methadone doses)
INSERT INTO dosing_log (
  patient_id,
  medication_name,
  dose_mg,
  dose_date,
  dose_time,
  administered_by,
  administration_route,
  patient_signature,
  nurse_signature,
  witnessed_consumption,
  adverse_reactions,
  notes
)
SELECT 
  '550e8400-e29b-41d4-a716-446655440001',
  'Methadone',
  CASE 
    WHEN day_offset >= -5 THEN 80  -- Current stable dose
    WHEN day_offset >= -10 THEN 70
    WHEN day_offset >= -15 THEN 60
    WHEN day_offset >= -20 THEN 50
    WHEN day_offset >= -25 THEN 40
    ELSE 30  -- Initial dose
  END,
  NOW() + (day_offset || ' days')::INTERVAL,
  '07:00:00'::TIME,
  'Dosing Nurse',
  'Oral',
  'M. Thompson',
  'Nurse Initial',
  true,
  NULL,
  CASE 
    WHEN day_offset = -30 THEN 'Initial dose - Patient educated on methadone effects'
    WHEN day_offset = -25 THEN 'Dose increase per physician order - tolerating well'
    WHEN day_offset = -20 THEN 'Dose increase - no adverse effects'
    WHEN day_offset = -15 THEN 'Dose increase - reports decreased cravings'
    WHEN day_offset = -10 THEN 'Dose increase - good response'
    WHEN day_offset = -5 THEN 'Reached stable maintenance dose'
    ELSE 'Routine maintenance dose - stable'
  END
FROM generate_series(-30, -1) AS day_offset
WHERE EXTRACT(DOW FROM NOW() + (day_offset || ' days')::INTERVAL) NOT IN (0); -- Exclude Sundays

-- Insert Urine Drug Screen Results
INSERT INTO urine_drug_screens (
  id,
  patient_id,
  collection_date,
  collection_time,
  collected_by,
  specimen_temperature,
  specimen_validity,
  observed_collection,
  test_results,
  methadone_level,
  positive_substances,
  test_status,
  reviewed_by,
  review_date,
  clinical_interpretation,
  action_taken,
  confidentiality_protected,
  created_at
) VALUES 
-- Week 1 (admission)
(
  gen_random_uuid(),
  '550e8400-e29b-41d4-a716-446655440001',
  NOW() - INTERVAL '30 days',
  '07:15:00',
  'Jane Wilson, RN',
  '97.2°F',
  'Valid',
  true,
  '{"opiates": "positive", "cocaine": "positive", "benzodiazepines": "positive", "methadone": "negative", "amphetamines": "negative", "marijuana": "negative", "PCP": "negative"}',
  NULL,
  ARRAY['Morphine (heroin metabolite)', 'Cocaine', 'Benzodiazepines'],
  'Reviewed',
  'Dr. Robert Chen, MD',
  NOW() - INTERVAL '29 days',
  'Baseline UDS at admission. Positive for opiates (consistent with recent heroin use), cocaine, and benzodiazepines. Patient disclosed use. Counseling provided re: risks of polysubstance use.',
  'Patient counseled on medication interactions and overdose risk. Continued close monitoring during induction phase.',
  true,
  NOW() - INTERVAL '30 days'
),
-- Week 2
(
  gen_random_uuid(),
  '550e8400-e29b-41d4-a716-446655440001',
  NOW() - INTERVAL '23 days',
  '07:20:00',
  'Jane Wilson, RN',
  '98.1°F',
  'Valid',
  true,
  '{"opiates": "negative", "cocaine": "negative", "benzodiazepines": "positive", "methadone": "positive", "amphetamines": "negative", "marijuana": "negative", "PCP": "negative"}',
  'Therapeutic range',
  ARRAY['Methadone', 'Benzodiazepines'],
  'Reviewed',
  'Dr. Robert Chen, MD',
  NOW() - INTERVAL '22 days',
  'Improved results. Negative for illicit opiates and cocaine. Methadone detected (expected). Benzodiazepines still positive - patient states prescribed for anxiety.',
  'Contacted patient PCP to confirm benzodiazepine prescription. Patient counseled on risks of concurrent benzodiazepine/methadone use. Close monitoring.',
  true,
  NOW() - INTERVAL '23 days'
),
-- Week 3
(
  gen_random_uuid(),
  '550e8400-e29b-41d4-a716-446655440001',
  NOW() - INTERVAL '16 days',
  '07:25:00',
  'Mark Stevens, RN',
  '97.8°F',
  'Valid',
  false,
  '{"opiates": "negative", "cocaine": "negative", "benzodiazepines": "positive", "methadone": "positive", "amphetamines": "negative", "marijuana": "negative", "PCP": "negative"}',
  'Therapeutic range',
  ARRAY['Methadone', 'Benzodiazepines'],
  'Reviewed',
  'Dr. Robert Chen, MD',
  NOW() - INTERVAL '15 days',
  'Continued abstinence from illicit substances. Benzodiazepine use confirmed as prescribed by PCP. Coordinating taper plan with PCP.',
  'PCP to initiate slow benzodiazepine taper. Patient attending all counseling sessions. Good progress.',
  true,
  NOW() - INTERVAL '16 days'
),
-- Week 4 (most recent)
(
  gen_random_uuid(),
  '550e8400-e29b-41d4-a716-446655440001',
  NOW() - INTERVAL '9 days',
  '07:18:00',
  'Jane Wilson, RN',
  '98.3°F',
  'Valid',
  false,
  '{"opiates": "negative", "cocaine": "negative", "benzodiazepines": "positive", "methadone": "positive", "amphetamines": "negative", "marijuana": "negative", "PCP": "negative"}',
  'Therapeutic range',
  ARRAY['Methadone', 'Benzodiazepines'],
  'Reviewed',
  'Dr. Robert Chen, MD',
  NOW() - INTERVAL '8 days',
  'Sustained abstinence from illicit opioids and cocaine. Methadone at therapeutic level. Benzodiazepine levels decreasing consistent with taper.',
  'Patient reports stable mood, decreased cravings. 100% attendance at counseling. Consider take-home privileges evaluation in 2 weeks.',
  true,
  NOW() - INTERVAL '9 days'
);

-- Insert Counseling Sessions
INSERT INTO progress_notes (
  id,
  patient_id,
  note_date,
  note_type,
  provider_name,
  chief_complaint,
  subjective,
  objective,
  assessment,
  plan,
  interventions_provided,
  patient_response,
  next_appointment,
  note_status,
  confidentiality_protected,
  created_at
) VALUES 
-- Individual Counseling Session 1
(
  gen_random_uuid(),
  '550e8400-e29b-41d4-a716-446655440001',
  NOW() - INTERVAL '28 days',
  'Individual Counseling Session',
  'Lisa Martinez, LMSW, CADC',
  'Initial counseling session - treatment orientation',
  'Patient engaged and motivated for treatment. Reports feeling hopeful about recovery. Expresses concern about managing stress without substance use. States strong family support system. Wife supportive of treatment. Goals: maintain abstinence, repair family relationships, return to employment.',
  'Patient alert, oriented x4. Good eye contact. Appropriate affect. No signs of intoxication or withdrawal. Cooperative with assessment. Insight appears good.',
  'Opioid Use Disorder, Severe. Patient in early engagement phase of treatment. Motivated for change. Multiple protective factors: family support, stable housing. Risk factors: unemployment, history of relapse, co-occurring depression/anxiety.',
  '1. Continue weekly individual counseling focusing on relapse prevention
2. Enroll in group counseling (coping skills, recovery support)
3. Referral for psychiatric evaluation for depression/anxiety
4. Develop detailed relapse prevention plan
5. Connect with peer support/12-step program
6. Next session: discuss triggers and coping strategies',
  'Motivational interviewing, psychoeducation re: addiction and recovery, initial relapse prevention planning, treatment orientation',
  'Patient receptive to interventions. Identified several high-risk triggers: stress, unemployment, certain people/places. Committed to attending all treatment appointments.',
  NOW() - INTERVAL '21 days',
  'Signed',
  true,
  NOW() - INTERVAL '28 days'
),
-- Individual Counseling Session 2
(
  gen_random_uuid(),
  '550e8400-e29b-41d4-a716-446655440001',
  NOW() - INTERVAL '21 days',
  'Individual Counseling Session',
  'Lisa Martinez, LMSW, CADC',
  'Follow-up counseling - trigger identification and coping strategies',
  'Patient reports stable first week. No cravings for illicit opioids. Methadone helping with withdrawal symptoms and cravings. Attended first group session - reports finding it helpful to hear others experiences. Wife pleased with progress. Sleeping better. Some anxiety remains but manageable.',
  'Patient well-groomed, appropriate dress. Good mood and affect. Motivated for continued treatment. No signs of intoxication. Engaged actively in session.',
  'Patient progressing well in early recovery. Developing awareness of triggers and implementing coping strategies. Strong family support continues. Minimal cravings reported. Good treatment compliance.',
  '1. Continue developing relapse prevention plan - focus on high-risk situations
2. Practice coping skills daily (reviewed: deep breathing, grounding techniques, calling support person)
3. Continue group counseling attendance
4. Begin looking at employment resources when stabilized
5. Next session: explore relationship between stress and substance use',
  'Cognitive behavioral therapy techniques, stress management education, relapse prevention planning, reviewed coping skills hierarchy',
  'Patient demonstrated good understanding of trigger-response pattern. Practiced coping skills in session. Committed to using skills between sessions. Reports confidence in ability to manage cravings.',
  NOW() - INTERVAL '14 days',
  'Signed',
  true,
  NOW() - INTERVAL '21 days'
),
-- Group Counseling Session
(
  gen_random_uuid(),
  '550e8400-e29b-41d4-a716-446655440001',
  NOW() - INTERVAL '17 days',
  'Group Counseling Session',
  'James Wilson, LMSW',
  'Group therapy - Coping Skills Development',
  'Patient actively participated in group session focused on healthy coping mechanisms. Shared experiences about previous relapse triggers. Offered support to newer group members. Reports finding group helpful for not feeling alone in recovery.',
  '8 participants attended. Patient engaged appropriately, shared experiences, listened to others. Demonstrated empathy. No disruptive behavior. On time for session.',
  'Patient benefiting from peer support. Developing recovery skills. Good group member - supportive of others while working on own recovery.',
  'Continue group participation 2x weekly. Patient showing natural leadership qualities - may be good peer mentor candidate in future.',
  'Group psychotherapy, peer support, skills building exercises (identified healthy coping strategies to replace substance use)',
  'Patient identified 5 new coping strategies to implement: exercise, talking to spouse, attending support meetings, journaling, calling counselor/sponsor when triggered.',
  NOW() - INTERVAL '10 days',
  'Signed',
  true,
  NOW() - INTERVAL '17 days'
),
-- Medical Progress Note
(
  gen_random_uuid(),
  '550e8400-e29b-41d4-a716-446655440001',
  NOW() - INTERVAL '14 days',
  'Medical Progress Note',
  'Dr. Robert Chen, MD, Medical Director',
  '2-week medical follow-up',
  'Patient reports methadone dose at 70mg is effective. No significant cravings for illicit opioids. No adverse effects from methadone. Sleep improving. Appetite good. Energy level improved. Attending all counseling sessions. Wife reports positive changes at home. Compliant with diabetes and hypertension medications.',
  'Vital Signs: BP 128/82, HR 72, RR 16, Temp 98.6°F, O2 Sat 98% RA, Weight 185 lbs. Physical exam: Alert and oriented. No signs of intoxication or sedation. Pupil size normal. Speech clear. Gait steady. No track marks (patient reports 2 weeks since last IV use). Heart RRR, lungs clear, abdomen soft. Recent UDS: negative for illicit substances, positive for methadone (therapeutic).',
  'Opioid Use Disorder - responding well to methadone maintenance at current dose. Good treatment engagement. Co-occurring depression/anxiety improving with treatment and abstinence. Hypertension and diabetes controlled on current regimen.',
  '1. Increase methadone to 80mg - patient reports occasional afternoon cravings
2. Continue current counseling schedule
3. Recheck vital signs and UDS at next medical visit (1 week)
4. Continue coordination with PCP for chronic disease management
5. Psychiatric evaluation scheduled next week for depression/anxiety
6. Consider take-home medication privileges in 2-4 weeks if continued stability',
  'Medical examination, medication management, care coordination',
  'Patient understanding of treatment plan. Verbalizes commitment to recovery. No concerns or questions at this time.',
  NOW() - INTERVAL '7 days',
  'Signed',
  true,
  NOW() - INTERVAL '14 days'
),
-- Most Recent Session
(
  gen_random_uuid(),
  '550e8400-e29b-41d4-a716-446655440001',
  NOW() - INTERVAL '7 days',
  'Individual Counseling Session',
  'Lisa Martinez, LMSW, CADC',
  'Follow-up counseling - employment planning and relapse prevention',
  'Patient reports continued stability. At stable methadone dose of 80mg. No cravings. Sleeping well. Mood improved significantly - "feeling like myself again." Attended AA meeting with wife - found it helpful. Started looking at job opportunities online. Some anxiety about returning to work but feels ready. Family relationships improving.',
  'Patient well-groomed. Bright affect. Future-oriented. Engaged actively in session. Good insight. No signs of intoxication or withdrawal.',
  'Patient making excellent progress. 4 weeks abstinent from illicit substances. Strong recovery support system. Successfully implementing coping strategies. Ready to begin vocational planning. Depression/anxiety significantly improved.',
  '1. Begin vocational counseling - referral to employment services
2. Continue relapse prevention planning with focus on workplace triggers/stress
3. Encourage continued AA/support group attendance  
4. Monitor mood as patient transitions to employment
5. Consider eligibility for take-home privileges (will discuss with treatment team)
6. Next session: develop workplace relapse prevention strategies',
  'Solution-focused therapy, vocational counseling, relapse prevention, stress management techniques',
  'Patient excited about progress. Demonstrated understanding of high-risk situations in work environment. Committed to maintaining recovery supports while returning to work. Strong self-efficacy noted.',
  NOW(),
  'Signed',
  true,
  NOW() - INTERVAL '7 days'
);

-- Insert Take-Home Medication Biometric Enrollment
INSERT INTO patient_biometric_enrollment (
  patient_id,
  enrollment_date,
  biometric_type,
  enrollment_status,
  facial_template_id,
  voice_template_id,
  fingerprint_template_id,
  enrolled_by,
  device_used,
  consent_obtained,
  notes
) VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  NOW() - INTERVAL '5 days',
  'Facial + GPS',
  'Active',
  'FACE_TPL_MT_001',
  NULL,
  NULL,
  'Jane Wilson, RN',
  'OTP Biometric Scanner v2.1',
  true,
  'Patient enrolled in biometric verification system for take-home medication program. Facial recognition template created. GPS tracking enabled on patient mobile device. Patient educated on daily verification requirements per 42 CFR § 8.12(i).'
) ON CONFLICT DO NOTHING;

-- Insert Vital Signs History (30 days)
INSERT INTO vital_signs (
  patient_id,
  recorded_date,
  recorded_time,
  systolic_bp,
  diastolic_bp,
  heart_rate,
  respiratory_rate,
  temperature,
  oxygen_saturation,
  weight_lbs,
  height_inches,
  bmi,
  pain_level,
  recorded_by,
  notes
)
SELECT 
  '550e8400-e29b-41d4-a716-446655440001',
  NOW() + (day_offset || ' days')::INTERVAL,
  '07:30:00'::TIME,
  -- Blood pressure gradually improving as patient stabilizes
  CASE 
    WHEN day_offset < -20 THEN 145 + (RANDOM() * 10)::INTEGER
    WHEN day_offset < -10 THEN 135 + (RANDOM() * 8)::INTEGER
    ELSE 128 + (RANDOM() * 6)::INTEGER
  END,
  CASE 
    WHEN day_offset < -20 THEN 88 + (RANDOM() * 8)::INTEGER
    WHEN day_offset < -10 THEN 85 + (RANDOM() * 6)::INTEGER
    ELSE 80 + (RANDOM() * 5)::INTEGER
  END,
  70 + (RANDOM() * 10)::INTEGER,  -- Heart rate
  16 + (RANDOM() * 2)::INTEGER,   -- Respiratory rate
  97.8 + (RANDOM() * 1.4),        -- Temperature
  97 + (RANDOM() * 2)::INTEGER,   -- O2 sat
  183 + (RANDOM() * 4)::INTEGER,  -- Weight (gaining slightly - healthier)
  70,                              -- Height
  26.2,                           -- BMI (calculated)
  CASE 
    WHEN day_offset < -25 THEN 4 + (RANDOM() * 3)::INTEGER  -- Early withdrawal pain
    ELSE (RANDOM() * 2)::INTEGER  -- Minimal pain when stable
  END,
  'Nursing Staff',
  CASE 
    WHEN day_offset = -30 THEN 'Admission vitals - mild hypertension noted'
    WHEN day_offset = -20 THEN 'BP improving with treatment stabilization'
    WHEN day_offset = -10 THEN 'Vitals stable, patient tolerating medication well'
    ELSE 'Routine vital signs - stable'
  END
FROM generate_series(-30, -1) AS day_offset
WHERE EXTRACT(DOW FROM NOW() + (day_offset || ' days')::INTERVAL) NOT IN (0);

-- Insert Medications List
INSERT INTO medications (
  patient_id,
  medication_name,
  dosage,
  frequency,
  route,
  prescribing_provider,
  start_date,
  end_date,
  status,
  indication,
  pharmacy,
  refills_remaining,
  notes,
  created_at
) VALUES 
(
  '550e8400-e29b-41d4-a716-446655440001',
  'Methadone HCl',
  '80mg',
  'Once daily',
  'Oral',
  'Dr. Robert Chen, MD',
  NOW() - INTERVAL '30 days',
  NULL,
  'Active',
  'Opioid Use Disorder',
  'Metro OTP Clinic (On-site Dispensing)',
  NULL,
  '42 CFR Part 2 PROTECTED. Administered daily at clinic. Take-home doses pending approval. Current stable maintenance dose.',
  NOW() - INTERVAL '30 days'
),
(
  '550e8400-e29b-41d4-a716-446655440001',
  'Lisinopril',
  '10mg',
  'Once daily',
  'Oral',
  'Dr. Jennifer Martinez, MD (PCP)',
  NOW() - INTERVAL '365 days',
  NULL,
  'Active',
  'Hypertension',
  'CVS Pharmacy #1234',
  2,
  'BP well-controlled on current dose. Prescribed by PCP, coordinated with OTP care.',
  NOW() - INTERVAL '365 days'
),
(
  '550e8400-e29b-41d4-a716-446655440001',
  'Metformin',
  '1000mg',
  'Twice daily',
  'Oral',
  'Dr. Jennifer Martinez, MD (PCP)',
  NOW() - INTERVAL '300 days',
  NULL,
  'Active',
  'Type 2 Diabetes Mellitus',
  'CVS Pharmacy #1234',
  3,
  'Blood glucose well-controlled. Prescribed by PCP, coordinated with OTP care.',
  NOW() - INTERVAL '300 days'
),
(
  '550e8400-e29b-41d4-a716-446655440001',
  'Naloxone Nasal Spray',
  '4mg',
  'As needed',
  'Intranasal',
  'Dr. Robert Chen, MD',
  NOW() - INTERVAL '30 days',
  NULL,
  'Active',
  'Opioid Overdose Prevention',
  'Metro OTP Clinic',
  2,
  'Overdose prevention education provided. Patient and spouse trained on use. Keep on person at all times.',
  NOW() - INTERVAL '30 days'
);

-- Insert 42 CFR Part 2 Disclosure Tracking
INSERT INTO disclosure_logs (
  patient_id,
  disclosure_date,
  disclosed_to_name,
  disclosed_to_organization,
  information_disclosed,
  purpose_of_disclosure,
  legal_basis,
  consent_form_id,
  disclosed_by,
  disclosure_method,
  confidentiality_notice_included,
  notes
) VALUES 
(
  '550e8400-e29b-41d4-a716-446655440001',
  NOW() - INTERVAL '25 days',
  'Dr. Jennifer Martinez',
  'Detroit Primary Care Associates',
  'Current methadone dose (80mg), recent UDS results, medication interactions',
  'Coordination of medical care for hypertension and diabetes',
  '42 CFR § 2.31 - Patient Consent',
  (SELECT id FROM consent_forms WHERE patient_id = '550e8400-e29b-41d4-a716-446655440001' AND consent_type = 'Provider Disclosure' LIMIT 1),
  'Jane Wilson, RN',
  'Secure Fax',
  true,
  'Care coordination per patient consent. 42 CFR Part 2 confidentiality notice included on all pages of disclosure.'
),
(
  '550e8400-e29b-41d4-a716-446655440001',
  NOW() - INTERVAL '15 days',
  'Dr. Jennifer Martinez',
  'Detroit Primary Care Associates',
  'Updated UDS results showing benzodiazepine detection, request for taper plan',
  'Medication safety and coordination of benzodiazepine taper',
  '42 CFR § 2.31 - Patient Consent',
  (SELECT id FROM consent_forms WHERE patient_id = '550e8400-e29b-41d4-a716-446655440001' AND consent_type = 'Provider Disclosure' LIMIT 1),
  'Dr. Robert Chen, MD',
  'Secure Email (Encrypted)',
  true,
  'Requesting PCP to initiate slow benzodiazepine taper due to drug interaction concerns with methadone.'
);

-- Insert Treatment Plan
INSERT INTO treatment_plans (
  patient_id,
  plan_date,
  plan_type,
  primary_diagnosis,
  secondary_diagnoses,
  treatment_goals,
  interventions,
  frequency,
  responsible_provider,
  review_date,
  patient_involvement,
  plan_status,
  confidentiality_protected,
  created_at
) VALUES (
  '550e8400-e29b-41d4-a716-446655440001',
  NOW() - INTERVAL '28 days',
  'Comprehensive OTP Treatment Plan',
  'F11.20 - Opioid Use Disorder, Severe',
  ARRAY['F33.1 - Major Depressive Disorder', 'F41.1 - Generalized Anxiety Disorder', 'I10 - Hypertension', 'E11.9 - Type 2 Diabetes'],
  '[
    {
      "goal": "Achieve and maintain abstinence from illicit opioids",
      "timeline": "Ongoing",
      "measurable_outcome": "Negative UDS for illicit opioids for 90+ consecutive days",
      "progress": "On track - 30 days abstinent"
    },
    {
      "goal": "Stabilize on optimal methadone maintenance dose",
      "timeline": "4-6 weeks",
      "measurable_outcome": "Patient reports no cravings, no withdrawal symptoms, dose 80-120mg range",
      "progress": "Achieved - stable at 80mg"
    },
    {
      "goal": "Develop and implement relapse prevention plan",
      "timeline": "8 weeks",
      "measurable_outcome": "Patient can identify triggers and demonstrate 5+ coping strategies",
      "progress": "In progress - developing skills"
    },
    {
      "goal": "Address co-occurring depression and anxiety",
      "timeline": "12 weeks",
      "measurable_outcome": "PHQ-9 < 10, GAD-7 < 10, psychiatric treatment if needed",
      "progress": "Scheduled psych eval, symptoms improving"
    },
    {
      "goal": "Improve family relationships and communication",
      "timeline": "16 weeks",
      "measurable_outcome": "Patient and spouse report improved relationship, consider family therapy",
      "progress": "Good - spouse supportive, relationships improving"
    },
    {
      "goal": "Return to employment",
      "timeline": "12-16 weeks",
      "measurable_outcome": "Obtain stable employment, maintain treatment compliance",
      "progress": "Beginning vocational planning"
    },
    {
      "goal": "Establish recovery support network",
      "timeline": "Ongoing",
      "measurable_outcome": "Attend 2+ support meetings weekly, identify sponsor",
      "progress": "Started attending AA with spouse"
    }
  ]'::JSONB,
  'Methadone maintenance therapy (daily dosing), individual counseling (weekly), group counseling (2x/week), psychiatric evaluation and medication management, case management, medical monitoring, random UDS testing, care coordination with PCP, family support, peer support groups, vocational counseling',
  'Daily medication, weekly individual counseling, twice weekly group counseling, biweekly medical visits, monthly comprehensive review',
  'Dr. Robert Chen, MD (Medical Director) & Lisa Martinez, LMSW, CADC (Primary Counselor)',
  NOW() + INTERVAL '60 days',
  'Patient actively participated in treatment plan development. Goals established collaboratively. Patient signed treatment plan and verbalized understanding and agreement.',
  'Active',
  true,
  NOW() - INTERVAL '28 days'
);

-- ================================================
-- 42 CFR PART 2 CONFIDENTIALITY STATEMENT
-- ================================================
-- 
-- NOTICE: The information in this mock chart is protected by
-- Federal confidentiality rules (42 CFR Part 2). These rules
-- prohibit unauthorized disclosure of any information that would
-- identify a patient as having or having had a substance use disorder.
--
-- A general authorization for the release of medical information
-- is NOT sufficient for this purpose. The Federal rules restrict
-- disclosure of substance use disorder treatment information except:
--
-- 1. With the written consent of the patient
-- 2. For medical emergencies
-- 3. To qualified personnel for research, audit, or program evaluation
-- 4. By court order (limited circumstances)
-- 5. To report a crime on program premises or against program personnel
-- 6. To child protective services (suspected child abuse/neglect)
--
-- Violation of these regulations is a criminal offense punishable by
-- fine and/or imprisonment.
--
-- This data is for DEMONSTRATION PURPOSES ONLY.
-- ================================================

COMMIT;
