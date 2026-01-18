-- Create facility_inventory table for tracking medical supplies, medications, and equipment
CREATE TABLE IF NOT EXISTS facility_inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL CHECK (category IN ('medical', 'vaccines', 'cleaning', 'medications', 'wound-care')),
  quantity INTEGER NOT NULL DEFAULT 0,
  unit_of_measure VARCHAR(50) NOT NULL,
  reorder_level INTEGER NOT NULL DEFAULT 10,
  expiration_date DATE,
  lot_number VARCHAR(100),
  storage_location VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster category lookups
CREATE INDEX IF NOT EXISTS idx_facility_inventory_category ON facility_inventory(category);

-- Create index for low stock alerts
CREATE INDEX IF NOT EXISTS idx_facility_inventory_low_stock ON facility_inventory(quantity, reorder_level);

-- Create index for expiration tracking
CREATE INDEX IF NOT EXISTS idx_facility_inventory_expiration ON facility_inventory(expiration_date);

-- Insert sample inventory data
INSERT INTO facility_inventory (item_name, category, quantity, unit_of_measure, reorder_level, expiration_date, lot_number, storage_location) VALUES
('Influenza Vaccine 2024-25', 'vaccines', 8, 'doses', 25, '2025-06-30', 'FLU-2024-A', 'Refrigerator Unit A'),
('Hepatitis B Vaccine', 'vaccines', 67, 'doses', 30, '2025-08-15', 'HEP-2024-B', 'Refrigerator Unit A'),
('Tetanus Vaccine (Td)', 'vaccines', 42, 'doses', 25, '2025-11-20', 'TET-2024-C', 'Refrigerator Unit A'),
('Hand Sanitizer (Gallon)', 'cleaning', 3, 'gallons', 15, NULL, NULL, 'Janitorial Closet'),
('Disinfectant Wipes (Large Container)', 'cleaning', 34, 'containers', 20, NULL, NULL, 'Supply Room A'),
('Surface Disinfectant Spray', 'cleaning', 28, 'bottles', 15, NULL, NULL, 'Janitorial Closet'),
('Mop Heads (Microfiber)', 'cleaning', 12, 'units', 10, NULL, NULL, 'Janitorial Closet'),
('Acetaminophen 500mg', 'medications', 45, 'tablets', 100, '2025-12-31', 'ACE-2024-01', 'Medication Cart 2'),
('Ibuprofen 200mg', 'medications', 78, 'tablets', 100, '2025-10-15', 'IBU-2024-02', 'Medication Cart 2'),
('Diphenhydramine 25mg', 'medications', 92, 'tablets', 75, '2026-02-28', 'DIP-2024-03', 'Medication Cart 1'),
('Sterile Gauze Pads (4x4)', 'wound-care', 12, 'boxes', 30, NULL, NULL, 'Supply Room B'),
('Medical Tape (1 inch)', 'wound-care', 42, 'rolls', 25, NULL, NULL, 'Supply Room B'),
('Adhesive Bandages (Assorted)', 'wound-care', 67, 'boxes', 40, NULL, NULL, 'Supply Room A'),
('Sterile Gloves (Size M)', 'medical', 156, 'boxes', 50, NULL, NULL, 'Supply Room A'),
('Disposable Face Masks', 'medical', 342, 'boxes', 100, NULL, NULL, 'Supply Room A'),
('Digital Thermometers', 'medical', 23, 'units', 15, NULL, NULL, 'Med Room Cabinet A');

COMMENT ON TABLE facility_inventory IS 'Tracks facility supplies including medical supplies, flu shots, cleaning supplies, generic medications, and wound care supplies with automatic low stock alerts';
