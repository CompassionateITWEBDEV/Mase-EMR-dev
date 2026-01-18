-- Patient Credits System
-- Tracks credits (cash advances, referral incentives) that can be applied toward payments

CREATE TABLE IF NOT EXISTS patient_credits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID NOT NULL REFERENCES patients(id),
  credit_amount NUMERIC(10, 2) NOT NULL,
  credit_type VARCHAR(50) NOT NULL, -- 'cash_advance', 'referral_incentive', 'payment_plan_adjustment', 'scholarship', 'other'
  credit_reason TEXT,
  applied_by UUID REFERENCES staff(id),
  applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'active', -- 'active', 'used', 'expired', 'voided'
  used_amount NUMERIC(10, 2) DEFAULT 0.00,
  remaining_amount NUMERIC(10, 2) NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Track credit usage history
CREATE TABLE IF NOT EXISTS patient_credit_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  credit_id UUID NOT NULL REFERENCES patient_credits(id),
  patient_id UUID NOT NULL REFERENCES patients(id),
  payment_id UUID, -- Links to patient_payments if applied toward a payment
  amount_used NUMERIC(10, 2) NOT NULL,
  used_by UUID REFERENCES staff(id),
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  transaction_type VARCHAR(50), -- 'payment_applied', 'voided', 'refunded'
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to get total available credits for a patient
CREATE OR REPLACE FUNCTION get_patient_available_credits(p_patient_id UUID)
RETURNS NUMERIC AS $$
  SELECT COALESCE(SUM(remaining_amount), 0)
  FROM patient_credits
  WHERE patient_id = p_patient_id
    AND status = 'active'
    AND (expires_at IS NULL OR expires_at > NOW());
$$ LANGUAGE SQL STABLE;

-- Function to apply credit toward payment
CREATE OR REPLACE FUNCTION apply_credit_to_payment(
  p_patient_id UUID,
  p_payment_amount NUMERIC,
  p_payment_id UUID DEFAULT NULL
)
RETURNS TABLE (
  credits_used NUMERIC,
  remaining_payment NUMERIC
) AS $$
DECLARE
  v_available_credits NUMERIC;
  v_credit_to_use NUMERIC;
  v_credit_record RECORD;
BEGIN
  -- Get total available credits
  v_available_credits := get_patient_available_credits(p_patient_id);
  
  -- Determine how much credit to use
  v_credit_to_use := LEAST(v_available_credits, p_payment_amount);
  
  -- If no credits available, return early
  IF v_credit_to_use <= 0 THEN
    RETURN QUERY SELECT 0::NUMERIC, p_payment_amount;
    RETURN;
  END IF;
  
  -- Apply credits (oldest first)
  FOR v_credit_record IN
    SELECT * FROM patient_credits
    WHERE patient_id = p_patient_id
      AND status = 'active'
      AND remaining_amount > 0
      AND (expires_at IS NULL OR expires_at > NOW())
    ORDER BY created_at ASC
  LOOP
    DECLARE
      v_amount_to_use NUMERIC;
    BEGIN
      -- Use as much as possible from this credit
      v_amount_to_use := LEAST(v_credit_record.remaining_amount, v_credit_to_use);
      
      -- Update credit record
      UPDATE patient_credits
      SET 
        used_amount = used_amount + v_amount_to_use,
        remaining_amount = remaining_amount - v_amount_to_use,
        status = CASE 
          WHEN remaining_amount - v_amount_to_use <= 0 THEN 'used'
          ELSE 'active'
        END,
        updated_at = NOW()
      WHERE id = v_credit_record.id;
      
      -- Record usage
      INSERT INTO patient_credit_usage (
        credit_id, patient_id, payment_id, amount_used, transaction_type
      ) VALUES (
        v_credit_record.id, p_patient_id, p_payment_id, v_amount_to_use, 'payment_applied'
      );
      
      -- Reduce remaining amount to apply
      v_credit_to_use := v_credit_to_use - v_amount_to_use;
      
      -- Exit if we've used enough credits
      EXIT WHEN v_credit_to_use <= 0;
    END;
  END LOOP;
  
  -- Return results
  RETURN QUERY SELECT 
    v_available_credits - v_credit_to_use AS credits_used,
    p_payment_amount - (v_available_credits - v_credit_to_use) AS remaining_payment;
END;
$$ LANGUAGE plpgsql;

-- Create indexes
CREATE INDEX idx_patient_credits_patient ON patient_credits(patient_id);
CREATE INDEX idx_patient_credits_status ON patient_credits(status);
CREATE INDEX idx_patient_credit_usage_patient ON patient_credit_usage(patient_id);
CREATE INDEX idx_patient_credit_usage_credit ON patient_credit_usage(credit_id);

-- Add RLS policies
ALTER TABLE patient_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE patient_credit_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff can manage patient credits" ON patient_credits
  FOR ALL USING (true);

CREATE POLICY "Staff can view credit usage" ON patient_credit_usage
  FOR SELECT USING (true);
