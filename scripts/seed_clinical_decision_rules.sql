-- Insert clinical decision support rules
INSERT INTO clinical_decision_rules (rule_name, rule_type, specialty, trigger_conditions, severity, recommendation_text, evidence_source, active) VALUES
-- Drug Interaction Alerts
('Benzodiazepine-Opioid Interaction', 'drug-interaction', 'Behavioral Health', '{"medications": ["benzodiazepine", "opioid"]}', 'critical', 'WARNING: Concurrent use of benzodiazepines and opioids increases risk of respiratory depression. Consider alternative therapy or close monitoring. FDA Black Box Warning.', 'FDA Safety Communication 2016', true),
('Methadone QTc Prolongation', 'drug-interaction', 'Behavioral Health', '{"medications": ["methadone"], "qtc_interval": ">500ms"}', 'critical', 'ALERT: Methadone can prolong QTc interval. Current QTc >500ms increases risk of Torsades de Pointes. Consider dose reduction and cardiology consult.', 'SAMHSA TIP 43', true),

-- Preventive Care Reminders
('Colorectal Cancer Screening Due', 'reminder', 'Primary Care', '{"age": ">=45", "last_colonoscopy": ">10_years"}', 'medium', 'Patient is due for colorectal cancer screening. Recommend colonoscopy, FIT, or Cologuard per USPSTF guidelines.', 'USPSTF Grade A Recommendation', true),
('Mammography Screening Due', 'reminder', 'Primary Care', '{"gender": "female", "age": "50-74", "last_mammogram": ">27_months"}', 'medium', 'Patient is due for breast cancer screening. Recommend mammography per USPSTF guidelines.', 'USPSTF Grade B Recommendation', true),
('Diabetic Retinopathy Screening', 'reminder', 'Primary Care', '{"diagnosis": "diabetes", "last_eye_exam": ">12_months"}', 'medium', 'Annual dilated eye exam recommended for patients with diabetes to screen for diabetic retinopathy.', 'ADA Standards of Care', true),

-- Safety Alerts
('High-Dose Buprenorphine', 'alert', 'Behavioral Health', '{"medications": "buprenorphine", "daily_dose": ">24mg"}', 'high', 'Daily buprenorphine dose exceeds typical maximum of 24mg. Verify dose is appropriate and document clinical justification.', 'SAMHSA Guidelines', true),
('Suicide Risk Assessment Due', 'reminder', 'Psychiatry', '{"diagnosis": ["depression", "bipolar"], "last_suicide_screening": ">90_days"}', 'high', 'Patient with mood disorder diagnosis should have documented suicide risk assessment at least quarterly.', 'Joint Commission NPSGs', true),
('Pregnancy + Contraindicated Medication', 'alert', 'OB/GYN', '{"pregnant": true, "medications": ["category_X", "teratogenic"]}', 'critical', 'CRITICAL: Patient is pregnant and prescribed a contraindicated medication. Review medication list immediately.', 'FDA Pregnancy Categories', true),

-- Quality Measure Prompts
('Depression Screening Due', 'guideline', 'Behavioral Health', '{"age": ">=12", "last_phq9": ">12_months"}', 'low', 'Annual depression screening recommended using PHQ-9 or similar validated tool (MIPS Quality Measure).', 'MIPS MH001', true),
('HbA1c Test Due', 'guideline', 'Primary Care', '{"diagnosis": "diabetes", "last_hba1c": ">90_days"}', 'medium', 'Patients with diabetes should have HbA1c checked at least every 3 months if not at goal, or every 6 months if stable.', 'ADA Standards', true),
('Statin Therapy Indicated', 'guideline', 'Cardiology', '{"diagnosis": ["ASCVD", "diabetes"], "age": "40-75", "statin_prescribed": false}', 'medium', 'Consider statin therapy for ASCVD risk reduction. High-intensity statin recommended for patients with clinical ASCVD.', 'ACC/AHA Guidelines', true)
ON CONFLICT DO NOTHING;
