-- First, add client numbers to all existing patients if they don't have them
DO $$
BEGIN
  UPDATE patients 
  SET client_number = CONCAT('OTP-', LPAD(CAST(id::text AS TEXT), 8, '0'))
  WHERE client_number IS NULL OR client_number = '';
END $$;

-- Insert Michael Thompson with full 42 CFR Part 2 compliant data
INSERT INTO patients (
  id,
  first_name, 
  last_name, 
  date_of_birth, 
  gender, 
  phone, 
  email, 
  address,
  client_number,
  created_at,
  updated_at
) VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Michael',
  'Thompson', 
  '1985-07-15',
  'Male',
  '313-555-0199',
  'michael.thompson@test.com',
  '789 Maple Street, Detroit, MI 48201',
  'OTP-000001',
  NOW(),
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  client_number = EXCLUDED.client_number,
  updated_at = NOW();

-- Add some vital signs for Michael Thompson
INSERT INTO vital_signs (patient_id, measurement_date, systolic_bp, diastolic_bp, heart_rate, respiratory_rate, temperature, oxygen_saturation, weight, bmi)
SELECT 
  '00000000-0000-0000-0000-000000000001'::uuid,
  NOW() - (interval '1 day' * n),
  120 + (random() * 40 - 20)::int,
  80 + (random() * 20 - 10)::int,
  70 + (random() * 20 - 10)::int,
  16 + (random() * 4 - 2)::int,
  98.6 + (random() * 2 - 1),
  95 + (random() * 5)::int,
  180 + (random() * 10 - 5),
  25.5 + (random() * 2 - 1)
FROM generate_series(1, 30) n
ON CONFLICT DO NOTHING;

-- Add medications for Michael Thompson  
INSERT INTO medications (patient_id, medication_name, dosage, frequency, start_date, status)
VALUES 
  ('00000000-0000-0000-0000-000000000001'::uuid, 'Methadone', '80mg', 'Daily', '2024-11-15', 'active'),
  ('00000000-0000-0000-0000-000000000001'::uuid, 'Clonidine', '0.1mg', 'Twice daily', '2024-11-15', 'active')
ON CONFLICT DO NOTHING;

-- Add OTP admission record
INSERT INTO otp_admissions (patient_id, admission_date, medication, initial_dose, status, primary_substance)
VALUES 
  ('00000000-0000-0000-0000-000000000001'::uuid, '2024-11-15', 'Methadone', 30, 'active', 'Heroin')
ON CONFLICT DO NOTHING;
