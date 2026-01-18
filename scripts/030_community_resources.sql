-- Community Resources: Food Banks and Shelters
-- Purpose: Store emergency housing and food assistance locations

-- Drop existing tables if they exist
DROP TABLE IF EXISTS food_banks CASCADE;
DROP TABLE IF EXISTS shelters CASCADE;

-- Food Banks Table
CREATE TABLE food_banks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'Michigan',
  zip_code TEXT NOT NULL,
  phone TEXT,
  hours TEXT,
  services TEXT[], -- ["food pantry", "hot meals", "nutrition education"]
  eligibility_requirements TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  website TEXT,
  last_verified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Shelters Table
CREATE TABLE shelters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  shelter_type TEXT NOT NULL, -- "emergency", "transitional", "permanent_supportive"
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL DEFAULT 'Michigan',
  zip_code TEXT NOT NULL,
  phone TEXT,
  phone_24_7 TEXT,
  capacity INTEGER,
  current_availability INTEGER,
  accepts_families BOOLEAN DEFAULT false,
  accepts_singles BOOLEAN DEFAULT true,
  accepts_men BOOLEAN DEFAULT true,
  accepts_women BOOLEAN DEFAULT true,
  accepts_children BOOLEAN DEFAULT false,
  accepts_pets BOOLEAN DEFAULT false,
  services TEXT[], -- ["case management", "meals", "showers", "laundry"]
  eligibility_requirements TEXT,
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  website TEXT,
  last_verified TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Sample Food Banks Data
INSERT INTO food_banks (name, address, city, zip_code, phone, hours, services) VALUES
('Gleaners Community Food Bank - Detroit', '2131 Beaufait St', 'Detroit', '48207', '(313) 923-3535', 'Mon-Fri 9am-4pm', ARRAY['food pantry', 'emergency food', 'nutrition education']),
('Focus: HOPE Food Center', '1550 Oakman Blvd', 'Detroit', '48238', '(313) 494-4600', 'Mon-Fri 8:30am-4pm', ARRAY['food pantry', 'senior meals', 'commodity foods']),
('Forgotten Harvest', '21800 Greenfield Rd', 'Oak Park', '48237', '(248) 967-1500', 'Daily 9am-5pm', ARRAY['food rescue', 'hot meals', 'fresh produce']),
('Capuchin Soup Kitchen', '4390 Conner St', 'Detroit', '48215', '(313) 579-2100', 'Daily 9am-3pm', ARRAY['hot meals', 'food pantry', 'clothing']),
('Feeding America West Michigan', '864 West River Center Dr NE', 'Grand Rapids', '49504', '(616) 784-3250', 'Mon-Fri 8am-5pm', ARRAY['food pantry', 'mobile pantry', 'kids cafe']);

-- Sample Shelters Data
INSERT INTO shelters (name, shelter_type, address, city, zip_code, phone, phone_24_7, capacity, current_availability, accepts_families, accepts_singles, accepts_men, accepts_women, accepts_children, services) VALUES
('Cass Community Social Services', 'emergency', '11850 Woodrow Wilson St', 'Detroit', '48206', '(313) 883-2277', '(313) 883-2277', 120, 15, true, true, true, true, true, ARRAY['case management', 'meals', 'showers', 'laundry', 'job assistance']),
('Detroit Rescue Mission Ministries', 'emergency', '150 Stimson St', 'Detroit', '48201', '(313) 993-6703', '(313) 993-6703', 200, 30, false, true, true, false, false, ARRAY['meals', 'addiction recovery', 'job training', 'spiritual counseling']),
('Shelter of Flint', 'emergency', '511 E Fifth Ave', 'Flint', '48503', '(810) 239-2437', '(810) 239-2437', 50, 8, true, true, true, true, true, ARRAY['case management', 'meals', 'childcare', 'transportation']),
('Lighthouse of Oakland County', 'transitional', '20 Baldwin Ave', 'Pontiac', '48342', '(248) 338-6700', '(248) 338-6700', 75, 12, true, true, true, true, true, ARRAY['housing assistance', 'job training', 'mental health services']),
('Mel Trotter Ministries', 'emergency', '225 Commerce Ave SW', 'Grand Rapids', '49503', '(616) 454-8249', '(616) 454-8249', 150, 25, true, true, true, true, true, ARRAY['meals', 'medical care', 'addiction recovery', 'job placement']),
('SOS Community Services', 'emergency', '28050 Grand River Ave', 'Farmington Hills', '48336', '(248) 474-2687', '(248) 474-2687', 40, 6, true, true, true, true, true, ARRAY['meals', 'case management', 'housing navigation', 'financial assistance']);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_food_banks_city ON food_banks(city);
CREATE INDEX IF NOT EXISTS idx_food_banks_zip ON food_banks(zip_code);
CREATE INDEX IF NOT EXISTS idx_food_banks_active ON food_banks(active);

CREATE INDEX IF NOT EXISTS idx_shelters_city ON shelters(city);
CREATE INDEX IF NOT EXISTS idx_shelters_zip ON shelters(zip_code);
CREATE INDEX IF NOT EXISTS idx_shelters_type ON shelters(shelter_type);
CREATE INDEX IF NOT EXISTS idx_shelters_active ON shelters(active);
CREATE INDEX IF NOT EXISTS idx_shelters_availability ON shelters(current_availability) WHERE current_availability > 0;

COMMIT;
