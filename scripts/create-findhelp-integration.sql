-- Create table to track findhelp.org resource searches and referrals
CREATE TABLE IF NOT EXISTS findhelp_resource_searches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_location TEXT,
  search_category TEXT,
  search_query TEXT,
  user_type TEXT, -- 'patient', 'staff', 'anonymous'
  user_id UUID,
  results_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create table to track when users click through to findhelp.org resources
CREATE TABLE IF NOT EXISTS findhelp_resource_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  search_id UUID REFERENCES findhelp_resource_searches(id),
  resource_type TEXT,
  resource_name TEXT,
  resource_url TEXT,
  patient_id UUID,
  staff_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_findhelp_searches_created_at ON findhelp_resource_searches(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_findhelp_searches_category ON findhelp_resource_searches(search_category);
CREATE INDEX IF NOT EXISTS idx_findhelp_referrals_search_id ON findhelp_resource_referrals(search_id);

-- Create view for analytics
CREATE OR REPLACE VIEW findhelp_usage_analytics AS
SELECT 
  DATE_TRUNC('day', s.created_at) as date,
  s.search_category,
  COUNT(DISTINCT s.id) as total_searches,
  COUNT(DISTINCT r.id) as total_referrals,
  ROUND(COUNT(DISTINCT r.id)::NUMERIC / NULLIF(COUNT(DISTINCT s.id), 0) * 100, 2) as conversion_rate
FROM findhelp_resource_searches s
LEFT JOIN findhelp_resource_referrals r ON s.id = r.search_id
GROUP BY DATE_TRUNC('day', s.created_at), s.search_category
ORDER BY date DESC, total_searches DESC;

COMMENT ON TABLE findhelp_resource_searches IS 'Tracks searches performed using findhelp.org integration';
COMMENT ON TABLE findhelp_resource_referrals IS 'Tracks when users access resources through findhelp.org';
COMMENT ON VIEW findhelp_usage_analytics IS 'Analytics view for findhelp.org resource usage and engagement';
