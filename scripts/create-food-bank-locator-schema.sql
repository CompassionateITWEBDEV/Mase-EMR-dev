-- Food Bank Locator Schema

-- Food banks and meal programs
CREATE TABLE IF NOT EXISTS public.food_banks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_name VARCHAR(255) NOT NULL,
  food_bank_type VARCHAR(50) NOT NULL, -- food_bank, pantry, soup_kitchen, meal_program, meal_delivery
  address TEXT NOT NULL,
  city VARCHAR(100),
  state VARCHAR(2),
  zip_code VARCHAR(10),
  phone VARCHAR(20),
  email VARCHAR(255),
  website TEXT,
  
  -- Location data
  latitude NUMERIC(10, 7),
  longitude NUMERIC(10, 7),
  geofence_radius_meters INTEGER DEFAULT 500,
  
  -- Capacity and services
  serves_per_month INTEGER,
  services JSONB, -- emergency_food, fresh_produce, hot_meals, etc.
  eligibility_criteria TEXT,
  accepts_walk_ins BOOLEAN DEFAULT true,
  requires_registration BOOLEAN DEFAULT false,
  requires_id BOOLEAN DEFAULT false,
  requires_proof_of_residence BOOLEAN DEFAULT false,
  
  -- Hours
  hours_of_operation JSONB, -- {monday: "9AM-5PM", tuesday: "9AM-5PM", ...}
  
  -- Additional info
  languages_spoken TEXT[],
  accessibility_features TEXT[], -- wheelchair, parking, public_transit
  special_programs TEXT[], -- seniors, children, veterans
  
  -- Admin
  is_active BOOLEAN DEFAULT true,
  last_verified_date DATE,
  verified_by UUID REFERENCES public.staff(id),
  notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Food bank search log for analytics
CREATE TABLE IF NOT EXISTS public.food_bank_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_location TEXT,
  search_type VARCHAR(50), -- all, food_bank, pantry, etc.
  results_count INTEGER,
  user_type VARCHAR(50), -- anonymous, patient, community_member
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Food bank reviews and ratings
CREATE TABLE IF NOT EXISTS public.food_bank_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  food_bank_id UUID REFERENCES public.food_banks(id) ON DELETE CASCADE,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  reviewer_name VARCHAR(100),
  reviewer_type VARCHAR(50), -- patient, community_member
  is_verified BOOLEAN DEFAULT false,
  helpful_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_food_banks_type ON public.food_banks(food_bank_type);
CREATE INDEX IF NOT EXISTS idx_food_banks_zip ON public.food_banks(zip_code);
CREATE INDEX IF NOT EXISTS idx_food_banks_location ON public.food_banks(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_food_banks_active ON public.food_banks(is_active);

-- Insert sample data
INSERT INTO public.food_banks (
  organization_name, food_bank_type, address, city, state, zip_code,
  phone, email, latitude, longitude, serves_per_month,
  services, eligibility_criteria, accepts_walk_ins, requires_registration,
  hours_of_operation, is_active
) VALUES
(
  'Community Food Pantry',
  'pantry',
  '234 Market St',
  'Anytown',
  'ST',
  '12345',
  '(555) 234-5678',
  'info@communityfood.org',
  40.7128,
  -74.0060,
  500,
  '["emergency_food", "fresh_produce", "meal_assistance", "nutrition_education"]'::jsonb,
  'Income verification required',
  true,
  true,
  '{"monday": "10AM-4PM", "tuesday": "10AM-4PM", "wednesday": "10AM-4PM", "thursday": "10AM-4PM", "friday": "10AM-4PM", "saturday": "9AM-1PM"}'::jsonb,
  true
),
(
  'Fresh Harvest Food Bank',
  'food_bank',
  '890 Pine Rd',
  'Anytown',
  'ST',
  '12345',
  '(555) 456-7890',
  'contact@freshharvest.org',
  40.7411,
  -73.9897,
  1200,
  '["emergency_food", "fresh_produce", "meat_dairy", "canned_goods", "snap_assistance"]'::jsonb,
  'All community members welcome',
  true,
  false,
  '{"monday": "9AM-5PM", "wednesday": "9AM-5PM", "friday": "9AM-5PM"}'::jsonb,
  true
);

COMMENT ON TABLE public.food_banks IS 'Food banks, pantries, soup kitchens, and meal programs for community outreach';
COMMENT ON TABLE public.food_bank_searches IS 'Analytics for food bank searches to identify high-demand areas';
COMMENT ON TABLE public.food_bank_reviews IS 'Community reviews and ratings for food banks';
