-- DEA Form 222 tables for controlled substance ordering
CREATE TABLE IF NOT EXISTS dea_form_222 (
  id SERIAL PRIMARY KEY,
  form_number VARCHAR(50) UNIQUE NOT NULL,
  supplier_name VARCHAR(255) NOT NULL,
  supplier_address TEXT NOT NULL,
  supplier_dea_number VARCHAR(20) NOT NULL,
  registrant_name VARCHAR(255) NOT NULL,
  registrant_dea_number VARCHAR(20) NOT NULL,
  signed_by_user_id INTEGER NOT NULL,
  signed_at TIMESTAMP NOT NULL,
  execution_date DATE NOT NULL,
  expires_at TIMESTAMP NOT NULL, -- 60 days from execution
  status VARCHAR(20) DEFAULT 'executed' CHECK (status IN ('executed', 'voided', 'expired', 'completed')),
  void_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS dea_form_222_line (
  id SERIAL PRIMARY KEY,
  form_222_id INTEGER REFERENCES dea_form_222(id),
  line_number INTEGER NOT NULL,
  medication_id INTEGER REFERENCES medication(id),
  quantity_ordered DECIMAL(10,3) NOT NULL,
  unit VARCHAR(10) NOT NULL,
  containers_shipped INTEGER DEFAULT 0,
  containers_received INTEGER DEFAULT 0,
  date_shipped DATE,
  date_received DATE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'partial', 'complete', 'expired')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(form_222_id, line_number)
);

CREATE TABLE IF NOT EXISTS dea_poa (
  id SERIAL PRIMARY KEY,
  registrant_dea_number VARCHAR(20) NOT NULL,
  authorized_user_id INTEGER NOT NULL,
  authorized_name VARCHAR(255) NOT NULL,
  poa_document_url TEXT NOT NULL,
  effective_date DATE NOT NULL,
  expiration_date DATE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'revoked', 'expired')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_form_222_expires_at ON dea_form_222(expires_at);
CREATE INDEX IF NOT EXISTS idx_form_222_status ON dea_form_222(status);
CREATE INDEX IF NOT EXISTS idx_form_222_line_status ON dea_form_222_line(status);
CREATE INDEX IF NOT EXISTS idx_poa_user_status ON dea_poa(authorized_user_id, status);
