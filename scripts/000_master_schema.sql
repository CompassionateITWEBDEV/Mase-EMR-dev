-- MASE Behavioral Health EMR - Master Database Schema
-- This script creates all tables in the correct order to handle dependencies
-- Run this script first before any other scripts

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- CORE TABLES (No dependencies)
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
  role TEXT NOT NULL, -- admin, nurse, counselor, case_manager, etc.
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
  payer_type VARCHAR(50), -- commercial, medicare, medicaid, etc.
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

-- Patient insurance table
CREATE TABLE IF NOT EXISTS public.patient_insurance (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID NOT NULL REFERENCES public.patients(id) ON DELETE CASCADE,
  payer_id UUID REFERENCES public.insurance_payers(id),
  policy_number VARCHAR(100) NOT NULL,
  group_number VARCHAR(100),
  subscriber_name VARCHAR(255),
  subscriber_relationship VARCHAR(50), -- self, spouse, child, other
  subscriber_dob DATE,
  effective_date DATE,
  termination_date DATE,
  is_primary BOOLEAN DEFAULT true,
  copay_amount DECIMAL(10,2),
  deductible_amount DECIMAL(10,2),
  out_of_pocket_max DECIMAL(10,2),
  coverage_level VARCHAR(50), -- individual, family
  status VARCHAR(20) DEFAULT 'active', -- active, inactive, pending
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- CLINICAL TABLES (Depend on patients and providers)
-- ============================================================================

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
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================

ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_payers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_insurance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_claims ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS POLICIES (Allow all for now since auth is disabled)
-- ============================================================================

-- Providers policies
DROP POLICY IF EXISTS "Allow all access to providers" ON public.providers;
CREATE POLICY "Allow all access to providers" ON public.providers FOR ALL USING (true) WITH CHECK (true);

-- Staff policies
DROP POLICY IF EXISTS "Allow all access to staff" ON public.staff;
CREATE POLICY "Allow all access to staff" ON public.staff FOR ALL USING (true) WITH CHECK (true);

-- Patients policies
DROP POLICY IF EXISTS "Allow all access to patients" ON public.patients;
CREATE POLICY "Allow all access to patients" ON public.patients FOR ALL USING (true) WITH CHECK (true);

-- Insurance payers policies
DROP POLICY IF EXISTS "Allow all access to insurance_payers" ON public.insurance_payers;
CREATE POLICY "Allow all access to insurance_payers" ON public.insurance_payers FOR ALL USING (true) WITH CHECK (true);

-- Patient insurance policies
DROP POLICY IF EXISTS "Allow all access to patient_insurance" ON public.patient_insurance;
CREATE POLICY "Allow all access to patient_insurance" ON public.patient_insurance FOR ALL USING (true) WITH CHECK (true);

-- Appointments policies
DROP POLICY IF EXISTS "Allow all access to appointments" ON public.appointments;
CREATE POLICY "Allow all access to appointments" ON public.appointments FOR ALL USING (true) WITH CHECK (true);

-- Insurance claims policies
DROP POLICY IF EXISTS "Allow all access to insurance_claims" ON public.insurance_claims;
CREATE POLICY "Allow all access to insurance_claims" ON public.insurance_claims FOR ALL USING (true) WITH CHECK (true);

-- ============================================================================
-- INDEXES
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_patients_created_by ON public.patients(created_by);
CREATE INDEX IF NOT EXISTS idx_patient_insurance_patient_id ON public.patient_insurance(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_insurance_payer_id ON public.patient_insurance(payer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON public.appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_provider_id ON public.appointments(provider_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON public.appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_patient_id ON public.insurance_claims(patient_id);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_payer_id ON public.insurance_claims(payer_id);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_status ON public.insurance_claims(claim_status);

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
