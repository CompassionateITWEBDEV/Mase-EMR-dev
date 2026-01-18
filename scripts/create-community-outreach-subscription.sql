-- Community Outreach Subscription Management
-- This enables MASE Access as a premium add-on feature

-- Subscription plan details
INSERT INTO subscription_plans (id, name, tier, monthly_price, annual_price, max_staff_users, features, is_active, created_at, updated_at)
VALUES 
  ('00000000-0000-0000-0000-000000000001', 'Core EMR', 'basic', 499.00, 4990.00, 10, 
   '{"patient_management": true, "clinical_notes": true, "medication_management": true, "billing": true}'::jsonb, 
   true, now(), now()),
  ('00000000-0000-0000-0000-000000000002', 'Professional', 'professional', 999.00, 9990.00, 25, 
   '{"patient_management": true, "clinical_notes": true, "medication_management": true, "billing": true, "analytics": true, "telehealth": true}'::jsonb, 
   true, now(), now()),
  ('00000000-0000-0000-0000-000000000003', 'Enterprise', 'enterprise', 1999.00, 19990.00, 100, 
   '{"patient_management": true, "clinical_notes": true, "medication_management": true, "billing": true, "analytics": true, "telehealth": true, "hie_network": true, "custom_integrations": true}'::jsonb, 
   true, now(), now())
ON CONFLICT (id) DO NOTHING;

-- Create Community Outreach add-on
CREATE TABLE IF NOT EXISTS community_outreach_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id),
  subscription_id UUID REFERENCES clinic_subscriptions(id),
  feature_tier VARCHAR(50) NOT NULL DEFAULT 'basic', -- basic, professional, enterprise
  status VARCHAR(50) NOT NULL DEFAULT 'trial', -- trial, active, suspended, cancelled
  monthly_price NUMERIC(10,2) NOT NULL DEFAULT 299.00,
  trial_end_date TIMESTAMP WITH TIME ZONE,
  activated_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  cancellation_reason TEXT,
  
  -- Feature limits based on tier
  max_monthly_screenings INTEGER NOT NULL DEFAULT 100,
  max_monthly_referrals INTEGER NOT NULL DEFAULT 50,
  max_external_providers INTEGER NOT NULL DEFAULT 10,
  enable_roi_portal BOOLEAN NOT NULL DEFAULT true,
  enable_provider_portal BOOLEAN NOT NULL DEFAULT true,
  enable_patient_consent_forms BOOLEAN NOT NULL DEFAULT true,
  enable_analytics BOOLEAN NOT NULL DEFAULT false,
  enable_custom_branding BOOLEAN NOT NULL DEFAULT false,
  
  -- Usage tracking
  current_month_screenings INTEGER NOT NULL DEFAULT 0,
  current_month_referrals INTEGER NOT NULL DEFAULT 0,
  current_month_external_submissions INTEGER NOT NULL DEFAULT 0,
  last_usage_reset DATE DEFAULT CURRENT_DATE,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for organization lookup
CREATE INDEX IF NOT EXISTS idx_community_outreach_subscriptions_org 
  ON community_outreach_subscriptions(organization_id);

-- Track usage for billing
CREATE TABLE IF NOT EXISTS community_outreach_usage_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID NOT NULL REFERENCES community_outreach_subscriptions(id),
  usage_type VARCHAR(50) NOT NULL, -- screening, referral, external_submission, provider_access
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  usage_count INTEGER NOT NULL DEFAULT 1,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_outreach_usage_log_sub_date 
  ON community_outreach_usage_log(subscription_id, usage_date);

-- Function to check if organization has active outreach subscription
CREATE OR REPLACE FUNCTION has_active_outreach_subscription(org_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM community_outreach_subscriptions
    WHERE organization_id = org_id
    AND status = 'active'
    AND (trial_end_date IS NULL OR trial_end_date > NOW())
  );
END;
$$ LANGUAGE plpgsql;

-- Function to check feature access
CREATE OR REPLACE FUNCTION can_use_outreach_feature(org_id UUID, feature_name VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
  sub_record RECORD;
BEGIN
  SELECT * INTO sub_record
  FROM community_outreach_subscriptions
  WHERE organization_id = org_id
  AND (status = 'active' OR (status = 'trial' AND trial_end_date > NOW()))
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  CASE feature_name
    WHEN 'roi_portal' THEN
      RETURN sub_record.enable_roi_portal;
    WHEN 'provider_portal' THEN
      RETURN sub_record.enable_provider_portal;
    WHEN 'consent_forms' THEN
      RETURN sub_record.enable_patient_consent_forms;
    WHEN 'analytics' THEN
      RETURN sub_record.enable_analytics;
    WHEN 'custom_branding' THEN
      RETURN sub_record.enable_custom_branding;
    ELSE
      RETURN FALSE;
  END CASE;
END;
$$ LANGUAGE plpgsql;

-- Function to track usage and check limits
CREATE OR REPLACE FUNCTION track_outreach_usage(org_id UUID, usage_type_param VARCHAR)
RETURNS BOOLEAN AS $$
DECLARE
  sub_record RECORD;
  current_count INTEGER;
  limit_exceeded BOOLEAN := FALSE;
BEGIN
  -- Get subscription
  SELECT * INTO sub_record
  FROM community_outreach_subscriptions
  WHERE organization_id = org_id
  AND (status = 'active' OR (status = 'trial' AND trial_end_date > NOW()))
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN FALSE; -- No active subscription
  END IF;
  
  -- Reset monthly counters if needed
  IF sub_record.last_usage_reset < DATE_TRUNC('month', CURRENT_DATE) THEN
    UPDATE community_outreach_subscriptions
    SET 
      current_month_screenings = 0,
      current_month_referrals = 0,
      current_month_external_submissions = 0,
      last_usage_reset = CURRENT_DATE
    WHERE id = sub_record.id;
    
    sub_record.current_month_screenings := 0;
    sub_record.current_month_referrals := 0;
    sub_record.current_month_external_submissions := 0;
  END IF;
  
  -- Check limits based on usage type
  CASE usage_type_param
    WHEN 'screening' THEN
      current_count := sub_record.current_month_screenings + 1;
      limit_exceeded := current_count > sub_record.max_monthly_screenings;
      
      IF NOT limit_exceeded THEN
        UPDATE community_outreach_subscriptions
        SET current_month_screenings = current_count
        WHERE id = sub_record.id;
      END IF;
      
    WHEN 'referral' THEN
      current_count := sub_record.current_month_referrals + 1;
      limit_exceeded := current_count > sub_record.max_monthly_referrals;
      
      IF NOT limit_exceeded THEN
        UPDATE community_outreach_subscriptions
        SET current_month_referrals = current_count
        WHERE id = sub_record.id;
      END IF;
      
    WHEN 'external_submission' THEN
      current_count := sub_record.current_month_external_submissions + 1;
      -- No limit on external submissions, just tracking
      
      UPDATE community_outreach_subscriptions
      SET current_month_external_submissions = current_count
      WHERE id = sub_record.id;
  END CASE;
  
  -- Log usage
  INSERT INTO community_outreach_usage_log (subscription_id, usage_type, usage_count)
  VALUES (sub_record.id, usage_type_param, 1);
  
  RETURN NOT limit_exceeded;
END;
$$ LANGUAGE plpgsql;

-- RLS Policies
ALTER TABLE community_outreach_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_outreach_usage_log ENABLE ROW LEVEL SECURITY;

-- Organizations can view their own subscription
CREATE POLICY outreach_sub_org_access ON community_outreach_subscriptions
  FOR ALL
  USING (organization_id = (SELECT organization_id FROM staff WHERE id = auth.uid() LIMIT 1));

-- Service role has full access
CREATE POLICY outreach_sub_service_role ON community_outreach_subscriptions
  FOR ALL
  USING (auth.role() = 'service_role');

-- Organizations can view their own usage
CREATE POLICY outreach_usage_org_access ON community_outreach_usage_log
  FOR SELECT
  USING (subscription_id IN (
    SELECT id FROM community_outreach_subscriptions
    WHERE organization_id = (SELECT organization_id FROM staff WHERE id = auth.uid() LIMIT 1)
  ));

-- Service role has full access to usage logs
CREATE POLICY outreach_usage_service_role ON community_outreach_usage_log
  FOR ALL
  USING (auth.role() = 'service_role');
