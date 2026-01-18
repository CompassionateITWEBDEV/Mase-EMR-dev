-- Seeding default take-home eligibility rules
INSERT INTO TakehomeRules (rule_name, rule_value, risk_level, description) VALUES
('max_consecutive_days', '3', 'high', 'Maximum consecutive take-home days for high-risk patients'),
('max_consecutive_days', '7', 'standard', 'Maximum consecutive take-home days for standard patients'),
('max_consecutive_days', '14', 'low', 'Maximum consecutive take-home days for low-risk patients'),
('missed_returns_allowed', '0', 'all', 'Number of missed returns allowed before hold'),
('seal_integrity_required', '100', 'all', 'Percentage of seal integrity required'),
('residue_threshold_ml', '1.0', 'all', 'Maximum residue allowed in returned bottles'),
('video_checkins_required', 'true', 'all', 'Whether video check-ins are required'),
('positive_uds_auto_hold', 'true', 'all', 'Auto-hold on positive UDS results'),
('late_pickup_window_hours', '24', 'all', 'Hours allowed for late pickup before marking missed');
