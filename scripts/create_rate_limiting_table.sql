-- Rate Limiting Table for AI Assistant
-- Tracks API usage to prevent abuse and control costs

CREATE TABLE IF NOT EXISTS ai_rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL, -- References auth.users(id)
  clinic_id UUID, -- References clinics(id) if multi-tenant
  endpoint TEXT NOT NULL, -- 'ai_assistant', 'treatment_plan', 'note_draft', etc.
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_rate_limits_user ON ai_rate_limits(user_id, endpoint, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_rate_limits_clinic ON ai_rate_limits(clinic_id, endpoint, created_at);
CREATE INDEX IF NOT EXISTS idx_ai_rate_limits_created ON ai_rate_limits(created_at);

-- RLS Policies
ALTER TABLE ai_rate_limits ENABLE ROW LEVEL SECURITY;

-- Users can view their own rate limit records
CREATE POLICY "Users can view their own rate limits"
  ON ai_rate_limits FOR SELECT
  USING (user_id::text = (SELECT id::text FROM auth.users WHERE id = auth.uid()));

-- System can insert rate limit records (via service role)
CREATE POLICY "System can insert rate limits"
  ON ai_rate_limits FOR INSERT
  WITH CHECK (true);

-- Cleanup function (run periodically via cron)
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM ai_rate_limits
  WHERE created_at < NOW() - INTERVAL '2 hours';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;
