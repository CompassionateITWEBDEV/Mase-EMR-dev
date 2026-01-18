-- Add client_number and program_type columns to patients table if they don't exist
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS client_number VARCHAR(20),
ADD COLUMN IF NOT EXISTS program_type VARCHAR(50);

-- Create index for faster client number lookups
CREATE INDEX IF NOT EXISTS idx_patients_client_number ON patients(client_number);
CREATE INDEX IF NOT EXISTS idx_patients_program_type ON patients(program_type);

-- Update existing patients with client numbers (format: OTP-XXXX, MAT-XXXX, PC-XXXX)
-- Update Michael Thompson specifically
UPDATE patients 
SET 
  client_number = 'OTP-1001',
  program_type = 'otp'
WHERE first_name = 'Michael' AND last_name = 'Thompson';

-- Assign client numbers to other patients if they don't have them
WITH numbered_patients AS (
  SELECT 
    id,
    CASE 
      WHEN client_number IS NULL THEN 
        'OTP-' || LPAD((ROW_NUMBER() OVER (ORDER BY created_at))::text, 4, '0')
      ELSE client_number
    END as new_client_number
  FROM patients
  WHERE client_number IS NULL
)
UPDATE patients p
SET client_number = np.new_client_number
FROM numbered_patients np
WHERE p.id = np.id;

-- Set default program type for patients without one
UPDATE patients 
SET program_type = 'otp' 
WHERE program_type IS NULL;
