-- Add response columns to provider_referrals table
ALTER TABLE provider_referrals 
ADD COLUMN IF NOT EXISTS external_provider_response TEXT,
ADD COLUMN IF NOT EXISTS response_received_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS response_attachments JSONB,
ADD COLUMN IF NOT EXISTS imported_to_chart BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS chart_note_id UUID REFERENCES progress_notes(id),
ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES providers(id),
ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS review_status VARCHAR(50) DEFAULT 'pending' CHECK (review_status IN ('pending', 'approved', 'rejected', 'needs_revision'));

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_referrals_review_status ON provider_referrals(review_status) WHERE imported_to_chart = FALSE;
CREATE INDEX IF NOT EXISTS idx_referrals_response_received ON provider_referrals(response_received_at) WHERE response_received_at IS NOT NULL;

-- Add trigger to audit trail when responses are received
CREATE OR REPLACE FUNCTION log_referral_response()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.external_provider_response IS NOT NULL AND OLD.external_provider_response IS NULL THEN
    INSERT INTO audit_trail (
      action,
      table_name,
      record_id,
      patient_id,
      new_values,
      timestamp
    ) VALUES (
      'REFERRAL_RESPONSE_RECEIVED',
      'provider_referrals',
      NEW.id,
      NEW.patient_id,
      jsonb_build_object(
        'external_provider_id', NEW.external_provider_id,
        'response_length', LENGTH(NEW.external_provider_response),
        'response_received_at', NEW.response_received_at
      ),
      NOW()
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS referral_response_audit ON provider_referrals;
CREATE TRIGGER referral_response_audit
  AFTER UPDATE ON provider_referrals
  FOR EACH ROW
  EXECUTE FUNCTION log_referral_response();

COMMENT ON COLUMN provider_referrals.external_provider_response IS 'Clinical notes/feedback from the external provider';
COMMENT ON COLUMN provider_referrals.response_attachments IS 'JSON array of document URLs or metadata from external provider';
COMMENT ON COLUMN provider_referrals.imported_to_chart IS 'Whether response has been imported to patient chart';
COMMENT ON COLUMN provider_referrals.chart_note_id IS 'Reference to progress_notes entry created from this response';
COMMENT ON COLUMN provider_referrals.review_status IS 'Staff review status before importing to chart';
