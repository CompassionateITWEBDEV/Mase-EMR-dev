CREATE TABLE IF NOT EXISTS dme_integration_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name VARCHAR(100) NOT NULL, -- 'parachute_health' or 'verse_medical'
  api_endpoint TEXT,
  api_key_encrypted TEXT,
  organization_id UUID REFERENCES organizations(id),
  connection_status VARCHAR(50) DEFAULT 'disconnected',
  last_sync_at TIMESTAMPTZ,
  is_active BOOLEAN DEFAULT true,
  configuration JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Adding API configuration storage for Settings page
CREATE TABLE IF NOT EXISTS dme_integration_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    integration_name TEXT NOT NULL, -- 'parachute_health' or 'verse_medical'
    api_key TEXT,
    api_secret TEXT,
    webhook_url TEXT,
    is_active BOOLEAN DEFAULT true,
    configuration JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, integration_name)
);

CREATE INDEX IF NOT EXISTS idx_dme_integration_config_org ON dme_integration_config(organization_id);

-- Parachute Health integration for ePrescribing
CREATE TABLE IF NOT EXISTS parachute_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dme_order_id UUID REFERENCES dme_orders(id),
  patient_id UUID REFERENCES patients(id),
  provider_id UUID REFERENCES providers(id),
  
  -- Parachute specific fields
  parachute_order_id VARCHAR(100) UNIQUE,
  supplier_id VARCHAR(100),
  supplier_name VARCHAR(255),
  order_status VARCHAR(50) DEFAULT 'draft', -- draft, submitted, in_progress, delivered, cancelled
  
  -- ePrescribing details
  product_search_query TEXT,
  selected_products JSONB, -- array of products with HCPCS codes
  clinical_documentation JSONB,
  delivery_address JSONB,
  
  -- Tracking
  submitted_to_parachute_at TIMESTAMPTZ,
  supplier_accepted_at TIMESTAMPTZ,
  estimated_delivery_date DATE,
  actual_delivery_date DATE,
  tracking_number VARCHAR(100),
  
  -- Communication
  digital_chat_messages JSONB DEFAULT '[]',
  supplier_notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Verse Medical integration for AI-powered ordering
CREATE TABLE IF NOT EXISTS verse_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dme_order_id UUID REFERENCES dme_orders(id),
  patient_id UUID REFERENCES patients(id),
  provider_id UUID REFERENCES providers(id),
  
  -- Verse specific fields
  verse_order_id VARCHAR(100) UNIQUE,
  order_status VARCHAR(50) DEFAULT 'pending', -- pending, processing, verified, submitted, delivered
  
  -- AI Extraction features
  medical_record_extracted JSONB, -- AI-extracted diagnosis & supply orders
  coverage_validation_result JSONB,
  medical_necessity_validated BOOLEAN DEFAULT false,
  
  -- Insurance & Coverage
  insurance_coverage_checked BOOLEAN DEFAULT false,
  prior_auth_required BOOLEAN DEFAULT false,
  prior_auth_status VARCHAR(50),
  estimated_patient_cost NUMERIC(10,2),
  
  -- Verse processing
  ai_processing_started_at TIMESTAMPTZ,
  ai_processing_completed_at TIMESTAMPTZ,
  documentation_complete BOOLEAN DEFAULT false,
  
  -- Patient communication
  patient_sms_notifications JSONB DEFAULT '[]',
  patient_tracking_enabled BOOLEAN DEFAULT true,
  
  -- Delivery
  delivery_date DATE,
  delivery_status VARCHAR(50),
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Integration sync log
CREATE TABLE IF NOT EXISTS dme_integration_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_name VARCHAR(100) NOT NULL,
  sync_type VARCHAR(50) NOT NULL, -- 'order_status', 'supplier_catalog', 'delivery_update'
  order_id UUID,
  sync_status VARCHAR(50) DEFAULT 'success',
  error_message TEXT,
  request_data JSONB,
  response_data JSONB,
  synced_at TIMESTAMPTZ DEFAULT NOW()
);

-- DME Supplier catalog from Parachute
CREATE TABLE IF NOT EXISTS parachute_supplier_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id VARCHAR(100) NOT NULL,
  supplier_name VARCHAR(255) NOT NULL,
  product_id VARCHAR(100),
  product_name VARCHAR(255),
  hcpcs_code VARCHAR(20),
  category VARCHAR(100),
  description TEXT,
  requires_prior_auth BOOLEAN DEFAULT false,
  estimated_cost NUMERIC(10,2),
  in_stock BOOLEAN DEFAULT true,
  delivery_time_days INTEGER,
  last_updated_from_parachute TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_parachute_orders_patient ON parachute_orders(patient_id);
CREATE INDEX idx_parachute_orders_status ON parachute_orders(order_status);
CREATE INDEX idx_verse_orders_patient ON verse_orders(patient_id);
CREATE INDEX idx_verse_orders_status ON verse_orders(order_status);
CREATE INDEX idx_parachute_catalog_hcpcs ON parachute_supplier_catalog(hcpcs_code);
CREATE INDEX idx_dme_integration_provider ON dme_integration_providers(provider_name, organization_id);
