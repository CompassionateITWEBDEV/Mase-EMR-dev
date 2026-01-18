-- Insert common MIPS quality measures for 2025
INSERT INTO quality_measures (measure_id, measure_name, specialty, category, description, numerator_logic, denominator_logic) VALUES
-- Behavioral Health / MAT Measures
('MH001', 'Depression Screening and Follow-up', 'Behavioral Health', 'process', 'Percentage of patients screened for clinical depression using a standardized tool AND if positive, a follow-up plan is documented', 'Patients with documented depression screening AND follow-up plan if positive', 'All patients aged 12 and older'),
('SUD001', 'Substance Use Screening', 'Behavioral Health', 'process', 'Percentage of patients who were screened for substance use using a standardized screening tool', 'Patients with documented substance use screening', 'All patients aged 12 and older'),
('MH003', 'Suicide Risk Assessment', 'Behavioral Health', 'outcome', 'Percentage of patients with a documented suicide risk assessment', 'Patients with documented suicide risk assessment', 'Patients with depression diagnosis or behavioral health visit'),

-- Primary Care Measures
('PC001', 'Diabetes: HbA1c Control (<8%)', 'Primary Care', 'outcome', 'Percentage of patients 18-75 years with diabetes who had HbA1c < 8%', 'Patients with most recent HbA1c < 8%', 'Patients aged 18-75 with diabetes diagnosis'),
('PC002', 'Blood Pressure Control', 'Primary Care', 'outcome', 'Percentage of patients 18-85 with hypertension whose BP was <140/90', 'Patients with most recent BP < 140/90 mmHg', 'Patients aged 18-85 with hypertension diagnosis'),
('PC003', 'Colorectal Cancer Screening', 'Primary Care', 'process', 'Percentage of patients 45-75 who had appropriate colorectal cancer screening', 'Patients with documented colonoscopy, FIT, or other approved screening', 'Patients aged 45-75'),
('PC004', 'Breast Cancer Screening', 'Primary Care', 'process', 'Percentage of women 50-74 who had mammogram in past 27 months', 'Female patients with documented mammogram', 'Female patients aged 50-74'),

-- Cardiology Measures
('CARD001', 'Statin Therapy for Cardiovascular Disease', 'Cardiology', 'process', 'Percentage of patients with cardiovascular disease prescribed statin therapy', 'Patients prescribed statin medication', 'Patients with ASCVD or diabetes aged 40-75'),
('CARD002', 'Cardiac Rehabilitation Referral', 'Cardiology', 'process', 'Percentage of patients referred to cardiac rehab after MI or cardiac surgery', 'Patients with documented cardiac rehab referral', 'Patients with MI, PCI, CABG, or valve surgery'),

-- OB/GYN Measures
('OB001', 'Prenatal Immunization Status', 'OB/GYN', 'process', 'Percentage of pregnant patients who received Tdap and influenza vaccines', 'Pregnant patients with documented Tdap AND flu vaccine', 'All pregnant patients'),
('OB002', 'Postpartum Depression Screening', 'OB/GYN', 'process', 'Percentage of patients screened for postpartum depression', 'Patients with documented PPD screening at postpartum visit', 'Patients with delivery in past 12 weeks'),

-- Pediatrics Measures
('PED001', 'Childhood Immunization Status', 'Pediatrics', 'process', 'Percentage of children who turned 2 during measurement year who received all recommended vaccines', 'Patients with all vaccines completed', 'Children who turned 2 years old'),
('PED002', 'Weight Assessment for Children', 'Pediatrics', 'process', 'Percentage of patients 3-17 with BMI percentile documented', 'Patients with documented BMI percentile', 'Patients aged 3-17 years'),

-- Psychiatry Measures
('PSY001', 'Metabolic Monitoring for Antipsychotics', 'Psychiatry', 'process', 'Percentage of patients on antipsychotics with annual metabolic monitoring', 'Patients with documented glucose and lipid panel in past year', 'Patients prescribed antipsychotic medications'),
('PSY002', 'Anxiety Screening', 'Psychiatry', 'process', 'Percentage of patients screened for anxiety using validated tool', 'Patients with documented anxiety screening (GAD-7 or similar)', 'Patients aged 18 and older'),

-- Podiatry Measures
('POD001', 'Diabetic Foot Exam', 'Podiatry', 'process', 'Percentage of diabetic patients who received comprehensive foot exam', 'Patients with documented comprehensive foot exam including monofilament and vascular assessment', 'Patients with diabetes diagnosis')
ON CONFLICT DO NOTHING;
