-- Seed test patients for development
-- Run this script to add sample patient data

INSERT INTO patients (id, first_name, last_name, date_of_birth, gender, phone, email, address, emergency_contact_name, emergency_contact_phone, insurance_provider, insurance_id)
VALUES 
  (gen_random_uuid(), 'John', 'Smith', '1985-03-15', 'male', '555-0101', 'john.smith@email.com', '123 Main St, City, ST 12345', 'Jane Smith', '555-0102', 'Blue Cross', 'BC123456'),
  (gen_random_uuid(), 'Sarah', 'Johnson', '1990-07-22', 'female', '555-0103', 'sarah.j@email.com', '456 Oak Ave, Town, ST 12346', 'Mike Johnson', '555-0104', 'Aetna', 'AET789012'),
  (gen_random_uuid(), 'Michael', 'Williams', '1978-11-08', 'male', '555-0105', 'm.williams@email.com', '789 Pine Rd, Village, ST 12347', 'Lisa Williams', '555-0106', 'United Healthcare', 'UHC345678'),
  (gen_random_uuid(), 'Emily', 'Brown', '1995-02-28', 'female', '555-0107', 'emily.b@email.com', '321 Elm St, Borough, ST 12348', 'David Brown', '555-0108', 'Cigna', 'CIG901234'),
  (gen_random_uuid(), 'Robert', 'Davis', '1982-09-14', 'male', '555-0109', 'r.davis@email.com', '654 Maple Dr, County, ST 12349', 'Susan Davis', '555-0110', 'Humana', 'HUM567890'),
  (gen_random_uuid(), 'Jennifer', 'Miller', '1988-04-03', 'female', '555-0111', 'j.miller@email.com', '987 Cedar Ln, Metro, ST 12350', 'Tom Miller', '555-0112', 'Kaiser', 'KP123789'),
  (gen_random_uuid(), 'David', 'Garcia', '1975-12-20', 'male', '555-0113', 'd.garcia@email.com', '147 Birch Ave, District, ST 12351', 'Maria Garcia', '555-0114', 'Anthem', 'ANT456123'),
  (gen_random_uuid(), 'Lisa', 'Martinez', '1992-06-11', 'female', '555-0115', 'l.martinez@email.com', '258 Walnut St, Zone, ST 12352', 'Carlos Martinez', '555-0116', 'Blue Shield', 'BS789456'),
  (gen_random_uuid(), 'James', 'Anderson', '1980-08-25', 'male', '555-0117', 'j.anderson@email.com', '369 Spruce Rd, Area, ST 12353', 'Nancy Anderson', '555-0118', 'Molina', 'MOL012345'),
  (gen_random_uuid(), 'Amanda', 'Taylor', '1998-01-07', 'female', '555-0119', 'a.taylor@email.com', '471 Ash Dr, Region, ST 12354', 'Brian Taylor', '555-0120', 'Oscar', 'OSC678901')
ON CONFLICT DO NOTHING;
