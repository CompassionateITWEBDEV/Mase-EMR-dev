-- Core EMR Database Schema for Behavioral Health
-- This script creates the foundational tables for the EMR system

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Providers/Clinicians table
CREATE TABLE IF NOT EXISTS public.providers (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
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

-- Appointments table
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES public.providers(id) ON DELETE CASCADE,
  appointment_date TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  appointment_type TEXT NOT NULL, -- 'initial', 'follow-up', 'therapy', 'medication-management'
  status TEXT DEFAULT 'scheduled', -- 'scheduled', 'completed', 'cancelled', 'no-show'
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clinical assessments table
CREATE TABLE IF NOT EXISTS public.assessments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES public.providers(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id),
  assessment_type TEXT NOT NULL, -- 'initial', 'progress', 'discharge'
  chief_complaint TEXT,
  history_present_illness TEXT,
  mental_status_exam JSONB,
  risk_assessment JSONB,
  diagnosis_codes TEXT[], -- ICD-10 codes
  treatment_plan TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Progress notes table
CREATE TABLE IF NOT EXISTS public.progress_notes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES public.providers(id) ON DELETE CASCADE,
  appointment_id UUID REFERENCES public.appointments(id),
  note_type TEXT NOT NULL, -- 'therapy', 'medication', 'crisis', 'discharge'
  subjective TEXT,
  objective TEXT,
  assessment TEXT,
  plan TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Medications table
CREATE TABLE IF NOT EXISTS public.medications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES public.providers(id) ON DELETE CASCADE,
  medication_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE,
  status TEXT DEFAULT 'active', -- 'active', 'discontinued', 'completed'
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Treatment plans table
CREATE TABLE IF NOT EXISTS public.treatment_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  provider_id UUID REFERENCES public.providers(id) ON DELETE CASCADE,
  goals JSONB NOT NULL, -- Array of treatment goals
  interventions JSONB NOT NULL, -- Array of planned interventions
  target_date DATE,
  status TEXT DEFAULT 'active', -- 'active', 'completed', 'revised'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security on all tables
ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progress_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.treatment_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies for providers table
CREATE POLICY "Providers can view their own profile" ON public.providers
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Providers can update their own profile" ON public.providers
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Providers can insert their own profile" ON public.providers
  FOR INSERT WITH CHECK (auth.uid() = id);

-- RLS Policies for patients table (providers can access all patients)
CREATE POLICY "Providers can view all patients" ON public.patients
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.providers WHERE providers.id = auth.uid())
  );

CREATE POLICY "Providers can insert patients" ON public.patients
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.providers WHERE providers.id = auth.uid())
  );

CREATE POLICY "Providers can update patients" ON public.patients
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.providers WHERE providers.id = auth.uid())
  );

-- RLS Policies for appointments table
CREATE POLICY "Providers can view appointments" ON public.appointments
  FOR SELECT USING (
    provider_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.providers WHERE providers.id = auth.uid())
  );

CREATE POLICY "Providers can insert appointments" ON public.appointments
  FOR INSERT WITH CHECK (
    provider_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.providers WHERE providers.id = auth.uid())
  );

CREATE POLICY "Providers can update appointments" ON public.appointments
  FOR UPDATE USING (
    provider_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.providers WHERE providers.id = auth.uid())
  );

-- RLS Policies for assessments table
CREATE POLICY "Providers can view assessments" ON public.assessments
  FOR SELECT USING (
    provider_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.providers WHERE providers.id = auth.uid())
  );

CREATE POLICY "Providers can insert assessments" ON public.assessments
  FOR INSERT WITH CHECK (
    provider_id = auth.uid()
  );

CREATE POLICY "Providers can update assessments" ON public.assessments
  FOR UPDATE USING (
    provider_id = auth.uid()
  );

-- RLS Policies for progress_notes table
CREATE POLICY "Providers can view progress notes" ON public.progress_notes
  FOR SELECT USING (
    provider_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.providers WHERE providers.id = auth.uid())
  );

CREATE POLICY "Providers can insert progress notes" ON public.progress_notes
  FOR INSERT WITH CHECK (
    provider_id = auth.uid()
  );

CREATE POLICY "Providers can update progress notes" ON public.progress_notes
  FOR UPDATE USING (
    provider_id = auth.uid()
  );

-- RLS Policies for medications table
CREATE POLICY "Providers can view medications" ON public.medications
  FOR SELECT USING (
    provider_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.providers WHERE providers.id = auth.uid())
  );

CREATE POLICY "Providers can insert medications" ON public.medications
  FOR INSERT WITH CHECK (
    provider_id = auth.uid()
  );

CREATE POLICY "Providers can update medications" ON public.medications
  FOR UPDATE USING (
    provider_id = auth.uid()
  );

-- RLS Policies for treatment_plans table
CREATE POLICY "Providers can view treatment plans" ON public.treatment_plans
  FOR SELECT USING (
    provider_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.providers WHERE providers.id = auth.uid())
  );

CREATE POLICY "Providers can insert treatment plans" ON public.treatment_plans
  FOR INSERT WITH CHECK (
    provider_id = auth.uid()
  );

CREATE POLICY "Providers can update treatment plans" ON public.treatment_plans
  FOR UPDATE USING (
    provider_id = auth.uid()
  );
