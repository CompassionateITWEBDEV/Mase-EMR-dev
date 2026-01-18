-- Live Chat and Audio/Video Call System with AI Transcription
-- For real-time support with resource specialists

-- Chat sessions table
CREATE TABLE IF NOT EXISTS live_chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_type TEXT NOT NULL CHECK (session_type IN ('general_inquiry', 'provider_registration', 'patient_screening', 'referral_support', 'crisis_support')),
  visitor_name TEXT,
  visitor_email TEXT,
  visitor_phone TEXT,
  visitor_type TEXT CHECK (visitor_type IN ('patient', 'provider', 'family', 'community_member')),
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'on_call', 'ended', 'missed')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  assigned_specialist_id UUID REFERENCES staff(id),
  specialist_name TEXT,
  queue_position INTEGER,
  wait_time_seconds INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS live_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES live_chat_sessions(id) ON DELETE CASCADE,
  sender_type TEXT NOT NULL CHECK (sender_type IN ('visitor', 'specialist', 'system', 'ai_bot')),
  sender_id UUID,
  sender_name TEXT,
  message_type TEXT NOT NULL DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'image', 'system_notification', 'call_start', 'call_end')),
  message_text TEXT,
  file_url TEXT,
  file_name TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Audio/Video call logs table
CREATE TABLE IF NOT EXISTS live_call_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES live_chat_sessions(id) ON DELETE CASCADE,
  call_type TEXT NOT NULL CHECK (call_type IN ('audio', 'video')),
  call_status TEXT NOT NULL CHECK (call_status IN ('initiated', 'ringing', 'connected', 'ended', 'failed', 'missed')),
  initiated_by TEXT CHECK (initiated_by IN ('visitor', 'specialist')),
  specialist_id UUID REFERENCES staff(id),
  duration_seconds INTEGER,
  recording_url TEXT,
  transcription_status TEXT DEFAULT 'pending' CHECK (transcription_status IN ('pending', 'processing', 'completed', 'failed')),
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI call transcriptions table
CREATE TABLE IF NOT EXISTS call_transcriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id UUID NOT NULL REFERENCES live_call_logs(id) ON DELETE CASCADE,
  transcription_text TEXT,
  confidence_score DECIMAL(5,2),
  language TEXT DEFAULT 'en',
  speaker_labels JSONB, -- {"speaker_1": "visitor", "speaker_2": "specialist"}
  timestamps JSONB, -- Array of {time, speaker, text}
  keywords JSONB, -- Extracted keywords for searchability
  sentiment TEXT CHECK (sentiment IN ('positive', 'neutral', 'negative', 'crisis')),
  ai_summary TEXT,
  action_items JSONB, -- Extracted action items from conversation
  transcription_service TEXT, -- 'deepgram', 'assemblyai', 'openai-whisper'
  processing_time_seconds INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Resource specialists availability table
CREATE TABLE IF NOT EXISTS specialist_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  specialist_id UUID NOT NULL REFERENCES staff(id),
  status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('online', 'busy', 'away', 'offline')),
  can_accept_chat BOOLEAN DEFAULT TRUE,
  can_accept_calls BOOLEAN DEFAULT TRUE,
  max_concurrent_chats INTEGER DEFAULT 3,
  current_active_chats INTEGER DEFAULT 0,
  specialties JSONB, -- ["substance_use", "mental_health", "housing", "employment"]
  languages JSONB, -- ["en", "es", "ar"]
  last_seen_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat analytics and metrics
CREATE TABLE IF NOT EXISTS chat_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  specialist_id UUID REFERENCES staff(id),
  total_chats INTEGER DEFAULT 0,
  total_calls INTEGER DEFAULT 0,
  avg_wait_time_seconds INTEGER,
  avg_chat_duration_seconds INTEGER,
  avg_call_duration_seconds INTEGER,
  satisfaction_score DECIMAL(3,2),
  missed_chats INTEGER DEFAULT 0,
  conversion_rate DECIMAL(5,2), -- Percentage of chats that led to registration/referral
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Canned responses for quick replies
CREATE TABLE IF NOT EXISTS chat_canned_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  message_text TEXT NOT NULL,
  shortcut_key TEXT,
  usage_count INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default canned responses
INSERT INTO chat_canned_responses (category, title, message_text, shortcut_key) VALUES
('greeting', 'Welcome Message', 'Hello! I''m {specialist_name}, a resource specialist with MASE. How can I help you today?', '/hi'),
('provider', 'Provider Registration Info', 'Thank you for your interest in joining the MASE network! I can help you complete your provider registration. What type of services do you offer?', '/provider'),
('patient', 'Patient Support', 'I understand you''re looking for behavioral health support. I''m here to help you find the right services. Can you tell me what type of support you need?', '/patient'),
('crisis', 'Crisis Response', 'I hear that you''re in crisis. Your safety is our priority. Would you like me to connect you with our crisis team immediately? You can also call 988 Suicide & Crisis Lifeline anytime.', '/crisis'),
('referral', 'Referral Process', 'I can help you submit a referral. Let me gather some information to connect you with the right provider. What services are you looking for?', '/referral'),
('mase_trial', 'MASE EMR Trial', 'Our MASE EMR system offers a 30-day free trial for providers. It includes patient charting, medication management, DEA compliance, and Michigan surveillance reporting. Would you like to learn more?', '/trial'),
('callback', 'Schedule Callback', 'I can schedule a callback for you with a specialist. What day and time works best for you?', '/callback');

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_chat_sessions_status ON live_chat_sessions(status);
CREATE INDEX IF NOT EXISTS idx_chat_sessions_specialist ON live_chat_sessions(assigned_specialist_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON live_chat_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_call_logs_session ON live_call_logs(session_id);
CREATE INDEX IF NOT EXISTS idx_transcriptions_call ON call_transcriptions(call_id);
CREATE INDEX IF NOT EXISTS idx_specialist_availability_status ON specialist_availability(status);

COMMIT;
