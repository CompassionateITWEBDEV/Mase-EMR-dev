-- =====================================================
-- PART 5: Occupancy & Waitlist Management
-- =====================================================

-- Facility Rooms/Beds
CREATE TABLE IF NOT EXISTS facility_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  room_number TEXT NOT NULL,
  room_type TEXT NOT NULL, -- 'single', 'double', 'detox', 'observation'
  floor TEXT,
  building TEXT,
  capacity INT DEFAULT 1,
  status TEXT DEFAULT 'available', -- 'available', 'occupied', 'maintenance', 'reserved'
  current_patient_id UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Appointment Waitlist
CREATE TABLE IF NOT EXISTS appointment_waitlist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id),
  patient_id UUID,
  patient_name TEXT,
  patient_phone TEXT,
  appointment_type TEXT,
  preferred_date DATE,
  preferred_time TIME,
  provider_preference TEXT,
  priority TEXT DEFAULT 'routine', -- 'urgent', 'routine', 'flexible'
  status TEXT DEFAULT 'waiting', -- 'waiting', 'scheduled', 'cancelled'
  notes TEXT,
  added_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  scheduled_date TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_facility_rooms_org ON facility_rooms(organization_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_org ON appointment_waitlist(organization_id);

SELECT 'Part 5: Occupancy & Waitlist created successfully!' AS status;
