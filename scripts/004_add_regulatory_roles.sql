-- Add regulatory roles and permissions to support DEA and Joint Commission portals
-- This extends the existing provider system to include regulatory users

-- Create user roles enum
CREATE TYPE user_role AS ENUM (
  'provider',
  'administrator', 
  'dea_inspector',
  'joint_commission_surveyor',
  'state_inspector',
  'compliance_officer',
  'read_only_auditor'
);

-- Add role column to providers table
ALTER TABLE public.providers 
ADD COLUMN IF NOT EXISTS role user_role DEFAULT 'provider',
ADD COLUMN IF NOT EXISTS organization TEXT,
ADD COLUMN IF NOT EXISTS inspector_id TEXT,
ADD COLUMN IF NOT EXISTS access_level TEXT DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS access_expires_at TIMESTAMP WITH TIME ZONE;

-- Create regulatory access table for temporary inspector credentials
CREATE TABLE IF NOT EXISTS public.regulatory_access (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  inspector_id TEXT NOT NULL UNIQUE,
  inspector_name TEXT NOT NULL,
  organization TEXT NOT NULL, -- 'DEA', 'Joint Commission', 'State Board'
  role user_role NOT NULL,
  facility_id UUID, -- Which facility they can access
  access_granted_by UUID REFERENCES public.providers(id),
  access_granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  access_expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  notes TEXT
);

-- Create compliance reports table
CREATE TABLE IF NOT EXISTS public.compliance_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_type TEXT NOT NULL, -- 'dea_inventory', 'joint_commission_survey', 'state_audit'
  facility_id UUID,
  generated_by UUID REFERENCES public.providers(id),
  generated_for_inspector UUID REFERENCES public.regulatory_access(id),
  report_data JSONB NOT NULL,
  date_range_start DATE,
  date_range_end DATE,
  status TEXT DEFAULT 'draft', -- 'draft', 'submitted', 'reviewed'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create audit log table for regulatory access
CREATE TABLE IF NOT EXISTS public.regulatory_audit_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.providers(id),
  inspector_id TEXT,
  action TEXT NOT NULL, -- 'login', 'view_report', 'download_data', 'logout'
  resource_type TEXT, -- 'patient', 'medication', 'inventory', 'report'
  resource_id UUID,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on new tables
ALTER TABLE public.regulatory_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compliance_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.regulatory_audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for regulatory_access table
CREATE POLICY "Administrators can manage regulatory access" ON public.regulatory_access
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.providers 
      WHERE providers.id = auth.uid() 
      AND providers.role IN ('administrator', 'compliance_officer')
    )
  );

CREATE POLICY "Inspectors can view their own access" ON public.regulatory_access
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.providers 
      WHERE providers.id = auth.uid() 
      AND providers.inspector_id = regulatory_access.inspector_id
    )
  );

-- RLS Policies for compliance_reports table
CREATE POLICY "Providers can manage compliance reports" ON public.compliance_reports
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.providers 
      WHERE providers.id = auth.uid() 
      AND providers.role IN ('provider', 'administrator', 'compliance_officer')
    )
  );

CREATE POLICY "Inspectors can view assigned reports" ON public.compliance_reports
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.providers p
      JOIN public.regulatory_access ra ON p.inspector_id = ra.inspector_id
      WHERE p.id = auth.uid() 
      AND ra.id = compliance_reports.generated_for_inspector
      AND ra.is_active = true
      AND ra.access_expires_at > NOW()
    )
  );

-- RLS Policies for audit log
CREATE POLICY "Administrators can view audit logs" ON public.regulatory_audit_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.providers 
      WHERE providers.id = auth.uid() 
      AND providers.role IN ('administrator', 'compliance_officer')
    )
  );

CREATE POLICY "Users can insert their own audit logs" ON public.regulatory_audit_log
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Update existing RLS policies to include regulatory roles
DROP POLICY IF EXISTS "Providers can view all patients" ON public.patients;
CREATE POLICY "Authorized users can view patients" ON public.patients
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.providers 
      WHERE providers.id = auth.uid() 
      AND providers.role IN ('provider', 'administrator', 'compliance_officer')
    ) OR
    EXISTS (
      SELECT 1 FROM public.providers p
      JOIN public.regulatory_access ra ON p.inspector_id = ra.inspector_id
      WHERE p.id = auth.uid() 
      AND ra.is_active = true
      AND ra.access_expires_at > NOW()
      AND ra.role IN ('dea_inspector', 'joint_commission_surveyor', 'state_inspector')
    )
  );

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_regulatory_access_inspector_id ON public.regulatory_access(inspector_id);
CREATE INDEX IF NOT EXISTS idx_regulatory_access_expires ON public.regulatory_access(access_expires_at);
CREATE INDEX IF NOT EXISTS idx_compliance_reports_type ON public.compliance_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_action ON public.regulatory_audit_log(user_id, action);
CREATE INDEX IF NOT EXISTS idx_providers_role ON public.providers(role);
