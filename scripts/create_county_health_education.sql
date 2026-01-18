-- County Health Staff Education and Family Education System
-- Comprehensive training for county health workers and patient/family resources

-- County Staff Education (WIC counselors, immunization nurses, public health nurses, etc.)
CREATE TABLE IF NOT EXISTS county_staff_education_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_code VARCHAR(50) UNIQUE NOT NULL,
  module_name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL, -- 'wic', 'immunization', 'std_prevention', 'maternal_child_health', 'disease_surveillance', 'environmental_health'
  description TEXT,
  learning_objectives JSONB, -- Array of learning objectives
  content JSONB, -- Structured content sections
  quiz_questions JSONB, -- Assessment questions
  passing_score INTEGER DEFAULT 80,
  ceu_hours NUMERIC(4,2) DEFAULT 0,
  duration_minutes INTEGER,
  is_required BOOLEAN DEFAULT false,
  frequency VARCHAR(50), -- 'annual', 'quarterly', 'one-time', 'biannual'
  regulatory_source VARCHAR(100), -- 'CDC', 'Michigan DHHS', 'USDA FNS', 'Oakland County'
  effective_date DATE,
  expiration_date DATE,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Track county staff training completions
CREATE TABLE IF NOT EXISTS county_staff_training_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES user_accounts(id),
  module_id UUID REFERENCES county_staff_education_modules(id),
  organization_id UUID REFERENCES organizations(id),
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  quiz_score INTEGER,
  passed BOOLEAN,
  attempts INTEGER DEFAULT 1,
  time_spent_minutes INTEGER,
  certificate_number VARCHAR(100),
  certificate_issued_at TIMESTAMPTZ,
  certificate_expires_at TIMESTAMPTZ,
  ceu_hours_earned NUMERIC(4,2),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Family/Patient Education Resources for County Health Programs
CREATE TABLE IF NOT EXISTS county_family_education_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_code VARCHAR(50) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  program_type VARCHAR(100) NOT NULL, -- 'wic', 'immunization', 'prenatal_care', 'family_planning', 'std_prevention', 'tb_management', 'child_health'
  resource_type VARCHAR(50) NOT NULL, -- 'video', 'pdf', 'infographic', 'interactive', 'checklist'
  target_audience VARCHAR(100), -- 'pregnant_women', 'parents_infants', 'children', 'adolescents', 'general_public'
  description TEXT,
  content JSONB, -- Structured educational content
  media_url TEXT, -- Link to video/PDF/image
  languages_available JSONB DEFAULT '["English"]'::JSONB, -- ['English', 'Spanish', 'Arabic']
  reading_level VARCHAR(50), -- 'elementary', 'middle_school', 'high_school', 'adult'
  duration_minutes INTEGER,
  key_messages JSONB, -- Array of key takeaways
  related_services JSONB, -- Links to county services
  is_active BOOLEAN DEFAULT true,
  view_count INTEGER DEFAULT 0,
  download_count INTEGER DEFAULT 0,
  created_by UUID REFERENCES user_accounts(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Track patient/family education completion
CREATE TABLE IF NOT EXISTS county_patient_education_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id),
  resource_id UUID REFERENCES county_family_education_resources(id),
  program_encounter_id UUID, -- References WIC visit, immunization visit, STD clinic visit, etc.
  provided_by UUID REFERENCES user_accounts(id),
  provided_date DATE DEFAULT CURRENT_DATE,
  method VARCHAR(50), -- 'in_person', 'video_shown', 'handout_given', 'portal_assigned', 'email_sent'
  patient_comprehension VARCHAR(50), -- 'understood', 'questions_answered', 'needs_followup', 'language_barrier'
  follow_up_needed BOOLEAN DEFAULT false,
  follow_up_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed County Staff Education Modules
INSERT INTO county_staff_education_modules (module_code, module_name, category, description, ceu_hours, duration_minutes, is_required, frequency, regulatory_source) VALUES
('WIC-001', 'WIC Program Fundamentals', 'wic', 'Comprehensive training on USDA WIC program eligibility, benefits, nutrition counseling, and breastfeeding support', 4.0, 240, true, 'annual', 'USDA FNS'),
('WIC-002', 'Infant Feeding and Nutrition', 'wic', 'Evidence-based guidance on infant nutrition, formula feeding, introducing solids, and growth monitoring', 2.0, 120, true, 'annual', 'CDC/AAP'),
('IMM-001', 'Vaccine Administration and Safety', 'immunization', 'Proper vaccine storage, handling, administration techniques, and adverse event management', 3.0, 180, true, 'annual', 'CDC'),
('IMM-002', 'ACIP Immunization Schedules', 'immunization', 'Current ACIP recommendations for childhood, adolescent, and adult immunizations', 2.0, 120, true, 'annual', 'CDC/ACIP'),
('STD-001', 'STI Testing and Counseling', 'std_prevention', 'Guidelines for gonorrhea, chlamydia, syphilis, and HIV testing, treatment, and partner notification', 3.0, 180, true, 'annual', 'CDC'),
('STD-002', 'PrEP and nPEP Services', 'std_prevention', 'Pre-exposure and post-exposure prophylaxis for HIV prevention, eligibility, and monitoring', 2.0, 120, true, 'annual', 'CDC'),
('MCH-001', 'Maternal and Child Health Home Visiting', 'maternal_child_health', 'Evidence-based home visiting models, SDOH screening, and family engagement strategies', 4.0, 240, true, 'annual', 'HRSA'),
('TB-001', 'Tuberculosis Case Management', 'disease_surveillance', 'TB screening, DOT (directly observed therapy), contact tracing, and LTBI treatment', 3.0, 180, true, 'annual', 'CDC/Michigan DHHS'),
('ENV-001', 'Food Safety Inspections', 'environmental_health', 'Food establishment inspections, foodborne illness investigation, and enforcement procedures', 3.0, 180, true, 'annual', 'FDA/Michigan DHHS'),
('COMM-001', 'Communicable Disease Reporting', 'disease_surveillance', 'Michigan reportable diseases, surveillance systems, outbreak investigation, and MDSS data entry', 2.0, 120, true, 'annual', 'Michigan DHHS');

-- Seed Family Education Resources
INSERT INTO county_family_education_resources (resource_code, title, program_type, resource_type, target_audience, description, languages_available, reading_level) VALUES
('WIC-FAM-001', 'What is WIC? Benefits for Your Family', 'wic', 'video', 'pregnant_women', 'Introduction to WIC program eligibility, services, and how to apply', '["English", "Spanish", "Arabic"]', 'middle_school'),
('WIC-FAM-002', 'Breastfeeding: Getting Started', 'wic', 'video', 'pregnant_women', 'Breastfeeding basics, positioning, latch, and common challenges with solutions', '["English", "Spanish"]', 'middle_school'),
('IMM-FAM-001', 'Why Vaccines Matter', 'immunization', 'infographic', 'parents_infants', 'Vaccine safety, effectiveness, and importance for community immunity', '["English", "Spanish", "Arabic"]', 'elementary'),
('IMM-FAM-002', 'Your Child''s Immunization Schedule', 'immunization', 'checklist', 'parents_infants', 'CDC-recommended vaccines from birth to 18 years with tracking checklist', '["English", "Spanish"]', 'middle_school'),
('STD-FAM-001', 'HIV Prevention: Know Your Options', 'std_prevention', 'interactive', 'adolescents', 'PrEP, PEP, condoms, testing, and treatment as prevention', '["English", "Spanish"]', 'high_school'),
('STD-FAM-002', 'STI Testing: What to Expect', 'std_prevention', 'pdf', 'adolescents', 'Information about common STI tests, confidentiality, and treatment', '["English", "Spanish", "Arabic"]', 'high_school'),
('MCH-FAM-001', 'Prenatal Care: Your Healthy Pregnancy', 'prenatal_care', 'video', 'pregnant_women', 'Importance of prenatal visits, nutrition, avoiding alcohol/tobacco, warning signs', '["English", "Spanish", "Arabic"]', 'middle_school'),
('MCH-FAM-002', 'Well-Child Visits: What to Expect', 'child_health', 'pdf', 'parents_infants', 'Growth monitoring, developmental milestones, vaccines, and anticipatory guidance', '["English", "Spanish"]', 'middle_school'),
('TB-FAM-001', 'Understanding TB Skin Test Results', 'tb_management', 'infographic', 'general_public', 'What positive and negative TB tests mean, and next steps', '["English", "Spanish", "Arabic"]', 'middle_school'),
('ENV-FAM-001', 'Food Safety at Home', 'environmental_health', 'interactive', 'general_public', 'Proper food storage, cooking temperatures, and preventing foodborne illness', '["English", "Spanish"]', 'middle_school');

-- AI Coaching Knowledge Base for County Health
CREATE TABLE IF NOT EXISTS county_health_ai_coaching_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_code VARCHAR(50) UNIQUE NOT NULL,
  program_area VARCHAR(100) NOT NULL, -- 'wic', 'immunization', 'std_clinic', 'maternal_child_health', 'tb_management', 'disease_surveillance', 'environmental_health'
  scenario_title VARCHAR(255) NOT NULL,
  scenario_description TEXT,
  clinical_guidance TEXT, -- Detailed step-by-step guidance
  regulatory_references JSONB, -- Links to CDC, USDA, Michigan DHHS guidance
  decision_tree JSONB, -- Structured decision-making flowchart
  example_cases JSONB, -- Sample patient scenarios
  common_pitfalls TEXT,
  best_practices TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed AI Coaching Scenarios for County Health
INSERT INTO county_health_ai_coaching_scenarios (scenario_code, program_area, scenario_title, scenario_description, clinical_guidance, regulatory_references, best_practices) VALUES
('WIC-AI-001', 'wic', 'WIC Eligibility Determination', 'How to assess WIC eligibility for pregnant women, infants, and children under 5', 
'1. Verify categorical eligibility (pregnant, breastfeeding, postpartum up to 6 months, infant, child under 5)
2. Assess income eligibility (at or below 185% federal poverty level OR enrolled in Medicaid/SNAP)
3. Document nutritional risk through anthropometric, biochemical, clinical, or dietary assessment
4. Complete USDA FNS-583 income verification
5. Issue WIC benefits through EBT card system',
'{"USDA_FNS": "7 CFR 246.7 Certification", "Michigan_WIC": "WIC Policy Manual Chapter 3"}',
'Always ask about Medicaid/SNAP enrollment first - adjunctive eligibility speeds up the process. Children with BMI concerns or picky eating qualify for dietary risk.'),

('IMM-AI-001', 'immunization', 'Catch-Up Immunization Scheduling', 'Creating catch-up schedules for children with delayed or missed vaccines',
'1. Review MCIR (Michigan Care Improvement Registry) for existing immunization history
2. Determine child''s current age and vaccines needed per ACIP schedule
3. Apply minimum interval rules between doses (4 weeks for most vaccines, 6 months for hepatitis B series)
4. Prioritize high-risk vaccines (MMR, Varicella, Tdap, HPV)
5. Schedule next appointment to continue catch-up series',
'{"CDC": "General Best Practice Guidelines for Immunization", "ACIP": "Catch-up Immunization Schedule"}',
'Use CDC''s Catch-up Scheduler tool for complex cases. Can give multiple vaccines same day in different limbs. Space live vaccines 28 days apart if not given same day.'),

('STD-AI-001', 'std_clinic', 'STI Partner Notification and Contact Tracing', 'Managing partner notification for positive STI results',
'1. Assess patient willingness for partner notification (patient referral vs provider referral)
2. Obtain names and contact information for sexual partners from past 60 days (gonorrhea/chlamydia) or 90 days (syphilis)
3. Offer expedited partner therapy (EPT) - prescription for partners without exam
4. Document partner notification in confidential system
5. Follow up to ensure partners received treatment',
'{"CDC": "Partner Services Guidelines", "Michigan_Law": "MCL 333.5111 - EPT Authorization"}',
'EPT is legal in Michigan for gonorrhea and chlamydia but NOT syphilis. Maintain strict confidentiality - never reveal index patient identity to partners.'),

('MCH-AI-001', 'maternal_child_health', 'Postpartum Depression Screening and Referral', 'EPDS screening and connecting mothers to mental health services',
'1. Administer Edinburgh Postnatal Depression Scale (EPDS) at home visits
2. Score EPDS (cutoff 10+ indicates possible depression, question 10 screens suicide risk)
3. If positive: assess safety, social support, and barriers to care
4. Provide warm handoff to Maternal Mental Health Team or community mental health
5. Follow up within 1 week to confirm connection to services',
'{"ACOG": "Perinatal Depression Screening Guidelines", "HRSA": "MIECHV Home Visiting Standards"}',
'Question 10 on EPDS screens for self-harm thoughts - ALWAYS address immediately if endorsed. Perinatal depression is treatable and screening saves lives.'),

('TB-AI-001', 'tb_management', 'Tuberculosis Contact Investigation', 'Identifying and testing TB contacts after positive case',
'1. Interview index case to identify close contacts (household members, coworkers)
2. Prioritize testing for high-risk contacts (children under 5, immunocompromised, prolonged exposure)
3. Administer tuberculin skin test (TST) or IGRA blood test
4. Repeat testing 8-12 weeks after last exposure (window period)
5. Offer LTBI treatment (isoniazid or rifampin) for positive contacts without active TB',
'{"CDC": "TB Contact Investigation Guidelines", "Michigan_DHHS": "TB Control Program Manual"}',
'Concentric circle approach - start with household contacts, then expand to close contacts. Children under 5 with exposure should start LTBI treatment even with negative initial test (window period).'),

('ENV-AI-001', 'environmental_health', 'Foodborne Illness Outbreak Investigation', 'Steps to investigate suspected food poisoning outbreak',
'1. Confirm outbreak (2+ cases with similar symptoms linked to same food/location)
2. Conduct case interviews using standardized questionnaire (foods eaten, onset time)
3. Inspect food establishment - check temperatures, cross-contamination, employee illness
4. Collect food samples if available
5. Coordinate with state lab for testing
6. Implement control measures (close facility if imminent health hazard)
7. Follow up to verify correction of violations',
'{"FDA": "Food Code 2022", "Michigan_Food_Law": "PA 92 of 2000"}',
'Act quickly - most pathogens shed evidence within 24-48 hours. Salmonella, E. coli, and norovirus are most common. Always check employee handwashing and exclude sick food workers.');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_county_staff_training_staff ON county_staff_training_progress(staff_id);
CREATE INDEX IF NOT EXISTS idx_county_patient_education_patient ON county_patient_education_tracking(patient_id);
CREATE INDEX IF NOT EXISTS idx_county_family_resources_program ON county_family_education_resources(program_type);
CREATE INDEX IF NOT EXISTS idx_county_ai_scenarios_program ON county_health_ai_coaching_scenarios(program_area);

COMMENT ON TABLE county_staff_education_modules IS 'Training modules for WIC counselors, immunization nurses, STD clinic staff, and other county health workers';
COMMENT ON TABLE county_family_education_resources IS 'Patient and family education materials in multiple languages for county health programs';
COMMENT ON TABLE county_health_ai_coaching_scenarios IS 'AI coaching knowledge base for county health workflows and clinical decision support';
