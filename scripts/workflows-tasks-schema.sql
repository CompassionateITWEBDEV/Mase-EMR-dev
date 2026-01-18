-- Workflow templates table
CREATE TABLE IF NOT EXISTS workflow_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100), -- admission, discharge, clinical, administrative
  is_active BOOLEAN DEFAULT true,
  estimated_duration_minutes INTEGER,
  priority VARCHAR(20) DEFAULT 'medium', -- low, medium, high, urgent
  requires_approval BOOLEAN DEFAULT false,
  approval_role VARCHAR(50),
  created_by UUID REFERENCES staff(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workflow task templates
CREATE TABLE IF NOT EXISTS workflow_task_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_template_id UUID NOT NULL REFERENCES workflow_templates(id) ON DELETE CASCADE,
  task_name VARCHAR(255) NOT NULL,
  task_description TEXT,
  task_order INTEGER NOT NULL,
  assigned_role VARCHAR(50), -- role that should complete this task
  estimated_duration_minutes INTEGER,
  is_required BOOLEAN DEFAULT true,
  requires_documentation BOOLEAN DEFAULT false,
  form_template_id UUID, -- reference to form template if needed
  dependencies JSONB, -- array of task IDs that must be completed first
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workflow instances (actual workflows in progress)
CREATE TABLE IF NOT EXISTS workflow_instances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_template_id UUID NOT NULL REFERENCES workflow_templates(id),
  patient_id UUID REFERENCES patients(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'in_progress', -- in_progress, completed, cancelled, on_hold
  priority VARCHAR(20) DEFAULT 'medium',
  started_by UUID NOT NULL REFERENCES staff(id),
  completed_by UUID REFERENCES staff(id),
  cancelled_by UUID REFERENCES staff(id),
  cancellation_reason TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workflow tasks (actual tasks in a workflow instance)
CREATE TABLE IF NOT EXISTS workflow_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_instance_id UUID NOT NULL REFERENCES workflow_instances(id) ON DELETE CASCADE,
  task_template_id UUID REFERENCES workflow_task_templates(id),
  task_name VARCHAR(255) NOT NULL,
  task_description TEXT,
  task_order INTEGER NOT NULL,
  assigned_to UUID REFERENCES staff(id),
  assigned_role VARCHAR(50),
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, in_progress, completed, skipped, blocked
  priority VARCHAR(20) DEFAULT 'medium',
  estimated_duration_minutes INTEGER,
  actual_duration_minutes INTEGER,
  is_required BOOLEAN DEFAULT true,
  requires_documentation BOOLEAN DEFAULT false,
  documentation_completed BOOLEAN DEFAULT false,
  form_data JSONB,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID REFERENCES staff(id),
  due_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Task comments/notes
CREATE TABLE IF NOT EXISTS workflow_task_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID NOT NULL REFERENCES workflow_tasks(id) ON DELETE CASCADE,
  comment_text TEXT NOT NULL,
  created_by UUID NOT NULL REFERENCES staff(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Report schedules table
CREATE TABLE IF NOT EXISTS report_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_name VARCHAR(255) NOT NULL,
  report_type VARCHAR(100) NOT NULL, -- productivity, financial, clinical, compliance
  description TEXT,
  schedule_frequency VARCHAR(50) NOT NULL, -- daily, weekly, monthly, quarterly, annual
  schedule_day_of_week INTEGER, -- 0-6 for weekly reports
  schedule_day_of_month INTEGER, -- 1-31 for monthly reports
  schedule_time TIME, -- time of day to run
  recipients TEXT[], -- array of email addresses
  format VARCHAR(20) DEFAULT 'pdf', -- pdf, excel, csv
  parameters JSONB, -- report-specific parameters
  is_active BOOLEAN DEFAULT true,
  last_run_at TIMESTAMP WITH TIME ZONE,
  next_run_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES staff(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Report execution history
CREATE TABLE IF NOT EXISTS report_executions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_schedule_id UUID REFERENCES report_schedules(id) ON DELETE SET NULL,
  report_name VARCHAR(255) NOT NULL,
  report_type VARCHAR(100) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, running, completed, failed
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  file_url TEXT,
  file_size_bytes BIGINT,
  error_message TEXT,
  executed_by UUID REFERENCES staff(id),
  parameters JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_workflow_templates_category ON workflow_templates(category);
CREATE INDEX IF NOT EXISTS idx_workflow_templates_is_active ON workflow_templates(is_active);
CREATE INDEX IF NOT EXISTS idx_workflow_task_templates_workflow_id ON workflow_task_templates(workflow_template_id);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_patient_id ON workflow_instances(patient_id);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_status ON workflow_instances(status);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_started_by ON workflow_instances(started_by);
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_workflow_instance_id ON workflow_tasks(workflow_instance_id);
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_assigned_to ON workflow_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_status ON workflow_tasks(status);
CREATE INDEX IF NOT EXISTS idx_workflow_task_comments_task_id ON workflow_task_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_report_schedules_is_active ON report_schedules(is_active);
CREATE INDEX IF NOT EXISTS idx_report_schedules_next_run_at ON report_schedules(next_run_at);
CREATE INDEX IF NOT EXISTS idx_report_executions_report_schedule_id ON report_executions(report_schedule_id);
CREATE INDEX IF NOT EXISTS idx_report_executions_status ON report_executions(status);

-- Row Level Security Policies
ALTER TABLE workflow_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_task_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE workflow_task_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE report_executions ENABLE ROW LEVEL SECURITY;

-- Workflow templates policies
CREATE POLICY "Allow staff to read workflow templates"
  ON workflow_templates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow admins to manage workflow templates"
  ON workflow_templates FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' IN ('admin', 'clinical_director'));

-- Workflow task templates policies
CREATE POLICY "Allow staff to read workflow task templates"
  ON workflow_task_templates FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow admins to manage workflow task templates"
  ON workflow_task_templates FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' IN ('admin', 'clinical_director'));

-- Workflow instances policies
CREATE POLICY "Allow staff to read workflow instances"
  ON workflow_instances FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow staff to create workflow instances"
  ON workflow_instances FOR INSERT
  TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow staff to update workflow instances"
  ON workflow_instances FOR UPDATE
  TO authenticated
  USING (true);

-- Workflow tasks policies
CREATE POLICY "Allow staff to read workflow tasks"
  ON workflow_tasks FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow assigned staff to update their tasks"
  ON workflow_tasks FOR UPDATE
  TO authenticated
  USING (assigned_to = (auth.jwt() ->> 'sub')::uuid OR auth.jwt() ->> 'role' IN ('admin', 'clinical_director'));

CREATE POLICY "Allow staff to create workflow tasks"
  ON workflow_tasks FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Workflow task comments policies
CREATE POLICY "Allow staff to read task comments"
  ON workflow_task_comments FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow staff to create task comments"
  ON workflow_task_comments FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Report schedules policies
CREATE POLICY "Allow staff to read report schedules"
  ON report_schedules FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow admins to manage report schedules"
  ON report_schedules FOR ALL
  TO authenticated
  USING (auth.jwt() ->> 'role' IN ('admin', 'clinical_director'));

-- Report executions policies
CREATE POLICY "Allow staff to read report executions"
  ON report_executions FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow system to manage report executions"
  ON report_executions FOR ALL
  TO authenticated
  USING (true);

-- Insert sample workflow templates
INSERT INTO workflow_templates (name, description, category, estimated_duration_minutes, priority) VALUES
  ('Patient Admission', 'Complete admission process for new patients', 'admission', 60, 'high'),
  ('Patient Discharge', 'Complete discharge process and follow-up planning', 'discharge', 45, 'high'),
  ('Weekly Clinical Review', 'Weekly review of patient progress and treatment plans', 'clinical', 30, 'medium'),
  ('Medication Reconciliation', 'Reconcile patient medications during transitions of care', 'clinical', 20, 'high'),
  ('Insurance Verification', 'Verify patient insurance coverage and benefits', 'administrative', 15, 'medium')
ON CONFLICT DO NOTHING;
