-- Create shelter locator schema for community outreach

-- Shelters table
CREATE TABLE IF NOT EXISTS public.community_shelters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shelter_name VARCHAR(255) NOT NULL,
    shelter_type VARCHAR(50) NOT NULL, -- 'emergency', 'transitional', 'permanent_supportive', 'youth'
    organization_name VARCHAR(255),
    
    -- Contact Information
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    state VARCHAR(2) NOT NULL,
    zip_code VARCHAR(10) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    website TEXT,
    
    -- Location
    latitude NUMERIC(10, 8),
    longitude NUMERIC(11, 8),
    
    -- Capacity
    total_beds INTEGER NOT NULL DEFAULT 0,
    beds_available INTEGER NOT NULL DEFAULT 0,
    last_bed_update TIMESTAMP WITH TIME ZONE,
    
    -- Population Served
    accepts_men BOOLEAN DEFAULT true,
    accepts_women BOOLEAN DEFAULT true,
    accepts_families BOOLEAN DEFAULT false,
    accepts_youth BOOLEAN DEFAULT false,
    accepts_veterans BOOLEAN DEFAULT false,
    accepts_lgbtq BOOLEAN DEFAULT true,
    age_min INTEGER,
    age_max INTEGER,
    
    -- Services & Amenities
    amenities JSONB DEFAULT '[]', -- ["meals", "medical", "mental_health", "substance_abuse", "childcare", "transportation", "job_training", "case_management", "legal_aid"]
    
    -- Operating Hours
    hours_of_operation TEXT, -- "24/7" or specific hours
    intake_hours TEXT,
    walk_ins_accepted BOOLEAN DEFAULT true,
    appointment_required BOOLEAN DEFAULT false,
    
    -- Requirements
    sobriety_required BOOLEAN DEFAULT false,
    background_check_required BOOLEAN DEFAULT false,
    referral_required BOOLEAN DEFAULT false,
    income_requirements TEXT,
    
    -- Additional Info
    languages_spoken JSONB DEFAULT '["English"]',
    ada_accessible BOOLEAN DEFAULT false,
    pet_friendly BOOLEAN DEFAULT false,
    max_stay_days INTEGER,
    notes TEXT,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_accepting_residents BOOLEAN DEFAULT true,
    temporary_closure_reason TEXT,
    
    -- Metadata
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    last_verified_at TIMESTAMP WITH TIME ZONE,
    verified_by UUID
);

-- Shelter services junction table
CREATE TABLE IF NOT EXISTS public.community_shelter_services (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shelter_id UUID REFERENCES public.community_shelters(id) ON DELETE CASCADE,
    service_type VARCHAR(100) NOT NULL, -- 'meals', 'medical', 'mental_health', 'substance_abuse_treatment', 'job_training', 'childcare', 'case_management', 'legal_aid', 'transportation', 'clothing', 'showers', 'laundry', 'storage', 'mail', 'phone_use'
    service_description TEXT,
    is_available BOOLEAN DEFAULT true,
    cost VARCHAR(50) DEFAULT 'free', -- 'free', 'low_cost', 'fee_based'
    schedule TEXT, -- When service is available
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shelter reviews/ratings
CREATE TABLE IF NOT EXISTS public.community_shelter_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shelter_id UUID REFERENCES public.community_shelters(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    helpful_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by UUID,
    is_verified_resident BOOLEAN DEFAULT false
);

-- Shelter waitlist
CREATE TABLE IF NOT EXISTS public.community_shelter_waitlist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shelter_id UUID REFERENCES public.community_shelters(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    email VARCHAR(255),
    household_size INTEGER DEFAULT 1,
    has_children BOOLEAN DEFAULT false,
    has_pets BOOLEAN DEFAULT false,
    special_needs TEXT,
    urgency_level VARCHAR(50) DEFAULT 'standard', -- 'critical', 'urgent', 'standard'
    status VARCHAR(50) DEFAULT 'pending', -- 'pending', 'contacted', 'scheduled', 'admitted', 'cancelled'
    estimated_wait_days INTEGER,
    notes TEXT,
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    contacted_at TIMESTAMP WITH TIME ZONE,
    admitted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Shelter bed availability log
CREATE TABLE IF NOT EXISTS public.community_shelter_bed_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    shelter_id UUID REFERENCES public.community_shelters(id) ON DELETE CASCADE,
    beds_available INTEGER NOT NULL,
    beds_occupied INTEGER NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_shelters_location ON public.community_shelters(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_shelters_city_state ON public.community_shelters(city, state);
CREATE INDEX IF NOT EXISTS idx_shelters_type ON public.community_shelters(shelter_type);
CREATE INDEX IF NOT EXISTS idx_shelters_accepting ON public.community_shelters(is_accepting_residents) WHERE is_accepting_residents = true;
CREATE INDEX IF NOT EXISTS idx_shelter_services_shelter ON public.community_shelter_services(shelter_id);
CREATE INDEX IF NOT EXISTS idx_shelter_waitlist_status ON public.community_shelter_waitlist(status, shelter_id);

-- Enable Row Level Security
ALTER TABLE public.community_shelters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_shelter_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_shelter_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_shelter_waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_shelter_bed_log ENABLE ROW LEVEL SECURITY;

-- Public can read shelter information (they're public services)
CREATE POLICY "Anyone can view active shelters" ON public.community_shelters
    FOR SELECT USING (is_active = true);

CREATE POLICY "Anyone can view shelter services" ON public.community_shelter_services
    FOR SELECT USING (true);

CREATE POLICY "Anyone can view shelter reviews" ON public.community_shelter_reviews
    FOR SELECT USING (true);

-- Only authenticated staff can manage shelters
CREATE POLICY "Staff can manage shelters" ON public.community_shelters
    FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Staff can manage services" ON public.community_shelter_services
    FOR ALL USING (auth.role() = 'authenticated');

-- Anyone can submit waitlist requests
CREATE POLICY "Anyone can submit waitlist request" ON public.community_shelter_waitlist
    FOR INSERT WITH CHECK (true);

-- Staff can view and manage waitlist
CREATE POLICY "Staff can manage waitlist" ON public.community_shelter_waitlist
    FOR ALL USING (auth.role() = 'authenticated');

COMMENT ON TABLE public.community_shelters IS 'Emergency and transitional housing facilities available in the community';
COMMENT ON TABLE public.community_shelter_services IS 'Services offered by each shelter facility';
COMMENT ON TABLE public.community_shelter_reviews IS 'Reviews and ratings from shelter residents';
COMMENT ON TABLE public.community_shelter_waitlist IS 'Waitlist for people seeking shelter placement';
COMMENT ON TABLE public.community_shelter_bed_log IS 'Historical log of bed availability for analytics';
