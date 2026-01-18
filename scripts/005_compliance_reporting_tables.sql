-- Add tables for compliance reporting system
-- This extends the regulatory system to support automated report generation

-- Create report templates table
CREATE TABLE IF NOT EXISTS public.report_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  type TEXT NOT NULL, -- 'dea', 'joint_commission', 'combined', 'custom'
  description TEXT,
  sections JSONB NOT NULL, -- Array of report sections
  parameters JSONB, -- Default parameters and configuration
  estimated_time INTEGER, -- Minutes to generate
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES public.providers(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create generated reports table
CREATE TABLE IF NOT EXISTS public.generated_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID REFERENCES public.report_templates(id),
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  parameters JSONB, -- Parameters used for generation
  status TEXT DEFAULT 'generating', -- 'generating', 'ready', 'error', 'archived'
  file_path TEXT, -- Path to generated report file
  file_size BIGINT, -- File size in bytes
  generated_by UUID REFERENCES public.providers(id),
  generated_for_inspector UUID REFERENCES public.regulatory_access(id),
  generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE, -- When report should be archived/deleted
  download_count INTEGER DEFAULT 0,
  last_downloaded_at TIMESTAMP WITH TIME ZONE
);

-- Create scheduled reports table
CREATE TABLE IF NOT EXISTS public.scheduled_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  template_id UUID REFERENCES public.report_templates(id),
  name TEXT NOT NULL,
  schedule_type TEXT NOT NULL, -- 'daily', 'weekly', 'monthly', 'quarterly', 'yearly'
  schedule_config JSONB NOT NULL, -- Cron-like configuration
  parameters JSONB, -- Default parameters for scheduled generation
  is_active BOOLEAN DEFAULT true,
  last_generated_at TIMESTAMP WITH TIME ZONE,
  next_generation_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES public.providers(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create report sections table for tracking generation progress
CREATE TABLE IF NOT EXISTS public.report_sections (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id UUID REFERENCES public.generated_reports(id) ON DELETE CASCADE,
  section_name TEXT NOT NULL,
  section_order INTEGER NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'error'
  data_source TEXT, -- Which system/table the data comes from
  generated_at TIMESTAMP WITH TIME ZONE,
  error_message TEXT
);

-- Enable RLS on new tables
ALTER TABLE public.report_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.generated_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_sections ENABLE ROW LEVEL SECURITY;

-- RLS Policies for report_templates
CREATE POLICY "Providers can view report templates" ON public.report_templates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.providers 
      WHERE providers.id = auth.uid() 
      AND providers.role IN ('provider', 'administrator', 'compliance_officer')
    )
  );

CREATE POLICY "Administrators can manage report templates" ON public.report_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.providers 
      WHERE providers.id = auth.uid() 
      AND providers.role IN ('administrator', 'compliance_officer')
    )
  );

-- RLS Policies for generated_reports
CREATE POLICY "Providers can view generated reports" ON public.generated_reports
  FOR SELECT USING (
    generated_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.providers 
      WHERE providers.id = auth.uid() 
      AND providers.role IN ('administrator', 'compliance_officer')
    ) OR
    EXISTS (
      SELECT 1 FROM public.providers p
      JOIN public.regulatory_access ra ON p.inspector_id = ra.inspector_id
      WHERE p.id = auth.uid() 
      AND ra.id = generated_reports.generated_for_inspector
      AND ra.is_active = true
      AND ra.access_expires_at > NOW()
    )
  );

CREATE POLICY "Providers can create reports" ON public.generated_reports
  FOR INSERT WITH CHECK (
    generated_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.providers 
      WHERE providers.id = auth.uid() 
      AND providers.role IN ('provider', 'administrator', 'compliance_officer')
    )
  );

CREATE POLICY "Providers can update their reports" ON public.generated_reports
  FOR UPDATE USING (
    generated_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.providers 
      WHERE providers.id = auth.uid() 
      AND providers.role IN ('administrator', 'compliance_officer')
    )
  );

-- RLS Policies for scheduled_reports
CREATE POLICY "Administrators can manage scheduled reports" ON public.scheduled_reports
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.providers 
      WHERE providers.id = auth.uid() 
      AND providers.role IN ('administrator', 'compliance_officer')
    )
  );

-- RLS Policies for report_sections
CREATE POLICY "Users can view report sections for their reports" ON public.report_sections
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.generated_reports gr
      WHERE gr.id = report_sections.report_id
      AND (
        gr.generated_by = auth.uid() OR
        EXISTS (
          SELECT 1 FROM public.providers 
          WHERE providers.id = auth.uid() 
          AND providers.role IN ('administrator', 'compliance_officer')
        )
      )
    )
  );

-- Insert default report templates
INSERT INTO public.report_templates (name, type, description, sections, estimated_time) VALUES
(
  'Complete DEA Inspection Report',
  'dea',
  'Comprehensive report covering all DEA compliance requirements',
  '["Facility Information & Registration", "Inventory Records & Reconciliation", "Acquisition & Form 222 Documentation", "Dispensing Logs & Patient Records", "Waste & Disposal Documentation", "Security & Storage Compliance", "Staff Training & Access Records"]',
  5
),
(
  'DEA Inventory Reconciliation',
  'dea',
  'Detailed inventory analysis and variance reporting',
  '["Current Inventory Status", "Perpetual Inventory Records", "Biennial Inventory Documentation", "Variance Analysis & Explanations", "Batch Tracking & Expiration Management"]',
  3
),
(
  'Joint Commission Accreditation Readiness',
  'joint_commission',
  'Complete accreditation standards compliance assessment',
  '["Standards Compliance Summary", "Quality Measures Performance", "Patient Safety Events & Analysis", "Staff Competency Documentation", "Policy & Procedure Review", "Performance Improvement Activities"]',
  7
),
(
  'Quality Measures Dashboard',
  'joint_commission',
  'Performance metrics and quality indicator analysis',
  '["Clinical Quality Measures", "Patient Safety Indicators", "Patient Experience Scores", "Outcome Metrics & Trends", "Benchmark Comparisons"]',
  4
),
(
  'Unified Compliance Summary',
  'combined',
  'Combined DEA and Joint Commission compliance overview',
  '["Executive Summary", "DEA Compliance Status", "Joint Commission Standards", "Critical Issues & Action Plans", "Regulatory Timeline & Deadlines", "Resource Requirements"]',
  6
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_generated_reports_type ON public.generated_reports(type);
CREATE INDEX IF NOT EXISTS idx_generated_reports_status ON public.generated_reports(status);
CREATE INDEX IF NOT EXISTS idx_generated_reports_generated_by ON public.generated_reports(generated_by);
CREATE INDEX IF NOT EXISTS idx_generated_reports_generated_at ON public.generated_reports(generated_at);
CREATE INDEX IF NOT EXISTS idx_scheduled_reports_next_generation ON public.scheduled_reports(next_generation_at);
CREATE INDEX IF NOT EXISTS idx_report_sections_report_id ON public.report_sections(report_id);
