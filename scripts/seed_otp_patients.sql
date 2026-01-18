-- Seed OTP patients for testing
-- Run this script to add sample patients for the OTP billing page

INSERT INTO patients (
  id,
  first_name,
  last_name,
  date_of_birth,
  phone,
  email,
  gender,
  address,
  insurance_provider,
  insurance_id
) VALUES 
  (
    gen_random_uuid(),
    'Michael',
    'Johnson',
    '1985-03-15',
    '555-0101',
    'michael.johnson@email.com',
    'Male',
    '123 Main St, New York, NY 10001',
    'Medicare',
    'MED-123456'
  ),
  (
    gen_random_uuid(),
    'Sarah',
    'Williams',
    '1990-07-22',
    '555-0102',
    'sarah.williams@email.com',
    'Female',
    '456 Oak Ave, Brooklyn, NY 11201',
    'Medicaid',
    'MCD-789012'
  ),
  (
    gen_random_uuid(),
    'James',
    'Brown',
    '1978-11-08',
    '555-0103',
    'james.brown@email.com',
    'Male',
    '789 Pine Rd, Queens, NY 11375',
    'Blue Cross',
    'BC-345678'
  ),
  (
    gen_random_uuid(),
    'Emily',
    'Davis',
    '1992-05-30',
    '555-0104',
    'emily.davis@email.com',
    'Female',
    '321 Elm St, Bronx, NY 10451',
    'Aetna',
    'AET-901234'
  ),
  (
    gen_random_uuid(),
    'Robert',
    'Martinez',
    '1982-09-14',
    '555-0105',
    'robert.martinez@email.com',
    'Male',
    '654 Maple Dr, Staten Island, NY 10301',
    'United Healthcare',
    'UHC-567890'
  ),
  (
    gen_random_uuid(),
    'Jennifer',
    'Garcia',
    '1988-01-25',
    '555-0106',
    'jennifer.garcia@email.com',
    'Female',
    '987 Cedar Ln, Manhattan, NY 10019',
    'Medicare',
    'MED-234567'
  ),
  (
    gen_random_uuid(),
    'David',
    'Anderson',
    '1975-12-03',
    '555-0107',
    'david.anderson@email.com',
    'Male',
    '147 Birch Way, Brooklyn, NY 11215',
    'Medicaid',
    'MCD-890123'
  ),
  (
    gen_random_uuid(),
    'Lisa',
    'Thompson',
    '1995-06-18',
    '555-0108',
    'lisa.thompson@email.com',
    'Female',
    '258 Walnut Ave, Queens, NY 11354',
    'Cigna',
    'CIG-456789'
  ),
  (
    gen_random_uuid(),
    'Christopher',
    'Taylor',
    '1980-04-07',
    '555-0109',
    'christopher.taylor@email.com',
    'Male',
    '369 Spruce St, Bronx, NY 10467',
    'Humana',
    'HUM-012345'
  ),
  (
    gen_random_uuid(),
    'Amanda',
    'Wilson',
    '1993-08-29',
    '555-0110',
    'amanda.wilson@email.com',
    'Female',
    '741 Ash Blvd, Manhattan, NY 10022',
    'Kaiser',
    'KAI-678901'
  )
ON CONFLICT (id) DO NOTHING;

-- Verify the insert
SELECT COUNT(*) as patient_count FROM patients;
