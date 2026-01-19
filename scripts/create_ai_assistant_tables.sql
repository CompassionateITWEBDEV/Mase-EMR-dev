-- AI Assistant Database Tables
-- Caching, logging, and feedback tables for AI Clinical Assistant

-- Cache AI analysis results
CREATE TABLE IF NOT EXISTS ai_analysis_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  specialty_id TEXT NOT NULL,
  data_hash TEXT NOT NULL, -- Hash of input data to detect changes
  recommendations JSONB NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(patient_id, specialty_id, data_hash)
);

CREATE INDEX IF NOT EXISTS idx_ai_cache_patient_specialty ON ai_analysis_cache(patient_id, specialty_id);
CREATE INDEX IF NOT EXISTS idx_ai_cache_expires ON ai_analysis_cache(expires_at);

-- Log all AI recommendations for audit
CREATE TABLE IF NOT EXISTS ai_recommendations_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
  specialty_id TEXT NOT NULL,
  user_id UUID NOT NULL, -- References auth.users(id)
  recommendation_type TEXT NOT NULL, -- 'risk_alert', 'lab_order', 'recommendation', etc.
  recommendation_text TEXT NOT NULL,
  recommendation_data JSONB,
  accepted BOOLEAN,
  rejected BOOLEAN,
  feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_log_patient ON ai_recommendations_log(patient_id);
CREATE INDEX IF NOT EXISTS idx_ai_log_user ON ai_recommendations_log(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_log_created ON ai_recommendations_log(created_at);

-- Store user feedback on AI recommendations
CREATE TABLE IF NOT EXISTS ai_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recommendation_id UUID REFERENCES ai_recommendations_log(id) ON DELETE CASCADE,
  user_id UUID NOT NULL, -- References auth.users(id)
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  helpful BOOLEAN,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ai_feedback_recommendation ON ai_feedback(recommendation_id);
CREATE INDEX IF NOT EXISTS idx_ai_feedback_user ON ai_feedback(user_id);

-- RLS Policies
ALTER TABLE ai_analysis_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_recommendations_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_feedback ENABLE ROW LEVEL SECURITY;

-- Policies for ai_analysis_cache
CREATE POLICY "Users can view their clinic's cached analyses"
  ON ai_analysis_cache FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = ai_analysis_cache.patient_id
      -- Add clinic check if multi-tenant
    )
  );

-- Policies for ai_recommendations_log
CREATE POLICY "Users can view their clinic's recommendation logs"
  ON ai_recommendations_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM patients p
      WHERE p.id = ai_recommendations_log.patient_id
    )
  );

CREATE POLICY "Users can insert recommendation logs"
  ON ai_recommendations_log FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own recommendation logs"
  ON ai_recommendations_log FOR UPDATE
  USING (user_id::text = (SELECT id::text FROM auth.users WHERE id = auth.uid()));

-- Policies for ai_feedback
CREATE POLICY "Users can view feedback"
  ON ai_feedback FOR SELECT
  USING (true);

CREATE POLICY "Users can insert feedback"
  ON ai_feedback FOR INSERT
  WITH CHECK (user_id::text = (SELECT id::text FROM auth.users WHERE id = auth.uid()));

CREATE POLICY "Users can update their own feedback"
  ON ai_feedback FOR UPDATE
  USING (user_id::text = (SELECT id::text FROM auth.users WHERE id = auth.uid()));
