-- Create medication order requests table for nurse-physician workflow
CREATE TABLE IF NOT EXISTS medication_order_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES patients(id),
  order_type VARCHAR(50) NOT NULL, -- 'increase', 'decrease', 'hold', 'taper', 'split'
  current_dose_mg NUMERIC,
  requested_dose_mg NUMERIC,
  clinical_justification TEXT NOT NULL,
  physician_id VARCHAR(255) NOT NULL,
  nurse_id VARCHAR(255) NOT NULL,
  nurse_signature TEXT,
  physician_signature TEXT,
  status VARCHAR(50) DEFAULT 'pending_physician_review', -- 'draft', 'pending_physician_review', 'approved', 'denied'
  physician_review_notes TEXT,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_order_requests_status ON medication_order_requests(status);
CREATE INDEX idx_order_requests_physician ON medication_order_requests(physician_id);
CREATE INDEX idx_order_requests_patient ON medication_order_requests(patient_id);
