-- Create staff roles enum
CREATE TYPE staff_role AS ENUM (
  'intake',
  'counselor', 
  'doctor',
  'rn',
  'peer_recovery',
  'general_staff',
  'admin'
);

-- Create staff table
CREATE TABLE IF NOT EXISTS public.staff (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  employee_id TEXT UNIQUE NOT NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  role staff_role NOT NULL,
  department TEXT,
  license_number TEXT,
  license_type TEXT,
  license_expiry DATE,
  hire_date DATE NOT NULL DEFAULT CURRENT_DATE,
  is_active BOOLEAN DEFAULT TRUE,
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create staff permissions table for granular access control
CREATE TABLE IF NOT EXISTS public.staff_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES public.staff(id) ON DELETE CASCADE,
  permission_type TEXT NOT NULL, -- 'read', 'write', 'delete', 'admin'
  resource TEXT NOT NULL, -- 'patients', 'medications', 'assessments', etc.
  granted_by UUID REFERENCES public.staff(id),
  granted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT TRUE,
  UNIQUE(staff_id, permission_type, resource)
);

-- Create patient medications table (enhanced)
CREATE TABLE IF NOT EXISTS public.patient_medications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  medication_name TEXT NOT NULL,
  generic_name TEXT,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  route TEXT, -- oral, injection, etc.
  start_date DATE NOT NULL,
  end_date DATE,
  prescribed_by UUID REFERENCES public.staff(id),
  medication_type TEXT DEFAULT 'regular', -- 'regular', 'prn', 'controlled'
  ndc_number TEXT,
  pharmacy_name TEXT,
  pharmacy_phone TEXT,
  refills_remaining INTEGER DEFAULT 0,
  status TEXT DEFAULT 'active', -- 'active', 'discontinued', 'completed'
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create prescriptions table for e-prescribing
CREATE TABLE IF NOT EXISTS public.prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  prescribed_by UUID REFERENCES public.staff(id) ON DELETE RESTRICT,
  medication_name TEXT NOT NULL,
  generic_name TEXT,
  dosage TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  refills INTEGER DEFAULT 0,
  directions TEXT NOT NULL,
  pharmacy_name TEXT,
  pharmacy_address TEXT,
  pharmacy_phone TEXT,
  pharmacy_npi TEXT,
  prescription_number TEXT UNIQUE,
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'filled', 'cancelled'
  prescribed_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  sent_date TIMESTAMP WITH TIME ZONE,
  filled_date TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create staff activity log for audit trail
CREATE TABLE IF NOT EXISTS public.staff_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_activity_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for staff table
CREATE POLICY "staff_select_own_or_admin" ON public.staff
  FOR SELECT USING (
    auth.uid() = id OR 
    EXISTS (
      SELECT 1 FROM public.staff s 
      WHERE s.id = auth.uid() AND s.role = 'admin'
    )
  );

CREATE POLICY "staff_insert_admin_only" ON public.staff
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.staff s 
      WHERE s.id = auth.uid() AND s.role = 'admin'
    )
  );

CREATE POLICY "staff_update_own_or_admin" ON public.staff
  FOR UPDATE USING (
    auth.uid() = id OR 
    EXISTS (
      SELECT 1 FROM public.staff s 
      WHERE s.id = auth.uid() AND s.role = 'admin'
    )
  );

-- RLS Policies for staff permissions
CREATE POLICY "staff_permissions_select" ON public.staff_permissions
  FOR SELECT USING (
    staff_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.staff s 
      WHERE s.id = auth.uid() AND s.role = 'admin'
    )
  );

CREATE POLICY "staff_permissions_admin_only" ON public.staff_permissions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.staff s 
      WHERE s.id = auth.uid() AND s.role = 'admin'
    )
  );

-- RLS Policies for patient medications
CREATE POLICY "patient_medications_healthcare_staff" ON public.patient_medications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.staff s 
      WHERE s.id = auth.uid() AND s.is_active = true
    )
  );

CREATE POLICY "patient_medications_prescriber_insert" ON public.patient_medications
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.staff s 
      WHERE s.id = auth.uid() AND s.role IN ('doctor', 'rn') AND s.is_active = true
    )
  );

CREATE POLICY "patient_medications_prescriber_update" ON public.patient_medications
  FOR UPDATE USING (
    prescribed_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.staff s 
      WHERE s.id = auth.uid() AND s.role IN ('doctor', 'admin') AND s.is_active = true
    )
  );

-- RLS Policies for prescriptions
CREATE POLICY "prescriptions_healthcare_staff_select" ON public.prescriptions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.staff s 
      WHERE s.id = auth.uid() AND s.is_active = true
    )
  );

CREATE POLICY "prescriptions_doctor_only" ON public.prescriptions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.staff s 
      WHERE s.id = auth.uid() AND s.role = 'doctor' AND s.is_active = true
    )
  );

CREATE POLICY "prescriptions_prescriber_update" ON public.prescriptions
  FOR UPDATE USING (
    prescribed_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.staff s 
      WHERE s.id = auth.uid() AND s.role IN ('doctor', 'admin') AND s.is_active = true
    )
  );

-- RLS Policies for activity log
CREATE POLICY "staff_activity_log_own_or_admin" ON public.staff_activity_log
  FOR SELECT USING (
    staff_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.staff s 
      WHERE s.id = auth.uid() AND s.role = 'admin'
    )
  );

CREATE POLICY "staff_activity_log_insert_own" ON public.staff_activity_log
  FOR INSERT WITH CHECK (staff_id = auth.uid());

-- Create indexes for performance
CREATE INDEX idx_staff_role ON public.staff(role);
CREATE INDEX idx_staff_active ON public.staff(is_active);
CREATE INDEX idx_staff_permissions_staff_id ON public.staff_permissions(staff_id);
CREATE INDEX idx_patient_medications_patient_id ON public.patient_medications(patient_id);
CREATE INDEX idx_patient_medications_prescribed_by ON public.patient_medications(prescribed_by);
CREATE INDEX idx_prescriptions_patient_id ON public.prescriptions(patient_id);
CREATE INDEX idx_prescriptions_prescribed_by ON public.prescriptions(prescribed_by);
CREATE INDEX idx_staff_activity_log_staff_id ON public.staff_activity_log(staff_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON public.staff
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_patient_medications_updated_at BEFORE UPDATE ON public.patient_medications
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_prescriptions_updated_at BEFORE UPDATE ON public.prescriptions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
