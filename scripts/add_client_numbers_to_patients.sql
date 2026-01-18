-- Add client numbers to existing patients if they don't have them
UPDATE patients 
SET client_number = CONCAT('OTP-', LPAD(CAST(ROW_NUMBER() OVER (ORDER BY created_at) AS TEXT), 6, '0'))
WHERE client_number IS NULL;

-- Ensure Michael Thompson exists with proper client number
INSERT INTO patients (
  first_name, 
  last_name, 
  date_of_birth, 
  gender, 
  phone, 
  email, 
  address,
  client_number
) VALUES (
  'Michael',
  'Thompson', 
  '1985-07-15',
  'Male',
  '555-0199',
  'michael.thompson@test.com',
  '789 Maple Street',
  'OTP-000001'
) ON CONFLICT DO NOTHING;
