-- Create community_events table
CREATE TABLE IF NOT EXISTS community_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  
  -- Event details
  event_title VARCHAR(255) NOT NULL,
  event_description TEXT,
  event_type VARCHAR(100), -- workshop, support_group, health_fair, training, community_meeting, social_event
  
  -- Date and time
  event_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME,
  is_recurring BOOLEAN DEFAULT FALSE,
  recurrence_pattern VARCHAR(50), -- daily, weekly, monthly
  recurrence_end_date DATE,
  
  -- Location
  location_name VARCHAR(255),
  location_address TEXT,
  location_city VARCHAR(100),
  location_state VARCHAR(50),
  location_zip VARCHAR(20),
  location_type VARCHAR(50), -- in_person, virtual, hybrid
  virtual_link TEXT,
  latitude NUMERIC(10, 8),
  longitude NUMERIC(11, 8),
  
  -- Registration
  requires_registration BOOLEAN DEFAULT FALSE,
  max_attendees INTEGER,
  current_attendees INTEGER DEFAULT 0,
  registration_deadline DATE,
  contact_email VARCHAR(255),
  contact_phone VARCHAR(50),
  
  -- Visibility and status
  is_public BOOLEAN DEFAULT TRUE,
  is_featured BOOLEAN DEFAULT FALSE,
  status VARCHAR(50) DEFAULT 'published', -- draft, published, cancelled
  cancellation_reason TEXT,
  
  -- Categories and tags
  target_audience JSONB, -- ['adults', 'youth', 'families', 'seniors']
  services_provided JSONB, -- ['food', 'mental_health', 'substance_use', 'housing']
  accessibility_features JSONB, -- ['wheelchair_accessible', 'asl_interpreter', 'childcare']
  
  -- Additional info
  cost NUMERIC(10, 2) DEFAULT 0,
  event_image_url TEXT,
  additional_details TEXT,
  
  -- Metadata
  created_by UUID REFERENCES staff(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  
  -- Verification
  is_verified BOOLEAN DEFAULT FALSE,
  verified_by UUID REFERENCES staff(id),
  verified_at TIMESTAMP WITH TIME ZONE
);

-- Create community_event_registrations table
CREATE TABLE IF NOT EXISTS community_event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES community_events(id) ON DELETE CASCADE,
  
  -- Registrant information
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  number_of_attendees INTEGER DEFAULT 1,
  
  -- Additional info
  special_accommodations TEXT,
  dietary_restrictions TEXT,
  emergency_contact_name VARCHAR(255),
  emergency_contact_phone VARCHAR(50),
  
  -- Status
  registration_status VARCHAR(50) DEFAULT 'registered', -- registered, attended, no_show, cancelled
  check_in_time TIMESTAMP WITH TIME ZONE,
  checked_in_by UUID REFERENCES staff(id),
  
  -- Metadata
  registered_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  
  -- Consent
  consent_to_contact BOOLEAN DEFAULT TRUE,
  consent_to_photos BOOLEAN DEFAULT FALSE
);

-- Create indexes
CREATE INDEX idx_community_events_date ON community_events(event_date);
CREATE INDEX idx_community_events_type ON community_events(event_type);
CREATE INDEX idx_community_events_status ON community_events(status);
CREATE INDEX idx_community_events_public ON community_events(is_public);
CREATE INDEX idx_community_event_registrations_event ON community_event_registrations(event_id);
CREATE INDEX idx_community_event_registrations_email ON community_event_registrations(email);

-- Add RLS policies
ALTER TABLE community_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_event_registrations ENABLE ROW LEVEL SECURITY;

-- Public can view published public events
CREATE POLICY "Anyone can view published public events"
  ON community_events
  FOR SELECT
  USING (is_public = TRUE AND status = 'published');

-- Staff can manage all events
CREATE POLICY "Staff can manage events"
  ON community_events
  FOR ALL
  USING (true);

-- Anyone can register for events
CREATE POLICY "Anyone can register for events"
  ON community_event_registrations
  FOR INSERT
  WITH CHECK (true);

-- Staff can view and manage registrations
CREATE POLICY "Staff can manage registrations"
  ON community_event_registrations
  FOR ALL
  USING (true);

COMMENT ON TABLE community_events IS 'Community events for outreach portal';
COMMENT ON TABLE community_event_registrations IS 'Event registrations from community members';
