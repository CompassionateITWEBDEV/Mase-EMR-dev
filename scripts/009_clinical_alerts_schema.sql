-- Clinical Alerts Schema
-- Dosing holds, patient precautions, and facility alerts

-- Dosing Holds Table
CREATE TABLE IF NOT EXISTS dosing_holds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  hold_type VARCHAR(50) NOT NULL CHECK (hold_type IN ('counselor', 'nurse', 'doctor', 'compliance')),
  reason TEXT NOT NULL,
  created_by VARCHAR(255) NOT NULL,
  created_by_role VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  requires_clearance_from TEXT[] DEFAULT '{}',
  cleared_by TEXT[] DEFAULT '{}',
  status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'cleared', 'expired', 'cancelled')),
  notes TEXT,
  severity VARCHAR(20) DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  cleared_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE
);

-- Patient Precautions Table
CREATE TABLE IF NOT EXISTS patient_precautions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  precaution_type VARCHAR(100) NOT NULL,
  custom_text TEXT,
  icon VARCHAR(50),
  color VARCHAR(20),
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  show_on_chart BOOLEAN DEFAULT true,
  priority INTEGER DEFAULT 0
);

-- Facility Alerts Table
CREATE TABLE IF NOT EXISTS facility_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type VARCHAR(100) NOT NULL,
  message TEXT NOT NULL,
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true,
  priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  affected_areas TEXT[] DEFAULT '{}',
  expires_at TIMESTAMP WITH TIME ZONE,
  acknowledged_by TEXT[] DEFAULT '{}'
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_dosing_holds_patient ON dosing_holds(patient_id);
CREATE INDEX IF NOT EXISTS idx_dosing_holds_status ON dosing_holds(status);
CREATE INDEX IF NOT EXISTS idx_dosing_holds_created ON dosing_holds(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_patient_precautions_patient ON patient_precautions(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_precautions_active ON patient_precautions(is_active);
CREATE INDEX IF NOT EXISTS idx_facility_alerts_active ON facility_alerts(is_active);

-- Enable RLS
ALTER TABLE dosing_holds ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_precautions ENABLE ROW LEVEL SECURITY;
ALTER TABLE facility_alerts ENABLE ROW LEVEL SECURITY;

-- RLS Policies (permissive for now, tighten in production)
CREATE POLICY "Allow all access to dosing_holds" ON dosing_holds FOR ALL USING (true);
CREATE POLICY "Allow all access to patient_precautions" ON patient_precautions FOR ALL USING (true);
CREATE POLICY "Allow all access to facility_alerts" ON facility_alerts FOR ALL USING (true);
