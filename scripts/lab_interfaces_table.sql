-- =====================================================
-- LAB INTERFACES CONFIGURATION TABLE
-- For managing connections to laboratory information systems
-- =====================================================

CREATE TABLE IF NOT EXISTS lab_interfaces (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  lab_name VARCHAR(255) NOT NULL,
  lab_code VARCHAR(50) NOT NULL,
  lab_npi VARCHAR(20),
  connection_type VARCHAR(50) NOT NULL DEFAULT 'hl7', -- hl7, hl7_fhir, rest_api, sftp, direct
  
  -- HL7 Configuration
  hl7_endpoint TEXT,
  hl7_port INTEGER,
  hl7_sending_facility VARCHAR(100),
  hl7_receiving_facility VARCHAR(100),
  hl7_version VARCHAR(20) DEFAULT '2.5.1',
  
  -- API Configuration
  api_endpoint TEXT,
  api_key TEXT,
  api_secret TEXT,
  
  -- Authentication
  username VARCHAR(255),
  password TEXT,
  certificate_path TEXT,
  
  -- Connection Status
  is_active BOOLEAN DEFAULT TRUE,
  connection_status VARCHAR(50) DEFAULT 'pending', -- pending, connected, failed, disconnected
  last_connection_test TIMESTAMPTZ,
  last_successful_connection TIMESTAMPTZ,
  error_message TEXT,
  
  -- Capabilities
  supports_orders BOOLEAN DEFAULT TRUE,
  supports_results BOOLEAN DEFAULT TRUE,
  supports_oru BOOLEAN DEFAULT TRUE,
  supports_orm BOOLEAN DEFAULT TRUE,
  supports_ack BOOLEAN DEFAULT TRUE,
  
  -- Settings
  auto_send_orders BOOLEAN DEFAULT FALSE,
  auto_receive_results BOOLEAN DEFAULT TRUE,
  result_notification_email TEXT,
  retry_attempts INTEGER DEFAULT 3,
  retry_interval_minutes INTEGER DEFAULT 15,
  timeout_seconds INTEGER DEFAULT 30,
  
  -- Metadata
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID,
  
  UNIQUE(organization_id, lab_code)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_lab_interfaces_org ON lab_interfaces(organization_id);
CREATE INDEX IF NOT EXISTS idx_lab_interfaces_active ON lab_interfaces(is_active);
CREATE INDEX IF NOT EXISTS idx_lab_interfaces_status ON lab_interfaces(connection_status);

-- Enable RLS
ALTER TABLE lab_interfaces ENABLE ROW LEVEL SECURITY;

-- Lab Interface Transaction Log
CREATE TABLE IF NOT EXISTS lab_interface_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lab_interface_id UUID NOT NULL REFERENCES lab_interfaces(id),
  transaction_type VARCHAR(50) NOT NULL, -- order_sent, result_received, ack_sent, error
  direction VARCHAR(20) NOT NULL, -- inbound, outbound
  message_id VARCHAR(100),
  message_type VARCHAR(20), -- ORM, ORU, ACK
  patient_id UUID,
  order_id UUID,
  result_id UUID,
  raw_message TEXT,
  parsed_data JSONB,
  status VARCHAR(50) NOT NULL, -- success, failed, pending
  error_message TEXT,
  processing_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_lab_interface_txn_interface ON lab_interface_transactions(lab_interface_id);
CREATE INDEX IF NOT EXISTS idx_lab_interface_txn_type ON lab_interface_transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_lab_interface_txn_patient ON lab_interface_transactions(patient_id);
CREATE INDEX IF NOT EXISTS idx_lab_interface_txn_date ON lab_interface_transactions(created_at);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'LAB INTERFACES TABLE CREATED';
  RAISE NOTICE '=====================================================';
  RAISE NOTICE 'Tables Created:';
  RAISE NOTICE '  - lab_interfaces';
  RAISE NOTICE '  - lab_interface_transactions';
  RAISE NOTICE '=====================================================';
END $$;
