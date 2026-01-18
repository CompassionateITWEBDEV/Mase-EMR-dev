-- Migration Script: Convert Patient Numbers to New Format (PREFIX-0000)
-- This script migrates existing patient numbers from old format (PREFIX-XXX-YYYY) 
-- to new format (PREFIX-0000) based on program_type
-- 
-- Format mapping:
-- - OTP patients: OTP-0001, OTP-0002, etc.
-- - MAT patients: MAT-0001, MAT-0002, etc.
-- - Primary Care patients: PC-0001, PC-0002, etc.

-- Step 1: Ensure program_type column exists and has default values
ALTER TABLE patients 
ADD COLUMN IF NOT EXISTS program_type VARCHAR(50);

-- Set default program_type for patients without one
UPDATE patients 
SET program_type = 'otp' 
WHERE program_type IS NULL OR program_type = '';

-- Step 2: Create a function to parse and convert patient numbers
-- This handles both old format (PREFIX-XXX-YYYY) and new format (PREFIX-0000)
CREATE OR REPLACE FUNCTION parse_patient_number(client_num TEXT, prefix TEXT)
RETURNS INTEGER AS $$
DECLARE
  parsed_num INTEGER;
BEGIN
  -- Try new format: PREFIX-0000
  IF client_num ~ ('^' || prefix || '-\d{4}$') THEN
    parsed_num := CAST(SUBSTRING(client_num FROM LENGTH(prefix) + 2) AS INTEGER);
    RETURN parsed_num;
  END IF;
  
  -- Try old format: PREFIX-XXX-YYYY
  IF client_num ~ ('^' || prefix || '-\d{3}-\d{4}$') THEN
    DECLARE
      group_part TEXT;
      seq_part TEXT;
      group_num INTEGER;
      seq_num INTEGER;
    BEGIN
      -- Extract group and sequence parts
      group_part := SUBSTRING(client_num FROM LENGTH(prefix) + 2 FOR 3);
      seq_part := SUBSTRING(client_num FROM LENGTH(prefix) + 6);
      
      group_num := CAST(group_part AS INTEGER);
      seq_num := CAST(seq_part AS INTEGER);
      
      -- Convert old format to sequential: (group-1)*1000 + sequence
      parsed_num := (group_num - 1) * 1000 + seq_num;
      RETURN parsed_num;
    END;
  END IF;
  
  -- Invalid format
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Step 3: Get prefix based on program_type
CREATE OR REPLACE FUNCTION get_program_prefix(prog_type TEXT)
RETURNS TEXT AS $$
BEGIN
  IF prog_type IS NULL OR prog_type = '' THEN
    RETURN 'OTP';
  END IF;
  
  CASE LOWER(TRIM(prog_type))
    WHEN 'otp' THEN RETURN 'OTP';
    WHEN 'mat' THEN RETURN 'MAT';
    WHEN 'primary_care', 'primary care' THEN RETURN 'PC';
    ELSE RETURN 'OTP';
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Migrate patient numbers by program type
-- This will assign sequential numbers starting from 0001 for each program type

DO $$
DECLARE
  prog_type_record RECORD;
  patient_record RECORD;
  prefix TEXT;
  max_number INTEGER;
  new_number INTEGER;
  new_client_number TEXT;
  counter INTEGER;
BEGIN
  -- Process each program type separately
  FOR prog_type_record IN 
    SELECT DISTINCT COALESCE(program_type, 'otp') as pt FROM patients
  LOOP
    prefix := get_program_prefix(prog_type_record.pt);
    max_number := 0;
    counter := 0;
    
    -- Find the maximum existing number for this program type
    FOR patient_record IN
      SELECT id, client_number, program_type
      FROM patients
      WHERE COALESCE(program_type, 'otp') = prog_type_record.pt
        AND client_number IS NOT NULL
        AND client_number != ''
    LOOP
      DECLARE
        parsed_num INTEGER;
      BEGIN
        parsed_num := parse_patient_number(patient_record.client_number, prefix);
        IF parsed_num IS NOT NULL AND parsed_num > max_number THEN
          max_number := parsed_num;
        END IF;
      END;
    END LOOP;
    
    -- Now assign new sequential numbers starting from max_number + 1
    -- But we want to start fresh from 0001 for each program type
    -- So we'll reassign all numbers sequentially
    
    -- First, clear existing numbers for this program type (we'll regenerate them)
    -- Actually, let's be smarter - only update numbers that need changing
    
    -- Assign sequential numbers to all patients of this program type
    FOR patient_record IN
      SELECT id, client_number, program_type
      FROM patients
      WHERE COALESCE(program_type, 'otp') = prog_type_record.pt
      ORDER BY created_at, id
    LOOP
      counter := counter + 1;
      new_number := counter;
      new_client_number := prefix || '-' || LPAD(new_number::TEXT, 4, '0');
      
      -- Only update if the number is different
      IF patient_record.client_number IS NULL 
         OR patient_record.client_number != new_client_number
         OR NOT (patient_record.client_number ~ ('^' || prefix || '-')) THEN
        UPDATE patients
        SET client_number = new_client_number
        WHERE id = patient_record.id;
        
        RAISE NOTICE 'Updated patient %: % -> %', patient_record.id, 
                     COALESCE(patient_record.client_number, 'NULL'), new_client_number;
      END IF;
    END LOOP;
    
    RAISE NOTICE 'Completed migration for program type: % (prefix: %), assigned % numbers', 
                 prog_type_record.pt, prefix, counter;
  END LOOP;
  
  RAISE NOTICE 'Patient number migration completed successfully';
END $$;

-- Step 5: Clean up temporary functions (optional - you may want to keep them)
-- DROP FUNCTION IF EXISTS parse_patient_number(TEXT, TEXT);
-- DROP FUNCTION IF EXISTS get_program_prefix(TEXT);

-- Step 6: Verify migration results
SELECT 
  program_type,
  COUNT(*) as total_patients,
  COUNT(client_number) as patients_with_numbers,
  MIN(client_number) as min_number,
  MAX(client_number) as max_number
FROM patients
GROUP BY program_type
ORDER BY program_type;

-- Step 7: Check for any patients without numbers
SELECT 
  id,
  first_name,
  last_name,
  program_type,
  client_number
FROM patients
WHERE client_number IS NULL OR client_number = ''
ORDER BY created_at;
