-- Sample data for development and testing
-- This script adds sample patients and appointments for testing

-- Sample patients (only insert if no patients exist)
INSERT INTO public.patients (
  first_name, 
  last_name, 
  date_of_birth, 
  gender, 
  phone, 
  email, 
  address,
  emergency_contact_name,
  emergency_contact_phone,
  insurance_provider,
  insurance_id
) 
SELECT * FROM (VALUES
  ('John', 'Smith', '1985-03-15', 'Male', '555-0101', 'john.smith@email.com', '123 Main St, City, ST 12345', 'Jane Smith', '555-0102', 'Blue Cross', 'BC123456'),
  ('Sarah', 'Johnson', '1992-07-22', 'Female', '555-0201', 'sarah.johnson@email.com', '456 Oak Ave, City, ST 12345', 'Mike Johnson', '555-0202', 'Aetna', 'AE789012'),
  ('Michael', 'Brown', '1978-11-08', 'Male', '555-0301', 'michael.brown@email.com', '789 Pine Rd, City, ST 12345', 'Lisa Brown', '555-0302', 'Cigna', 'CG345678'),
  ('Emily', 'Davis', '1990-05-12', 'Female', '555-0401', 'emily.davis@email.com', '321 Elm St, City, ST 12345', 'Tom Davis', '555-0402', 'United Healthcare', 'UH901234'),
  ('Robert', 'Wilson', '1965-09-30', 'Male', '555-0501', 'robert.wilson@email.com', '654 Maple Dr, City, ST 12345', 'Carol Wilson', '555-0502', 'Medicare', 'MC567890')
) AS sample_data(first_name, last_name, date_of_birth, gender, phone, email, address, emergency_contact_name, emergency_contact_phone, insurance_provider, insurance_id)
WHERE NOT EXISTS (SELECT 1 FROM public.patients LIMIT 1);
