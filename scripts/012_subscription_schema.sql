-- Clinic Subscription Schema
-- Run this to create subscription management tables

-- Subscription plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  tier VARCHAR(50) NOT NULL CHECK (tier IN ('basic', 'professional', 'enterprise')),
  monthly_price DECIMAL(10, 2) NOT NULL,
  annual_price DECIMAL(10, 2),
  max_staff_users INTEGER,
  features JSONB DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Clinic subscriptions table
CREATE TABLE IF NOT EXISTS clinic_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID NOT NULL,
  plan_id UUID REFERENCES subscription_plans(id),
  tier VARCHAR(50) NOT NULL DEFAULT 'basic',
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'cancelled', 'trialing')),
  billing_cycle VARCHAR(20) NOT NULL DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'annual')),
  current_period_start TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_period_end TIMESTAMPTZ NOT NULL,
  cancelled_at TIMESTAMPTZ,
  stripe_subscription_id VARCHAR(255),
  stripe_customer_id VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscription add-ons table
CREATE TABLE IF NOT EXISTS subscription_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES clinic_subscriptions(id) ON DELETE CASCADE,
  feature_id VARCHAR(100) NOT NULL,
  feature_name VARCHAR(200) NOT NULL,
  monthly_price DECIMAL(10, 2) NOT NULL,
  enabled BOOLEAN DEFAULT true,
  enabled_at TIMESTAMPTZ DEFAULT NOW(),
  disabled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Feature usage tracking table
CREATE TABLE IF NOT EXISTS feature_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES clinic_subscriptions(id) ON DELETE CASCADE,
  feature_id VARCHAR(100) NOT NULL,
  usage_count INTEGER DEFAULT 0,
  usage_limit INTEGER,
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Subscription billing history
CREATE TABLE IF NOT EXISTS subscription_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id UUID REFERENCES clinic_subscriptions(id) ON DELETE CASCADE,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  tax DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
  period_start TIMESTAMPTZ NOT NULL,
  period_end TIMESTAMPTZ NOT NULL,
  line_items JSONB DEFAULT '[]',
  stripe_invoice_id VARCHAR(255),
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert default plans
INSERT INTO subscription_plans (name, tier, monthly_price, annual_price, max_staff_users, features) VALUES
('Basic', 'basic', 299, 2990, 5, '["medication-dispensing", "clinical-protocols", "patient-portal", "staff-management"]'),
('Professional', 'professional', 599, 5990, 25, '["medication-dispensing", "clinical-protocols", "patient-portal", "staff-management", "e-prescribing", "telehealth", "lab-integration", "billing-claims", "clearinghouse", "otp-bundle", "pmp-integration", "mobile-check-in", "sms-reminders", "workflows"]'),
('Enterprise', 'enterprise', 999, 9990, NULL, '["medication-dispensing", "clinical-protocols", "patient-portal", "staff-management", "e-prescribing", "telehealth", "lab-integration", "billing-claims", "clearinghouse", "otp-bundle", "pmp-integration", "mobile-check-in", "sms-reminders", "workflows", "prior-auth", "multi-location", "ai-assistant", "advanced-analytics", "predictive-insights"]')
ON CONFLICT DO NOTHING;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_clinic_subscriptions_clinic_id ON clinic_subscriptions(clinic_id);
CREATE INDEX IF NOT EXISTS idx_clinic_subscriptions_status ON clinic_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscription_addons_subscription_id ON subscription_addons(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_addons_feature_id ON subscription_addons(feature_id);
CREATE INDEX IF NOT EXISTS idx_feature_usage_subscription_id ON feature_usage(subscription_id);
CREATE INDEX IF NOT EXISTS idx_subscription_invoices_subscription_id ON subscription_invoices(subscription_id);

-- Enable RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE clinic_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE feature_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_invoices ENABLE ROW LEVEL SECURITY;

-- RLS Policies (allow all for now, restrict based on clinic_id in production)
CREATE POLICY "Allow all access to subscription_plans" ON subscription_plans FOR ALL USING (true);
CREATE POLICY "Allow all access to clinic_subscriptions" ON clinic_subscriptions FOR ALL USING (true);
CREATE POLICY "Allow all access to subscription_addons" ON subscription_addons FOR ALL USING (true);
CREATE POLICY "Allow all access to feature_usage" ON feature_usage FOR ALL USING (true);
CREATE POLICY "Allow all access to subscription_invoices" ON subscription_invoices FOR ALL USING (true);
