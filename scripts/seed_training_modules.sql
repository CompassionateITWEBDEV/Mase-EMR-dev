-- Seed Training Modules with comprehensive content
-- Includes SAMHSA, Joint Commission, 42 CFR, and Michigan state requirements

INSERT INTO training_modules (module_code, name, description, category, regulatory_source, ceu_hours, duration_minutes, is_required, frequency, passing_score, content, quiz_questions) VALUES

-- HIPAA Compliance
('HIPAA-001', 'HIPAA Privacy & Security', 'Comprehensive training on HIPAA Privacy and Security Rules for protected health information', 'compliance', 'HHS/OCR', 2.0, 120, true, 'annual', 80,
'[
  {"title": "HIPAA Overview", "content": "The Health Insurance Portability and Accountability Act (HIPAA) establishes national standards for protecting sensitive patient health information. As healthcare workers, we must understand and comply with these regulations to protect patient privacy and avoid penalties."},
  {"title": "Protected Health Information (PHI)", "content": "PHI includes any information about health status, provision of healthcare, or payment that can be linked to an individual. This includes names, addresses, dates, Social Security numbers, medical record numbers, and any other identifying information."},
  {"title": "Privacy Rule Requirements", "content": "The Privacy Rule establishes standards for when PHI may be used or disclosed. Patients have rights to access their records, request amendments, receive an accounting of disclosures, and file complaints."},
  {"title": "Security Rule Requirements", "content": "The Security Rule requires administrative, physical, and technical safeguards to ensure the confidentiality, integrity, and availability of electronic PHI (ePHI)."},
  {"title": "Breach Notification", "content": "Organizations must notify affected individuals within 60 days, report to HHS, and notify media for breaches affecting 500+ individuals in a state."},
  {"title": "Best Practices", "content": "Always verify patient identity, use minimum necessary information, secure workstations, never share passwords, encrypt portable devices, and report suspected breaches immediately."}
]',
'[
  {"question": "What does PHI stand for?", "options": ["Protected Health Information", "Patient Health Insurance", "Private Healthcare Initiative", "Public Health Index"], "correct": 0},
  {"question": "How long do you have to notify patients of a breach?", "options": ["30 days", "60 days", "90 days", "1 year"], "correct": 1},
  {"question": "Which is NOT considered PHI?", "options": ["Patient name", "Date of birth", "Aggregate statistics", "Medical record number"], "correct": 2}
]'),

-- 42 CFR Part 2 - Substance Use Disorder Records
('42CFR-001', '42 CFR Part 2 Confidentiality', 'Federal regulations protecting the confidentiality of substance use disorder patient records', 'compliance', '42 CFR Part 2', 3.0, 180, true, 'annual', 85,
'[
  {"title": "42 CFR Part 2 Overview", "content": "42 CFR Part 2 provides additional federal protections for patient records created by federally assisted substance use disorder (SUD) treatment programs. These protections are MORE restrictive than HIPAA."},
  {"title": "What is Protected", "content": "Any information that would identify a patient as having or having had a substance use disorder is protected. This includes the fact that someone is or was a patient at the program."},
  {"title": "Consent Requirements", "content": "Written patient consent is required before ANY disclosure, except for medical emergencies, crimes on premises, child abuse reporting, and qualified audits. Consent must specify who can receive info, what can be disclosed, and purpose."},
  {"title": "Re-disclosure Prohibition", "content": "All disclosures must include a written statement prohibiting re-disclosure. Recipients cannot further share the information without new patient consent."},
  {"title": "2024 Final Rule Changes", "content": "Recent updates align 42 CFR Part 2 more closely with HIPAA for TPO (Treatment, Payment, Operations) but maintain stricter consent requirements for other disclosures."},
  {"title": "Penalties for Violations", "content": "Criminal penalties include fines up to $500 for first offense, up to $5,000 for subsequent offenses, and potential imprisonment."}
]',
'[
  {"question": "42 CFR Part 2 applies to which type of records?", "options": ["All medical records", "Mental health records", "Substance use disorder records", "Insurance records"], "correct": 2},
  {"question": "Can you disclose SUD treatment information without consent for a medical emergency?", "options": ["Yes", "No", "Only with court order", "Only to family"], "correct": 0},
  {"question": "What must accompany every disclosure under 42 CFR Part 2?", "options": ["Payment", "Re-disclosure prohibition notice", "Patient signature", "Court order"], "correct": 1}
]'),

-- Joint Commission Standards
('JC-001', 'Joint Commission Accreditation Standards', 'Overview of Joint Commission standards for behavioral health accreditation', 'compliance', 'Joint Commission', 4.0, 240, true, 'annual', 80,
'[
  {"title": "Accreditation Overview", "content": "Joint Commission accreditation demonstrates commitment to quality and patient safety. Behavioral healthcare organizations are surveyed every 3 years using tracer methodology."},
  {"title": "National Patient Safety Goals 2024", "content": "Goals include: Identify patients correctly, Improve staff communication, Use medicines safely, Use alarms safely, Prevent infection, Identify patient safety risks."},
  {"title": "Medication Management (MM) Standards", "content": "Standards cover medication procurement, storage, ordering, preparation, dispensing, administration, and monitoring. High-alert medications require additional safeguards."},
  {"title": "Environment of Care (EC) Standards", "content": "Requirements for safety, security, hazardous materials, emergency management, medical equipment, and utilities management."},
  {"title": "Human Resources (HR) Standards", "content": "Staff competency assessment, orientation, ongoing education, and performance evaluation requirements."},
  {"title": "Performance Improvement (PI) Standards", "content": "Organizations must collect data on performance, analyze results, and implement improvements. Quality indicators must be tracked."}
]',
'[
  {"question": "How often does Joint Commission survey behavioral health organizations?", "options": ["Annually", "Every 2 years", "Every 3 years", "Every 5 years"], "correct": 2},
  {"question": "What methodology does Joint Commission use for surveys?", "options": ["Random sampling", "Tracer methodology", "Document review only", "Staff interviews only"], "correct": 1},
  {"question": "Which is a 2024 National Patient Safety Goal?", "options": ["Reduce costs", "Identify patients correctly", "Increase admissions", "Shorten wait times"], "correct": 1}
]'),

-- SAMHSA OTP Guidelines
('SAMHSA-001', 'SAMHSA OTP Guidelines & Best Practices', 'SAMHSA guidelines for Opioid Treatment Programs including medication-assisted treatment', 'clinical', 'SAMHSA', 4.0, 240, true, 'annual', 85,
'[
  {"title": "OTP Certification Requirements", "content": "OTPs must be certified by SAMHSA and registered with DEA. Annual certification renewal requires demonstration of compliance with 42 CFR 8."},
  {"title": "Admission Criteria", "content": "Patients must have documented opioid use disorder for at least 1 year (exceptions for pregnant women, recently released from incarceration, or prior treatment). Medical evaluation required within 14 days."},
  {"title": "Dosing Guidelines", "content": "Initial dose typically 20-30mg methadone or equivalent. Dose increases should be gradual (5-10mg every 3-5 days). Maximum recommended methadone dose varies but typically 80-120mg."},
  {"title": "Take-Home Medication Criteria", "content": "Based on treatment phase, attendance, drug testing results, and clinical stability. Time in treatment requirements: 90 days for 1 take-home, 180 days for 2, etc."},
  {"title": "Counseling Requirements", "content": "Minimum of 8 individual sessions in first year. Group counseling available but does not replace individual. Treatment plans must be individualized."},
  {"title": "Drug Testing Requirements", "content": "Minimum of 8 random drug tests per year. Positive results require clinical response, not automatic discharge."}
]',
'[
  {"question": "What is the minimum time in treatment for 1 take-home dose?", "options": ["30 days", "60 days", "90 days", "180 days"], "correct": 2},
  {"question": "How many individual counseling sessions are required in the first year?", "options": ["4", "6", "8", "12"], "correct": 2},
  {"question": "Can a patient be automatically discharged for a positive drug test?", "options": ["Yes", "No - requires clinical response", "Only after 3 positives", "Only for opioids"], "correct": 1}
]'),

-- Michigan LARA Requirements
('MI-001', 'Michigan State OTP Regulations', 'State of Michigan LARA requirements for substance use disorder treatment facilities', 'policy', 'Michigan LARA', 2.5, 150, true, 'annual', 80,
'[
  {"title": "Michigan Licensing Requirements", "content": "OTPs in Michigan must be licensed by LARA (Licensing and Regulatory Affairs) in addition to federal SAMHSA certification. License renewal is annual."},
  {"title": "Staff Qualification Requirements", "content": "Michigan requires specific credentials for counselors including MCBAP certification, CADC, or licensed professional (LMSW, LPC, etc.)."},
  {"title": "Patient Rights Under Michigan Law", "content": "Michigan Mental Health Code provides additional patient rights including right to treatment in least restrictive setting, right to individualized treatment plan, and right to participate in treatment planning."},
  {"title": "Reporting Requirements", "content": "Facilities must report to Michigan BH-TEDS (Behavioral Health Treatment Episode Data Set), report critical incidents, and maintain specified patient-to-staff ratios."},
  {"title": "Medicaid Requirements", "content": "Michigan Medicaid (Healthy Michigan) has specific billing codes for OTP services. Prior authorization may be required for some services."},
  {"title": "Co-Occurring Treatment Requirements", "content": "Michigan emphasizes integrated treatment for co-occurring mental health and substance use disorders. ASAM criteria used for level of care determinations."}
]',
'[
  {"question": "Which agency licenses OTPs in Michigan?", "options": ["SAMHSA", "DEA", "LARA", "MDHHS"], "correct": 2},
  {"question": "What data system must Michigan OTPs report to?", "options": ["DAWN", "TEDS", "BH-TEDS", "PDMP"], "correct": 2},
  {"question": "What criteria does Michigan use for level of care determinations?", "options": ["LOCUS", "ASAM", "DSM-5", "ICD-10"], "correct": 1}
]'),

-- DEA Regulations
('DEA-001', 'DEA Controlled Substance Regulations', 'DEA requirements for handling, prescribing, and dispensing controlled substances', 'compliance', 'DEA', 3.0, 180, true, 'annual', 85,
'[
  {"title": "DEA Registration", "content": "All practitioners who prescribe, dispense, or administer controlled substances must be registered with DEA. OTPs receive separate DEA registration as narcotic treatment programs."},
  {"title": "Schedule Classifications", "content": "Schedule I: High abuse potential, no accepted medical use (heroin). Schedule II: High abuse potential with accepted use (methadone, fentanyl). Schedule III: Moderate potential (buprenorphine)."},
  {"title": "Prescribing Requirements", "content": "Schedule II prescriptions must be written, signed, and include patient name, drug, strength, quantity, directions, and DEA number. No refills allowed."},
  {"title": "Record Keeping Requirements", "content": "Maintain complete inventory records for 2 years. Biennial inventory required. Records must show receipt, dispensing, and disposal of all controlled substances."},
  {"title": "Security Requirements", "content": "Schedule II substances must be stored in substantially constructed, securely locked cabinet. Access limited to minimum necessary personnel."},
  {"title": "Reporting Requirements", "content": "Report theft or significant loss immediately using DEA Form 106. Participate in state PDMP programs."}
]',
'[
  {"question": "How often must a biennial inventory be conducted?", "options": ["Monthly", "Annually", "Every 2 years", "Every 3 years"], "correct": 2},
  {"question": "Which DEA form is used to report theft?", "options": ["Form 222", "Form 106", "Form 41", "Form 224"], "correct": 1},
  {"question": "Can Schedule II prescriptions be refilled?", "options": ["Yes, up to 5 times", "Yes, within 6 months", "No refills allowed", "Yes, with prior authorization"], "correct": 2}
]'),

-- Suicide Prevention
('SP-001', 'Suicide Risk Assessment & Prevention', 'Columbia Protocol and evidence-based suicide prevention strategies', 'clinical', 'Joint Commission', 2.0, 120, true, 'annual', 85,
'[
  {"title": "Suicide Risk in SUD Population", "content": "Patients with substance use disorders have significantly elevated suicide risk. Co-occurring depression, recent losses, and social isolation increase risk further."},
  {"title": "Columbia Suicide Severity Rating Scale (C-SSRS)", "content": "Validated screening tool that assesses ideation (passive, active, with intent, with plan) and behavior (actual attempts, interrupted, aborted, preparatory)."},
  {"title": "Warning Signs", "content": "IS PATH WARM: Ideation, Substance abuse, Purposelessness, Anxiety, Trapped, Hopelessness, Withdrawal, Anger, Recklessness, Mood changes."},
  {"title": "Protective Factors", "content": "Reasons for living, children, religious beliefs, fear of death, social support, therapeutic relationship, restricted access to means."},
  {"title": "Safety Planning", "content": "Collaborative development of written plan including warning signs, internal coping strategies, social contacts, professional contacts, and means restriction."},
  {"title": "Documentation Requirements", "content": "Document screening results, clinical reasoning, protective factors identified, safety plan details, and follow-up arrangements."}
]',
'[
  {"question": "What does C-SSRS stand for?", "options": ["Clinical Suicide Screening Rating System", "Columbia Suicide Severity Rating Scale", "Comprehensive Suicide Safety Risk Score", "Clinical Safety Severity Rating Scale"], "correct": 1},
  {"question": "Which is NOT part of IS PATH WARM?", "options": ["Hopelessness", "Trapped", "Medication", "Anger"], "correct": 2},
  {"question": "What should be included in a safety plan?", "options": ["Only crisis hotline numbers", "Warning signs and coping strategies", "Patient signature only", "Diagnosis codes"], "correct": 1}
]'),

-- Emergency Response
('ER-001', 'Overdose Response & Naloxone Administration', 'Emergency response protocols for opioid overdose including Narcan administration', 'safety', 'SAMHSA', 1.5, 90, true, 'biannual', 90,
'[
  {"title": "Recognizing Opioid Overdose", "content": "Signs include: unresponsive to stimuli, slow/shallow/no breathing, blue or grayish skin (especially lips and fingertips), pinpoint pupils, gurgling or snoring sounds."},
  {"title": "Initial Response Steps", "content": "1. Check responsiveness (sternal rub). 2. Call 911. 3. Administer naloxone. 4. Provide rescue breathing if needed. 5. Place in recovery position if breathing."},
  {"title": "Naloxone Administration", "content": "Intranasal: 4mg spray in one nostril. IM: 0.4-2mg in shoulder or thigh. May repeat every 2-3 minutes if no response. Effects last 30-90 minutes."},
  {"title": "Post-Naloxone Care", "content": "Monitor for re-sedation as naloxone wears off faster than opioids. Patient may experience withdrawal symptoms. Do not leave patient alone."},
  {"title": "Documentation Requirements", "content": "Document time of discovery, symptoms observed, interventions provided, naloxone doses given, patient response, and disposition."},
  {"title": "Good Samaritan Laws", "content": "Michigan has Good Samaritan protections for individuals who call 911 for overdoses. Understand these protections and educate patients."}
]',
'[
  {"question": "What is the dose of intranasal naloxone?", "options": ["2mg", "4mg", "8mg", "0.4mg"], "correct": 1},
  {"question": "How soon can you repeat a naloxone dose?", "options": ["Every 30 seconds", "Every 2-3 minutes", "Every 10 minutes", "Only once"], "correct": 1},
  {"question": "Why monitor patients after naloxone administration?", "options": ["Allergic reactions", "Re-sedation as naloxone wears off", "Infection risk", "Legal requirements only"], "correct": 1}
]')

ON CONFLICT (module_code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  content = EXCLUDED.content,
  quiz_questions = EXCLUDED.quiz_questions,
  updated_at = NOW();
