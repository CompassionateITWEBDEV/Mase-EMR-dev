-- Patient Reminders Schema
-- Stores reminder history and templates

-- Reminder templates table
CREATE TABLE IF NOT EXISTS reminder_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('appointment', 'counseling', 'balance', 'medication', 'custom')),
  channel VARCHAR(20) NOT NULL CHECK (channel IN ('email', 'sms', 'both')),
  subject VARCHAR(500),
  message TEXT NOT NULL,
  timing VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Patient reminders log table
CREATE TABLE IF NOT EXISTS patient_reminders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  template_id UUID REFERENCES reminder_templates(id),
  type VARCHAR(50) NOT NULL,
  channel VARCHAR(20) NOT NULL,
  subject VARCHAR(500),
  message TEXT NOT NULL,
  email_status VARCHAR(20) CHECK (email_status IN ('pending', 'sent', 'delivered', 'failed', 'bounced')),
  sms_status VARCHAR(20) CHECK (sms_status IN ('pending', 'sent', 'delivered', 'failed')),
  email_sent_at TIMESTAMP WITH TIME ZONE,
  sms_sent_at TIMESTAMP WITH TIME ZONE,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Patient notification preferences
CREATE TABLE IF NOT EXISTS patient_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE UNIQUE,
  appointment_email BOOLEAN DEFAULT true,
  appointment_sms BOOLEAN DEFAULT true,
  missed_session_email BOOLEAN DEFAULT true,
  missed_session_sms BOOLEAN DEFAULT true,
  balance_email BOOLEAN DEFAULT true,
  balance_sms BOOLEAN DEFAULT false,
  general_email BOOLEAN DEFAULT true,
  general_sms BOOLEAN DEFAULT false,
  quiet_hours_start TIME DEFAULT '21:00',
  quiet_hours_end TIME DEFAULT '08:00',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_patient_reminders_patient ON patient_reminders(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_reminders_type ON patient_reminders(type);
CREATE INDEX IF NOT EXISTS idx_patient_reminders_sent_at ON patient_reminders(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_reminder_templates_type ON reminder_templates(type);
CREATE INDEX IF NOT EXISTS idx_reminder_templates_active ON reminder_templates(is_active);

-- Insert default templates
INSERT INTO reminder_templates (name, type, channel, subject, message, timing, is_active)
VALUES 
  ('Appointment Reminder - 24 Hours', 'appointment', 'both', 'Appointment Reminder', 
   'Hi {patient_name}, this is a reminder that you have an appointment scheduled for {appointment_date} at {appointment_time}. Please arrive 10 minutes early. Reply CONFIRM to confirm or call us to reschedule.',
   '24 hours before', true),
  ('Appointment Reminder - 2 Hours', 'appointment', 'sms', 'Appointment Today',
   'Reminder: Your appointment is today at {appointment_time}. See you soon!',
   '2 hours before', true),
  ('Missed Counseling Session', 'counseling', 'both', 'Missed Counseling Session - Action Required',
   'Hi {patient_name}, we noticed you missed your counseling session on {session_date}. Counseling is an important part of your treatment plan. Please call us at {clinic_phone} to reschedule as soon as possible.',
   'Same day', true),
  ('Balance Due Reminder', 'balance', 'email', 'Account Balance Reminder',
   'Hi {patient_name}, this is a friendly reminder that you have an outstanding balance of ${balance_amount}. Please contact our billing department or make a payment through your patient portal.',
   '7 days overdue', true),
  ('Balance Past Due', 'balance', 'both', 'Account Past Due - Action Required',
   'Hi {patient_name}, your account balance of ${balance_amount} is now {days_overdue} days past due. Please contact us to discuss payment options.',
   '30 days overdue', true)
ON CONFLICT DO NOTHING;

-- RLS Policies
ALTER TABLE reminder_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_notification_preferences ENABLE ROW LEVEL SECURITY;

-- Allow all operations for authenticated users (staff)
CREATE POLICY "Allow all for authenticated users" ON reminder_templates
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON patient_reminders
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow all for authenticated users" ON patient_notification_preferences
  FOR ALL TO authenticated USING (true) WITH CHECK (true);
