-- Create patient_payments table for cash collection and payment tracking
CREATE TABLE IF NOT EXISTS patient_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id),
  amount_paid NUMERIC(10, 2) NOT NULL,
  payment_method VARCHAR(50) NOT NULL, -- 'cash', 'credit_card', 'debit_card', 'check', 'money_order'
  payment_reference VARCHAR(255), -- Check number, last 4 of card, transaction ID
  payment_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  service_date DATE,
  service_type VARCHAR(100), -- 'dosing', 'counseling', 'medical', 'copay', etc.
  collected_by UUID REFERENCES staff(id),
  receipt_number VARCHAR(50) UNIQUE,
  status VARCHAR(50) DEFAULT 'completed', -- 'completed', 'pending', 'refunded', 'voided'
  notes TEXT,
  refund_reason TEXT,
  refunded_by UUID REFERENCES staff(id),
  refunded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add account_balance column to patients table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name='patients' AND column_name='account_balance') THEN
    ALTER TABLE patients ADD COLUMN account_balance NUMERIC(10, 2) DEFAULT 0.00;
  END IF;
END $$;

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_patient_payments_patient_id ON patient_payments(patient_id);
CREATE INDEX IF NOT EXISTS idx_patient_payments_payment_date ON patient_payments(payment_date DESC);
CREATE INDEX IF NOT EXISTS idx_patient_payments_collected_by ON patient_payments(collected_by);
CREATE INDEX IF NOT EXISTS idx_patient_payments_status ON patient_payments(status);

-- Enable RLS
ALTER TABLE patient_payments ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Staff can view all payments" ON patient_payments
  FOR SELECT USING (true);

CREATE POLICY "Staff can insert payments" ON patient_payments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Staff can update payments" ON patient_payments
  FOR UPDATE USING (true);

COMMENT ON TABLE patient_payments IS 'Tracks all patient payments including cash, credit, and debit transactions';
COMMENT ON COLUMN patient_payments.payment_method IS 'Payment type: cash, credit_card, debit_card, check, money_order';
COMMENT ON COLUMN patient_payments.amount_paid IS 'Amount paid by patient';
COMMENT ON COLUMN patient_payments.receipt_number IS 'Unique receipt number for the transaction';
