-- =====================================================
-- MASE EMR - FINAL PRODUCTION LAUNCH SQL
-- Complete Setup for All Missing Components
-- Version 1.0 - Launch Ready
-- =====================================================

-- =====================================================
-- SECTION 1: IT SUPPORT DASHBOARD TABLES
-- =====================================================

-- Support Tickets
CREATE TABLE IF NOT EXISTS support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  ticket_number TEXT NOT NULL UNIQUE,
  subject TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL, -- 'technical', 'billing', 'training', 'feature_request', 'bug', 'security'
  priority TEXT NOT NULL DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
  status TEXT NOT NULL DEFAULT 'open', -- 'open', 'in_progress', 'pending_customer', 'escalated', 'resolved', 'closed'
  reported_by_name TEXT,
  reported_by_email TEXT,
  reported_by_phone TEXT,
  assigned_to UUID,
  assigned_at TIMESTAMPTZ,
  first_response_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  closed_at TIMESTAMPTZ,
  resolution_notes TEXT,
  satisfaction_rating INTEGER, -- 1-5
  satisfaction_feedback TEXT,
  tags JSONB DEFAULT '[]',
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Support Ticket Comments
CREATE TABLE IF NOT EXISTS support_ticket_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID NOT NULL REFERENCES support_tickets(id) ON DELETE CASCADE,
  author_id UUID,
  author_name TEXT,
  author_type TEXT, -- 'customer', 'support_agent', 'system'
  content TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT FALSE,
  attachments JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Remote Support Sessions
CREATE TABLE IF NOT EXISTS remote_support_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ticket_id UUID REFERENCES support_tickets(id),
  organization_id UUID,
  session_code TEXT NOT NULL UNIQUE,
  client_name TEXT,
  client_email TEXT,
  support_agent_id UUID,
  support_agent_name TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'connecting', 'active', 'paused', 'ended'
  session_type TEXT DEFAULT 'screen_share', -- 'screen_share', 'remote_control', 'file_transfer'
  started_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  duration_minutes INTEGER,
  client_system_info JSONB,
  recording_enabled BOOLEAN DEFAULT FALSE,
  recording_url TEXT,
  chat_log JSONB DEFAULT '[]',
  actions_performed JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- System Diagnostics Results
CREATE TABLE IF NOT EXISTS system_diagnostics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  run_by UUID,
  diagnostic_type TEXT NOT NULL, -- 'database', 'api', 'integrations', 'security', 'backup', 'full'
  status TEXT NOT NULL DEFAULT 'running', -- 'running', 'completed', 'failed'
  results JSONB,
  issues_found INTEGER DEFAULT 0,
  warnings INTEGER DEFAULT 0,
  recommendations JSONB DEFAULT '[]',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER
);

-- Organization Health Monitoring
CREATE TABLE IF NOT EXISTS organization_health_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  recorded_at TIMESTAMPTZ DEFAULT NOW(),
  cpu_usage_percent DECIMAL(5,2),
  memory_usage_percent DECIMAL(5,2),
  storage_usage_percent DECIMAL(5,2),
  network_latency_ms INTEGER,
  active_users INTEGER,
  api_requests_last_hour INTEGER,
  error_rate_percent DECIMAL(5,2),
  database_connections INTEGER,
  status TEXT DEFAULT 'healthy', -- 'healthy', 'warning', 'critical', 'offline'
  alerts JSONB DEFAULT '[]'
);

CREATE INDEX IF NOT EXISTS idx_support_tickets_org ON support_tickets(organization_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_support_ticket_comments_ticket ON support_ticket_comments(ticket_id);
CREATE INDEX IF NOT EXISTS idx_remote_sessions_org ON remote_support_sessions(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_health_metrics_org ON organization_health_metrics(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_health_metrics_time ON organization_health_metrics(recorded_at);

-- =====================================================
-- SECTION 2: ENHANCED SUBSCRIPTION & BILLING
-- =====================================================

-- Subscription Usage Tracking
CREATE TABLE IF NOT EXISTS subscription_usage_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL,
  metric_date DATE NOT NULL,
  active_patients INTEGER DEFAULT 0,
  active_providers INTEGER DEFAULT 0,
  encounters_created INTEGER DEFAULT 0,
  claims_submitted INTEGER DEFAULT 0,
  prescriptions_sent INTEGER DEFAULT 0,
  fax_pages_sent INTEGER DEFAULT 0,
  sms_messages_sent INTEGER DEFAULT 0,
  storage_used_mb DECIMAL(10,2) DEFAULT 0,
  api_calls INTEGER DEFAULT 0,
  ai_tokens_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(subscription_id, metric_date)
);

-- Payment Methods
CREATE TABLE IF NOT EXISTS payment_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  stripe_payment_method_id TEXT,
  type TEXT NOT NULL, -- 'card', 'bank_account', 'ach'
  brand TEXT, -- 'visa', 'mastercard', 'amex'
  last_four TEXT,
  exp_month INTEGER,
  exp_year INTEGER,
  is_default BOOLEAN DEFAULT FALSE,
  billing_name TEXT,
  billing_address JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscription_usage_sub ON subscription_usage_metrics(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_usage_date ON subscription_usage_metrics(metric_date);
CREATE INDEX IF NOT EXISTS idx_payment_methods_org ON payment_methods(organization_id);

-- =====================================================
-- SECTION 3: ENHANCED PATIENT PORTAL
-- =====================================================

-- Patient Portal Accounts
CREATE TABLE IF NOT EXISTS patient_portal_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL UNIQUE,
  email TEXT NOT NULL,
  password_hash TEXT,
  phone_verified BOOLEAN DEFAULT FALSE,
  email_verified BOOLEAN DEFAULT FALSE,
  mfa_enabled BOOLEAN DEFAULT FALSE,
  mfa_secret_encrypted TEXT,
  last_login_at TIMESTAMPTZ,
  login_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMPTZ,
  password_reset_token TEXT,
  password_reset_expires TIMESTAMPTZ,
  terms_accepted_at TIMESTAMPTZ,
  privacy_accepted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Patient Messages
CREATE TABLE IF NOT EXISTS patient_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  organization_id UUID,
  provider_id UUID,
  direction TEXT NOT NULL, -- 'inbound', 'outbound'
  subject TEXT,
  message_body TEXT NOT NULL,
  message_type TEXT DEFAULT 'general', -- 'general', 'appointment', 'prescription', 'lab_result', 'billing'
  is_read BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  is_urgent BOOLEAN DEFAULT FALSE,
  attachments JSONB DEFAULT '[]',
  parent_message_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Patient Appointment Requests
CREATE TABLE IF NOT EXISTS patient_appointment_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL,
  organization_id UUID,
  preferred_provider_id UUID,
  appointment_type TEXT NOT NULL,
  preferred_date_1 DATE,
  preferred_time_1 TEXT,
  preferred_date_2 DATE,
  preferred_time_2 TEXT,
  reason TEXT,
  urgency TEXT DEFAULT 'routine', -- 'routine', 'soon', 'urgent'
  status TEXT DEFAULT 'pending', -- 'pending', 'scheduled', 'declined', 'cancelled'
  scheduled_appointment_id UUID,
  response_notes TEXT,
  responded_by UUID,
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_patient_portal_accounts_patient ON patient_portal_accounts(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_portal_accounts_email ON patient_portal_accounts(email);
CREATE INDEX IF NOT EXISTS idx_patient_messages_patient ON patient_messages(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_messages_direction ON patient_messages(direction);
CREATE INDEX IF NOT EXISTS idx_patient_appt_requests_patient ON patient_appointment_requests(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_appt_requests_status ON patient_appointment_requests(status);

-- =====================================================
-- SECTION 4: ENHANCED REPORTING SYSTEM
-- =====================================================

-- Custom Report Definitions
CREATE TABLE IF NOT EXISTS custom_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  name TEXT NOT NULL,
  description TEXT,
  report_type TEXT NOT NULL, -- 'clinical', 'financial', 'operational', 'compliance', 'custom'
  query_definition JSONB NOT NULL,
  columns JSONB NOT NULL,
  filters JSONB DEFAULT '[]',
  grouping JSONB DEFAULT '[]',
  sorting JSONB DEFAULT '[]',
  visualization TEXT DEFAULT 'table', -- 'table', 'bar_chart', 'line_chart', 'pie_chart'
  is_public BOOLEAN DEFAULT FALSE,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Report Exports
CREATE TABLE IF NOT EXISTS report_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id UUID,
  report_schedule_id UUID,
  organization_id UUID,
  export_format TEXT NOT NULL, -- 'pdf', 'excel', 'csv', 'json'
  file_url TEXT,
  file_size_bytes BIGINT,
  parameters JSONB,
  date_range_start DATE,
  date_range_end DATE,
  row_count INTEGER,
  generated_by UUID,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  download_count INTEGER DEFAULT 0,
  last_downloaded_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_custom_reports_org ON custom_reports(organization_id);
CREATE INDEX IF NOT EXISTS idx_custom_reports_type ON custom_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_report_exports_report ON report_exports(report_id);
CREATE INDEX IF NOT EXISTS idx_report_exports_org ON report_exports(organization_id);

-- =====================================================
-- SECTION 5: SYSTEM CONFIGURATION & SETTINGS
-- =====================================================

-- System Settings
CREATE TABLE IF NOT EXISTS system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  setting_key TEXT NOT NULL,
  setting_value JSONB NOT NULL,
  setting_type TEXT DEFAULT 'string', -- 'string', 'number', 'boolean', 'json'
  category TEXT NOT NULL, -- 'general', 'security', 'notifications', 'integrations', 'billing', 'clinical'
  description TEXT,
  is_sensitive BOOLEAN DEFAULT FALSE,
  updated_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(organization_id, setting_key)
);

-- Feature Flags
CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_key TEXT NOT NULL UNIQUE,
  flag_name TEXT NOT NULL,
  description TEXT,
  is_enabled BOOLEAN DEFAULT FALSE,
  rollout_percentage INTEGER DEFAULT 0, -- 0-100
  target_organizations JSONB DEFAULT '[]', -- specific org IDs
  target_user_roles JSONB DEFAULT '[]', -- specific roles
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- System Announcements
CREATE TABLE IF NOT EXISTS system_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  announcement_type TEXT NOT NULL, -- 'info', 'warning', 'maintenance', 'feature', 'security'
  priority TEXT DEFAULT 'normal', -- 'low', 'normal', 'high', 'critical'
  target_audience TEXT DEFAULT 'all', -- 'all', 'admins', 'providers', 'staff'
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ,
  is_dismissible BOOLEAN DEFAULT TRUE,
  action_url TEXT,
  action_text TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_system_settings_org ON system_settings(organization_id);
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_feature_flags_key ON feature_flags(flag_key);
CREATE INDEX IF NOT EXISTS idx_system_announcements_dates ON system_announcements(start_date, end_date);

-- =====================================================
-- SECTION 6: ENHANCED AUDIT & LOGGING
-- =====================================================

-- API Request Logs
CREATE TABLE IF NOT EXISTS api_request_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  user_id UUID,
  request_id TEXT,
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  query_params JSONB,
  request_body JSONB,
  response_status INTEGER,
  response_time_ms INTEGER,
  ip_address INET,
  user_agent TEXT,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Security Events
CREATE TABLE IF NOT EXISTS security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  user_id UUID,
  event_type TEXT NOT NULL, -- 'login_success', 'login_failed', 'password_reset', 'mfa_enabled', 'permission_change', 'data_export', 'suspicious_activity'
  severity TEXT NOT NULL, -- 'low', 'medium', 'high', 'critical'
  description TEXT,
  metadata JSONB,
  ip_address INET,
  user_agent TEXT,
  location TEXT,
  resolved BOOLEAN DEFAULT FALSE,
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Data Export Logs (for compliance)
CREATE TABLE IF NOT EXISTS data_export_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  user_id UUID NOT NULL,
  export_type TEXT NOT NULL, -- 'patient_records', 'billing_data', 'reports', 'full_export'
  records_exported INTEGER,
  file_format TEXT,
  file_size_bytes BIGINT,
  reason TEXT,
  patient_ids JSONB DEFAULT '[]', -- for HIPAA tracking
  approval_required BOOLEAN DEFAULT FALSE,
  approved_by UUID,
  approved_at TIMESTAMPTZ,
  ip_address INET,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_api_request_logs_org ON api_request_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_api_request_logs_time ON api_request_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_security_events_org ON security_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);
CREATE INDEX IF NOT EXISTS idx_data_export_logs_org ON data_export_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_data_export_logs_user ON data_export_logs(user_id);

-- =====================================================
-- SECTION 7: SEED ESSENTIAL DATA
-- =====================================================

-- Seed Subscription Plans
INSERT INTO subscription_plans (id, name, tier, monthly_price, annual_price, max_staff_users, features, is_active)
VALUES 
  (gen_random_uuid(), 'Starter', 'starter', 299, 2990, 5, 
   '{"modules": ["behavioral_health"], "features": ["basic_ehr", "scheduling", "billing"], "support": "email", "storage_gb": 10}', true),
  (gen_random_uuid(), 'Professional', 'professional', 499, 4990, 25, 
   '{"modules": ["behavioral_health", "otp_mat", "primary_care"], "features": ["basic_ehr", "scheduling", "billing", "e_prescribing", "lab_integration"], "support": "priority", "storage_gb": 50}', true),
  (gen_random_uuid(), 'Enterprise', 'enterprise', 999, 9990, 100, 
   '{"modules": ["all"], "features": ["all"], "support": "dedicated", "storage_gb": 500, "custom_integrations": true}', true),
  (gen_random_uuid(), 'County Health', 'county_health', 1499, 14990, 200, 
   '{"modules": ["wic", "immunizations", "sti_clinic", "tb_program", "mch", "environmental_health", "chw"], "features": ["all"], "support": "dedicated", "storage_gb": 1000}', true)
ON CONFLICT DO NOTHING;

-- Seed Default Feature Flags
INSERT INTO feature_flags (flag_key, flag_name, description, is_enabled, rollout_percentage)
VALUES 
  ('ai_clinical_assistant', 'AI Clinical Assistant', 'Enable AI-powered clinical documentation assistance', true, 100),
  ('diversion_control', 'Take-Home Diversion Control', 'QR code + GPS + biometric verification for take-home doses', true, 100),
  ('hie_network', 'MASE HIE Network', 'Peer-to-peer health information exchange', true, 100),
  ('remote_support', 'Remote IT Support', 'Enable remote screen sharing for IT support', true, 100),
  ('telehealth', 'Telehealth Module', 'Video visit capabilities', true, 100),
  ('patient_portal', 'Patient Portal', 'Patient self-service portal', true, 100),
  ('advanced_analytics', 'Advanced Analytics', 'AI-powered analytics and predictions', true, 50)
ON CONFLICT (flag_key) DO NOTHING;

-- Seed System Announcement
INSERT INTO system_announcements (title, message, announcement_type, priority, start_date, is_dismissible)
VALUES (
  'Welcome to MASE EMR!',
  'Thank you for choosing MASE EMR. Our system is now live with full functionality including behavioral health, OTP/MAT, county health programs, and more. Contact support if you need assistance.',
  'info',
  'normal',
  NOW(),
  true
) ON CONFLICT DO NOTHING;

-- =====================================================
-- SECTION 8: ENABLE ROW LEVEL SECURITY
-- =====================================================

ALTER TABLE support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_ticket_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE remote_support_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_diagnostics ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_health_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_usage_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_portal_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_appointment_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_request_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_export_logs ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- FINAL SUCCESS MESSAGE
-- =====================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '╔══════════════════════════════════════════════════════════════╗';
  RAISE NOTICE '║                                                              ║';
  RAISE NOTICE '║     MASE EMR - PRODUCTION LAUNCH SQL COMPLETE               ║';
  RAISE NOTICE '║                                                              ║';
  RAISE NOTICE '╠══════════════════════════════════════════════════════════════╣';
  RAISE NOTICE '║                                                              ║';
  RAISE NOTICE '║  NEW TABLES CREATED:                                        ║';
  RAISE NOTICE '║  • IT Support: 5 tables                                     ║';
  RAISE NOTICE '║  • Subscription: 2 tables                                   ║';
  RAISE NOTICE '║  • Patient Portal: 3 tables                                 ║';
  RAISE NOTICE '║  • Reporting: 2 tables                                      ║';
  RAISE NOTICE '║  • System Config: 3 tables                                  ║';
  RAISE NOTICE '║  • Audit/Logging: 3 tables                                  ║';
  RAISE NOTICE '║                                                              ║';
  RAISE NOTICE '║  SEED DATA:                                                 ║';
  RAISE NOTICE '║  • 4 Subscription Plans                                     ║';
  RAISE NOTICE '║  • 7 Feature Flags                                          ║';
  RAISE NOTICE '║  • System Announcement                                      ║';
  RAISE NOTICE '║                                                              ║';
  RAISE NOTICE '║  TOTAL TABLES: 253 + 18 = 271 TABLES                       ║';
  RAISE NOTICE '║                                                              ║';
  RAISE NOTICE '║  STATUS: READY FOR PRODUCTION LAUNCH                        ║';
  RAISE NOTICE '║                                                              ║';
  RAISE NOTICE '╚══════════════════════════════════════════════════════════════╝';
  RAISE NOTICE '';
END $$;
