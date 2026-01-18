-- Seed Regulatory Updates from SAMHSA, Joint Commission, etc.

INSERT INTO regulatory_updates (source, update_type, title, summary, effective_date, compliance_deadline, priority, affected_roles, requires_training, acknowledgment_required) VALUES

('SAMHSA', 'policy_change', '2024 Updates to 42 CFR Part 2', 
'Final rule aligns Part 2 with HIPAA for treatment, payment, and healthcare operations while maintaining patient consent requirements for other disclosures.',
'2024-02-16', '2024-08-16', 'high', '["all_staff"]', true, true),

('Joint Commission', 'new_requirement', '2024 National Patient Safety Goals - Behavioral Health',
'Updated NPSGs emphasize suicide risk reduction, medication safety for high-alert medications, and improved staff communication during transitions.',
'2024-01-01', '2024-03-31', 'high', '["clinical_staff", "nursing"]', true, true),

('DEA', 'guidance', 'Updated Guidance on Telemedicine Prescribing',
'Extension of COVID-era flexibilities for telemedicine prescribing of controlled substances with new requirements for in-person follow-up.',
'2024-01-01', '2024-12-31', 'normal', '["prescribers", "physicians"]', false, true),

('Michigan LARA', 'policy_change', 'Michigan Medicaid OTP Billing Updates',
'New billing codes and prior authorization requirements for OTP services under Healthy Michigan plan.',
'2024-07-01', '2024-07-01', 'high', '["billing_staff", "administration"]', true, true),

('CMS', 'new_requirement', 'Medicare OTP Bundle Payment Changes',
'Updates to weekly bundle payment rates and qualifying service requirements for 2024.',
'2024-01-01', '2024-01-01', 'normal', '["billing_staff"]', false, true),

('SAMHSA', 'alert', 'Xylazine (Tranq) Emerging Drug Threat',
'SAMHSA guidance on identifying and responding to xylazine-involved overdoses. Naloxone may not fully reverse xylazine effects.',
'2024-03-01', NULL, 'critical', '["all_staff"]', true, true),

('Joint Commission', 'guidance', 'Ligature Risk Assessment Updates',
'Updated guidance on environmental ligature risk assessments for behavioral health settings.',
'2024-04-01', '2024-06-30', 'high', '["facility_management", "clinical_staff"]', true, false)

ON CONFLICT DO NOTHING;
