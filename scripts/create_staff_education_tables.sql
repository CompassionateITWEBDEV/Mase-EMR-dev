-- Staff Education System Tables
-- Creates tables for tracking staff-specific education, certifications, and CEU hours

-- Training modules catalog with regulatory sources
CREATE TABLE IF NOT EXISTS training_modules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  module_code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) NOT NULL, -- compliance, clinical, safety, policy
  regulatory_source VARCHAR(100), -- SAMHSA, Joint Commission, DEA, State of Michigan, 42 CFR
  ceu_hours DECIMAL(4,2) DEFAULT 0,
  duration_minutes INTEGER NOT NULL,
  is_required BOOLEAN DEFAULT true,
  frequency VARCHAR(50) DEFAULT 'annual', -- annual, biannual, quarterly, one-time
  passing_score INTEGER DEFAULT 80,
  content JSONB, -- module content sections
  quiz_questions JSONB, -- quiz for certification
  effective_date DATE DEFAULT CURRENT_DATE,
  expiration_date DATE,
  version VARCHAR(20) DEFAULT '1.0',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Staff training completions and progress
CREATE TABLE IF NOT EXISTS staff_training_completions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id),
  module_id UUID NOT NULL REFERENCES training_modules(id),
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  progress_percentage INTEGER DEFAULT 0,
  quiz_score INTEGER,
  passed BOOLEAN DEFAULT false,
  attempts INTEGER DEFAULT 0,
  certificate_number VARCHAR(100),
  certificate_issued_at TIMESTAMP WITH TIME ZONE,
  certificate_expires_at TIMESTAMP WITH TIME ZONE,
  ceu_hours_earned DECIMAL(4,2) DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(staff_id, module_id)
);

-- Staff CEU tracking summary
CREATE TABLE IF NOT EXISTS staff_ceu_summary (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  total_ceu_hours DECIMAL(6,2) DEFAULT 0,
  required_ceu_hours DECIMAL(6,2) DEFAULT 0,
  compliance_hours DECIMAL(6,2) DEFAULT 0,
  clinical_hours DECIMAL(6,2) DEFAULT 0,
  safety_hours DECIMAL(6,2) DEFAULT 0,
  policy_hours DECIMAL(6,2) DEFAULT 0,
  is_compliant BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(staff_id, period_start, period_end)
);

-- Regulatory updates from SAMHSA, Joint Commission, etc.
CREATE TABLE IF NOT EXISTS regulatory_updates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source VARCHAR(100) NOT NULL, -- SAMHSA, Joint Commission, DEA, Michigan LARA, CMS
  update_type VARCHAR(100) NOT NULL, -- policy_change, new_requirement, guidance, alert
  title VARCHAR(500) NOT NULL,
  summary TEXT,
  full_content TEXT,
  effective_date DATE,
  compliance_deadline DATE,
  priority VARCHAR(20) DEFAULT 'normal', -- low, normal, high, critical
  affected_roles JSONB, -- which staff roles are affected
  requires_training BOOLEAN DEFAULT false,
  training_module_id UUID REFERENCES training_modules(id),
  external_link TEXT,
  acknowledgment_required BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Staff acknowledgments of regulatory updates
CREATE TABLE IF NOT EXISTS staff_regulatory_acknowledgments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID NOT NULL REFERENCES staff(id),
  update_id UUID NOT NULL REFERENCES regulatory_updates(id),
  acknowledged_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ip_address INET,
  UNIQUE(staff_id, update_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_training_modules_category ON training_modules(category);
CREATE INDEX IF NOT EXISTS idx_training_modules_source ON training_modules(regulatory_source);
CREATE INDEX IF NOT EXISTS idx_staff_training_staff ON staff_training_completions(staff_id);
CREATE INDEX IF NOT EXISTS idx_staff_training_module ON staff_training_completions(module_id);
CREATE INDEX IF NOT EXISTS idx_staff_ceu_staff ON staff_ceu_summary(staff_id);
CREATE INDEX IF NOT EXISTS idx_regulatory_updates_source ON regulatory_updates(source);
CREATE INDEX IF NOT EXISTS idx_regulatory_acks_staff ON staff_regulatory_acknowledgments(staff_id);
