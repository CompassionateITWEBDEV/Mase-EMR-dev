-- Discharge Summaries Table
-- This script creates the discharge_summaries table for comprehensive discharge documentation

CREATE TABLE IF NOT EXISTS public.discharge_summaries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
  provider_id UUID REFERENCES public.providers(id) ON DELETE CASCADE NOT NULL,
  
  -- Admission Information
  admission_date DATE NOT NULL,
  discharge_date DATE NOT NULL,
  length_of_stay INTEGER GENERATED ALWAYS AS (discharge_date - admission_date) STORED,
  admission_diagnosis TEXT NOT NULL,
  reason_for_admission TEXT NOT NULL,
  
  -- Treatment Summary
  treatment_summary TEXT NOT NULL,
  medications_at_admission JSONB,
  medications_at_discharge JSONB,
  procedures_performed JSONB,
  therapies_provided JSONB,
  
  -- Clinical Progress
  clinical_course TEXT NOT NULL,
  response_to_treatment TEXT,
  complications TEXT,
  
  -- Final Assessment
  discharge_diagnosis TEXT NOT NULL,
  diagnosis_codes TEXT[], -- ICD-10 codes
  final_mental_status_exam JSONB,
  final_risk_assessment JSONB,
  functional_status TEXT,
  
  -- Discharge Planning
  discharge_disposition TEXT NOT NULL, -- 'home', 'residential', 'hospital', 'against-medical-advice'
  discharge_condition TEXT NOT NULL, -- 'improved', 'stable', 'unchanged', 'declined'
  follow_up_appointments JSONB,
  follow_up_provider TEXT,
  follow_up_date DATE,
  
  -- Recommendations and Instructions
  discharge_instructions TEXT NOT NULL,
  medication_instructions TEXT,
  activity_restrictions TEXT,
  diet_recommendations TEXT,
  warning_signs TEXT,
  emergency_contact_info TEXT,
  
  -- Aftercare Plan
  aftercare_plan TEXT NOT NULL,
  referrals JSONB,
  community_resources JSONB,
  support_system_notes TEXT,
  
  -- Additional Information
  patient_education_provided TEXT,
  family_involvement TEXT,
  barriers_to_discharge TEXT,
  special_considerations TEXT,
  
  -- Signatures and Status
  status TEXT DEFAULT 'draft', -- 'draft', 'pending-review', 'finalized'
  finalized_at TIMESTAMP WITH TIME ZONE,
  finalized_by UUID REFERENCES public.providers(id),
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.discharge_summaries ENABLE ROW LEVEL SECURITY;

-- RLS Policies for discharge_summaries table
CREATE POLICY "Providers can view discharge summaries" ON public.discharge_summaries
  FOR SELECT USING (
    provider_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM public.providers WHERE providers.id = auth.uid())
  );

CREATE POLICY "Providers can insert discharge summaries" ON public.discharge_summaries
  FOR INSERT WITH CHECK (
    provider_id = auth.uid()
  );

CREATE POLICY "Providers can update their own discharge summaries" ON public.discharge_summaries
  FOR UPDATE USING (
    provider_id = auth.uid() AND status != 'finalized'
  );

-- Create indexes for better query performance
CREATE INDEX idx_discharge_summaries_patient_id ON public.discharge_summaries(patient_id);
CREATE INDEX idx_discharge_summaries_provider_id ON public.discharge_summaries(provider_id);
CREATE INDEX idx_discharge_summaries_discharge_date ON public.discharge_summaries(discharge_date);
CREATE INDEX idx_discharge_summaries_status ON public.discharge_summaries(status);

-- Create a function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_discharge_summary_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_discharge_summaries_updated_at
  BEFORE UPDATE ON public.discharge_summaries
  FOR EACH ROW
  EXECUTE FUNCTION update_discharge_summary_updated_at();
