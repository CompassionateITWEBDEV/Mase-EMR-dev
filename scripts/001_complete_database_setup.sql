-- ============================================================================
-- MASE Behavioral Health EMR - Complete Database Setup
-- This script runs all schemas in the correct order
-- Version 1.0
-- ============================================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- STEP 1: CORE TABLES (No dependencies)
-- ============================================================================

-- Providers/Clinicians table
CREATE TABLE IF NOT EXISTS public.providers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  license_number TEXT,
  license_type TEXT,
  specialization TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Staff table (for non-provider staff)
CREATE TABLE IF NOT EXISTS public.staff (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL,
  phone TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Patients table
CREATE TABLE IF NOT EXISTS public.patients (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  date_of_birth DATE NOT NULL,
  gender TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  emergency_contact_name TEXT,
  emergency_contact_phone TEXT,
  insurance_provider TEXT,
  insurance_id TEXT,
  created_by UUID REFERENCES public.providers(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insurance payers table
CREATE TABLE IF NOT EXISTS public.insurance_payers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payer_name VARCHAR(255) NOT NULL,
  payer_id VARCHAR(100) UNIQUE NOT NULL,
  payer_type VARCHAR(50),
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(2),
  zip_code VARCHAR(10),
  phone VARCHAR(20),
  fax VARCHAR(20),
  email VARCHAR(255),
  claims_address TEXT,
  electronic_payer_id VARCHAR(100),
  accepts_electronic_claims BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- STEP 2: DEPENDENT TABLES
-- ============================================================================

-- Patient insurance table
CREATE TABLE IF NOT EXISTS public.patient_insurance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  payer_id UUID REFERENCES public.insurance_payers(id),
  policy_number VARCHAR(100) NOT NULL,
  group_number VARCHAR(100),
  subscriber_name VARCHAR(255),
  subscriber_relationship VARCHAR(50),
  subscriber_dob DATE,
  effective_date DATE,
  termination_date DATE,
  is_primary BOOLEAN DEFAULT true,
  copay_amount DECIMAL(10,2),
  deductible_amount DECIMAL(10,2),
  out_of_pocket_max DECIMAL(10,2),
  coverage_level VARCHAR(50),
  status VARCHAR(20) DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Appointments table
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES public.providers(id) ON DELETE CASCADE,
  appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  appointment_type TEXT NOT NULL,
  status TEXT DEFAULT 'scheduled',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insurance claims table
CREATE TABLE IF NOT EXISTS public.insurance_claims (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  patient_insurance_id UUID REFERENCES public.patient_insurance(id),
  payer_id UUID NOT NULL REFERENCES public.insurance_payers(id),
  provider_id UUID NOT NULL REFERENCES public.providers(id),
  claim_number VARCHAR(100) UNIQUE NOT NULL,
  service_date_from DATE NOT NULL,
  service_date_to DATE NOT NULL,
  total_charges DECIMAL(10,2) NOT NULL,
  diagnosis_codes TEXT[],
  procedure_codes TEXT[],
  claim_status VARCHAR(50) DEFAULT 'draft',
  submitted_date DATE,
  paid_date DATE,
  paid_amount DECIMAL(10,2),
  patient_responsibility DECIMAL(10,2),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- STEP 3: MEDICATIONS AND PRESCRIPTIONS
-- ============================================================================

-- Pharmacies table
CREATE TABLE IF NOT EXISTS public.pharmacies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  address TEXT,
  city VARCHAR(100),
  state VARCHAR(2),
  zip_code VARCHAR(10),
  phone VARCHAR(20),
  fax VARCHAR(20),
  email VARCHAR(255),
  ncpdp_id VARCHAR(20),
  npi VARCHAR(10),
  is_active BOOLEAN DEFAULT true,
  accepts_e_prescribing BOOLEAN DEFAULT false,
  hours_of_operation JSONB,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Patient medications table
CREATE TABLE IF NOT EXISTS public.patient_medications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  medication_name VARCHAR(255) NOT NULL,
  generic_name VARCHAR(255),
  dosage VARCHAR(100) NOT NULL,
  frequency VARCHAR(100) NOT NULL,
  route VARCHAR(50) NOT NULL DEFAULT 'oral',
  start_date DATE NOT NULL,
  end_date DATE,
  prescribed_by UUID REFERENCES public.staff(id),
  medication_type VARCHAR(20) NOT NULL DEFAULT 'regular',
  ndc_number VARCHAR(20),
  pharmacy_id UUID REFERENCES public.pharmacies(id),
  refills_remaining INTEGER DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  discontinuation_reason TEXT,
  discontinued_by UUID REFERENCES public.staff(id),
  discontinued_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Prescriptions table
CREATE TABLE IF NOT EXISTS public.prescriptions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  medication_id UUID REFERENCES public.patient_medications(id),
  medication_name VARCHAR(255) NOT NULL,
  strength VARCHAR(100) NOT NULL,
  dosage_form VARCHAR(100),
  quantity INTEGER NOT NULL,
  days_supply INTEGER NOT NULL,
  directions TEXT NOT NULL,
  refills INTEGER DEFAULT 0,
  prescribed_by UUID NOT NULL REFERENCES public.staff(id),
  pharmacy_id UUID REFERENCES public.pharmacies(id),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  transmission_status VARCHAR(50),
  transmission_date TIMESTAMP WITH TIME ZONE,
  transmission_error TEXT,
  filled_date TIMESTAMP WITH TIME ZONE,
  cancelled_reason TEXT,
  cancelled_by UUID REFERENCES public.staff(id),
  cancelled_at TIMESTAMP WITH TIME ZONE,
  is_controlled_substance BOOLEAN DEFAULT false,
  dea_schedule VARCHAR(10),
  diagnosis_codes TEXT[],
  prior_authorization_required BOOLEAN DEFAULT false,
  prior_authorization_number VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- STEP 4: WORKFLOWS AND TASKS
-- ============================================================================

-- Workflow templates table
CREATE TABLE IF NOT EXISTS public.workflow_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  estimated_duration_minutes INTEGER,
  priority VARCHAR(20) DEFAULT 'medium',
  requires_approval BOOLEAN DEFAULT false,
  approval_role VARCHAR(50),
  created_by UUID REFERENCES public.staff(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workflow instances table
CREATE TABLE IF NOT EXISTS public.workflow_instances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_template_id UUID NOT NULL REFERENCES public.workflow_templates(id),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'in_progress',
  priority VARCHAR(20) DEFAULT 'medium',
  started_by UUID NOT NULL REFERENCES public.staff(id),
  completed_by UUID REFERENCES public.staff(id),
  cancelled_by UUID REFERENCES public.staff(id),
  cancellation_reason TEXT,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  due_date TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Workflow tasks table
CREATE TABLE IF NOT EXISTS public.workflow_tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  workflow_instance_id UUID NOT NULL REFERENCES public.workflow_instances(id) ON DELETE CASCADE,
  task_name VARCHAR(255) NOT NULL,
  task_description TEXT,
  task_order INTEGER NOT NULL,
  assigned_to UUID REFERENCES public.staff(id),
  assigned_role VARCHAR(50),
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
  priority VARCHAR(20) DEFAULT 'medium',
  estimated_duration_minutes INTEGER,
  actual_duration_minutes INTEGER,
  is_required BOOLEAN DEFAULT true,
  requires_documentation BOOLEAN DEFAULT false,
  documentation_completed BOOLEAN DEFAULT false,
  form_data JSONB,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  completed_by UUID REFERENCES public.staff(id),
  due_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- STEP 5: CLEARINGHOUSE AND EDI
-- ============================================================================

-- Clearinghouse connections table
CREATE TABLE IF NOT EXISTS public.clearinghouse_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clearinghouse_name VARCHAR(255) NOT NULL,
    clearinghouse_id VARCHAR(100) UNIQUE NOT NULL,
    connection_type VARCHAR(50) DEFAULT 'api',
    api_endpoint VARCHAR(500),
    submitter_id VARCHAR(100),
    receiver_id VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    is_production BOOLEAN DEFAULT false,
    connection_status VARCHAR(50) DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Claim batches table
CREATE TABLE IF NOT EXISTS public.claim_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_number VARCHAR(100) UNIQUE NOT NULL,
    clearinghouse_id UUID NOT NULL REFERENCES public.clearinghouse_connections(id),
    batch_type VARCHAR(50) DEFAULT '837P',
    total_claims INTEGER DEFAULT 0,
    total_charges DECIMAL(12,2) DEFAULT 0,
    batch_status VARCHAR(50) DEFAULT 'pending',
    created_by UUID REFERENCES public.providers(id),
    submitted_at TIMESTAMP WITH TIME ZONE,
    acknowledged_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Electronic Remittance Advice table
CREATE TABLE IF NOT EXISTS public.electronic_remittance_advice (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    era_number VARCHAR(100) UNIQUE NOT NULL,
    clearinghouse_id UUID NOT NULL REFERENCES public.clearinghouse_connections(id),
    payer_id UUID NOT NULL REFERENCES public.insurance_payers(id),
    check_eft_number VARCHAR(100),
    payment_method VARCHAR(50),
    payment_date DATE NOT NULL,
    total_payment_amount DECIMAL(12,2) NOT NULL,
    total_claims_count INTEGER DEFAULT 0,
    processing_status VARCHAR(50) DEFAULT 'pending',
    posted_at TIMESTAMP WITH TIME ZONE,
    posted_by UUID REFERENCES public.providers(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- STEP 6: DISCHARGE SUMMARIES
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.discharge_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  provider_id UUID REFERENCES public.providers(id) ON DELETE CASCADE NOT NULL,
  admission_date DATE NOT NULL,
  discharge_date DATE NOT NULL,
  length_of_stay INTEGER GENERATED ALWAYS AS (discharge_date - admission_date) STORED,
  admission_diagnosis TEXT NOT NULL,
  reason_for_admission TEXT NOT NULL,
  treatment_summary TEXT NOT NULL,
  medications_at_admission JSONB,
  medications_at_discharge JSONB,
  procedures_performed JSONB,
  therapies_provided JSONB,
  clinical_course TEXT NOT NULL,
  response_to_treatment TEXT,
  complications TEXT,
  discharge_diagnosis TEXT NOT NULL,
  diagnosis_codes TEXT[],
  final_mental_status_exam JSONB,
  final_risk_assessment JSONB,
  functional_status TEXT,
  discharge_disposition TEXT NOT NULL,
  discharge_condition TEXT NOT NULL,
  follow_up_appointments JSONB,
  follow_up_provider TEXT,
  follow_up_date DATE,
  discharge_instructions TEXT NOT NULL,
  medication_instructions TEXT,
  activity_restrictions TEXT,
  diet_recommendations TEXT,
  warning_signs TEXT,
  emergency_contact_info TEXT,
  aftercare_plan TEXT NOT NULL,
  referrals JSONB,
  community_resources JSONB,
  support_system_notes TEXT,
  patient_education_provided TEXT,
  family_involvement TEXT,
  barriers_to_discharge TEXT,
  special_considerations TEXT,
  status TEXT DEFAULT 'draft',
  finalized_at TIMESTAMP WITH TIME ZONE,
  finalized_by UUID REFERENCES public.providers(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY (Permissive policies since auth is disabled)
-- ============================================================================

ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_payers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_insurance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharmacies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_instances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clearinghouse_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claim_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.electronic_remittance_advice ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discharge_summaries ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES (Allow all for now since auth is disabled)
-- ============================================================================

-- Creating permissive policies for all tables
DO $$ 
DECLARE
    tbl text;
BEGIN
    FOR tbl IN 
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' 
        AND tablename IN (
            'providers', 'staff', 'patients', 'insurance_payers', 
            'patient_insurance', 'appointments', 'insurance_claims',
            'pharmacies', 'patient_medications', 'prescriptions',
            'workflow_templates', 'workflow_instances', 'workflow_tasks',
            'clearinghouse_connections', 'claim_batches', 
            'electronic_remittance_advice', 'discharge_summaries'
        )
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "Allow all access to %I" ON public.%I', tbl, tbl);
        EXECUTE format('CREATE POLICY "Allow all access to %I" ON public.%I FOR ALL USING (true) WITH CHECK (true)', tbl, tbl);
    END LOOP;
END $$;

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_patients_created_by ON public.patients(created_by);
CREATE INDEX IF NOT EXISTS idx_patient_insurance_patient_id ON public.patient_insurance(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_provider_id ON public.appointments(provider_id);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_patient_id ON public.insurance_claims(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_medications_patient_id ON public.patient_medications(patient_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_patient_id ON public.prescriptions(patient_id);
CREATE INDEX IF NOT EXISTS idx_workflow_instances_patient_id ON public.workflow_instances(patient_id);
CREATE INDEX IF NOT EXISTS idx_workflow_tasks_workflow_instance_id ON public.workflow_tasks(workflow_instance_id);
CREATE INDEX IF NOT EXISTS idx_discharge_summaries_patient_id ON public.discharge_summaries(patient_id);

-- ============================================================================
-- SAMPLE DATA
-- ============================================================================

-- Insert sample insurance payers
INSERT INTO public.insurance_payers (payer_name, payer_id, payer_type, accepts_electronic_claims, is_active) VALUES
  ('Blue Cross Blue Shield', 'BCBS001', 'commercial', true, true),
  ('UnitedHealthcare', 'UHC001', 'commercial', true, true),
  ('Aetna', 'AETNA001', 'commercial', true, true),
  ('Medicare', 'MEDICARE001', 'medicare', true, true),
  ('Medicaid', 'MEDICAID001', 'medicaid', true, true)
ON CONFLICT (payer_id) DO NOTHING;

-- Insert sample provider
INSERT INTO public.providers (id, first_name, last_name, email, license_number, specialization) VALUES
  ('00000000-0000-0000-0000-000000000001', 'John', 'Smith', 'john.smith@example.com', 'MD12345', 'Psychiatry')
ON CONFLICT (id) DO NOTHING;

-- Insert sample staff
INSERT INTO public.staff (first_name, last_name, email, role) VALUES
  ('Jane', 'Doe', 'jane.doe@example.com', 'nurse'),
  ('Bob', 'Johnson', 'bob.johnson@example.com', 'counselor')
ON CONFLICT (email) DO NOTHING;

-- Insert sample pharmacies
INSERT INTO public.pharmacies (name, address, city, state, zip_code, phone, accepts_e_prescribing, is_active) VALUES
  ('CVS Pharmacy', '123 Main St', 'Springfield', 'IL', '62701', '(555) 123-4567', true, true),
  ('Walgreens', '456 Oak Ave', 'Springfield', 'IL', '62702', '(555) 234-5678', true, true)
ON CONFLICT DO NOTHING;

-- Insert sample clearinghouse
INSERT INTO public.clearinghouse_connections (
    clearinghouse_name, clearinghouse_id, connection_type,
    submitter_id, receiver_id, is_active, is_production, connection_status
) VALUES (
    'Change Healthcare', 'CHC001', 'api',
    'MASE001', 'CHC', true, false, 'connected'
) ON CONFLICT (clearinghouse_id) DO NOTHING;

-- Insert sample workflow templates
INSERT INTO public.workflow_templates (name, description, category, estimated_duration_minutes, priority) VALUES
  ('Patient Admission', 'Complete admission process for new patients', 'admission', 60, 'high'),
  ('Patient Discharge', 'Complete discharge process and follow-up planning', 'discharge', 45, 'high')
ON CONFLICT DO NOTHING;
