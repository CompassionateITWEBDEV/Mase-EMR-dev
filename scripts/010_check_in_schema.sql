-- Patient Check-In Queue Schema
-- Run this to create the check-in system tables

-- Patient Check-Ins Table
CREATE TABLE IF NOT EXISTS patient_check_ins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id),
  patient_number TEXT NOT NULL,
  check_in_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  check_in_method TEXT NOT NULL DEFAULT 'walk-in', -- mobile, kiosk, staff, walk-in
  queue_position INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting', -- waiting, called, with-staff, completed, left, return-later
  service_type TEXT NOT NULL DEFAULT 'dosing', -- dosing, counseling, medical, intake, group, uds
  priority TEXT DEFAULT 'normal', -- normal, high, urgent
  assigned_to TEXT,
  called_time TIMESTAMPTZ,
  completed_time TIMESTAMPTZ,
  mobile_phone TEXT,
  notes TEXT,
  return_time TIMESTAMPTZ,
  notifications_sent INTEGER DEFAULT 0,
  last_notification TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_check_ins_date ON patient_check_ins(check_in_time);
CREATE INDEX IF NOT EXISTS idx_check_ins_status ON patient_check_ins(status);
CREATE INDEX IF NOT EXISTS idx_check_ins_patient ON patient_check_ins(patient_id);
CREATE INDEX IF NOT EXISTS idx_check_ins_position ON patient_check_ins(queue_position);

-- Queue Statistics View
CREATE OR REPLACE VIEW queue_statistics AS
SELECT 
  DATE(check_in_time) as date,
  COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
  COUNT(*) FILTER (WHERE status IN ('waiting', 'called')) as current_waiting,
  AVG(EXTRACT(EPOCH FROM (called_time - check_in_time))/60) FILTER (WHERE called_time IS NOT NULL) as avg_wait_minutes,
  MAX(EXTRACT(EPOCH FROM (NOW() - check_in_time))/60) FILTER (WHERE status = 'waiting') as longest_current_wait
FROM patient_check_ins
GROUP BY DATE(check_in_time);

-- Enable RLS
ALTER TABLE patient_check_ins ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Staff can view all check-ins" ON patient_check_ins
  FOR SELECT USING (true);

CREATE POLICY "Staff can insert check-ins" ON patient_check_ins
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Staff can update check-ins" ON patient_check_ins
  FOR UPDATE USING (true);

-- Function to auto-update queue positions when someone leaves
CREATE OR REPLACE FUNCTION update_queue_positions()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status IN ('completed', 'left') AND OLD.status IN ('waiting', 'called') THEN
    UPDATE patient_check_ins
    SET queue_position = queue_position - 1
    WHERE DATE(check_in_time) = DATE(NEW.check_in_time)
      AND queue_position > OLD.queue_position
      AND status IN ('waiting', 'called', 'return-later');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_queue_positions
  AFTER UPDATE ON patient_check_ins
  FOR EACH ROW
  EXECUTE FUNCTION update_queue_positions();
