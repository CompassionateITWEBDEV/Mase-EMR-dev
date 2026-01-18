-- Create methadone dispensing database schema
-- Version 1.0 - Initial schema creation

-- Medication table - stores drug information
CREATE TABLE IF NOT EXISTS medication (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    conc_mg_per_ml DECIMAL(10,2) NOT NULL,
    ndc VARCHAR(20) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- LotBatch table - tracks medication batches
CREATE TABLE IF NOT EXISTS lot_batch (
    id SERIAL PRIMARY KEY,
    lot VARCHAR(100) NOT NULL,
    manufacturer VARCHAR(255) NOT NULL,
    exp_date DATE NOT NULL,
    medication_id INTEGER REFERENCES medication(id) ON DELETE CASCADE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(lot, medication_id)
);

-- Bottle table - tracks individual bottles
CREATE TABLE IF NOT EXISTS bottle (
    id SERIAL PRIMARY KEY,
    lot_id INTEGER REFERENCES lot_batch(id) ON DELETE CASCADE,
    start_volume_ml DECIMAL(10,2) NOT NULL,
    current_volume_ml DECIMAL(10,2) NOT NULL,
    opened_at TIMESTAMP,
    status VARCHAR(20) CHECK (status IN ('active', 'reserved', 'closed')) DEFAULT 'reserved',
    serial_no VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- InventoryTxn table - tracks all inventory transactions
CREATE TABLE IF NOT EXISTS inventory_txn (
    id SERIAL PRIMARY KEY,
    bottle_id INTEGER REFERENCES bottle(id) ON DELETE CASCADE,
    type VARCHAR(20) CHECK (type IN ('dose', 'waste', 'receipt', 'adjustment', 'transfer')) NOT NULL,
    qty_ml DECIMAL(10,2) NOT NULL,
    reason TEXT,
    by_user VARCHAR(255) NOT NULL,
    at_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    dose_event_id INTEGER -- Will reference dose_event(id) after that table is created
);

-- Patient table - basic patient information
CREATE TABLE IF NOT EXISTS patient_dispensing (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    dob DATE NOT NULL,
    mrn VARCHAR(50) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Order table - prescription orders
CREATE TABLE IF NOT EXISTS medication_order (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patient_dispensing(id) ON DELETE CASCADE,
    daily_dose_mg DECIMAL(10,2) NOT NULL,
    max_takehome INTEGER DEFAULT 0,
    start_date DATE NOT NULL,
    stop_date DATE,
    prescriber_id VARCHAR(255) NOT NULL,
    status VARCHAR(20) CHECK (status IN ('active', 'inactive', 'discontinued')) DEFAULT 'active',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Device table - dispensing devices
CREATE TABLE IF NOT EXISTS device (
    id SERIAL PRIMARY KEY,
    type VARCHAR(50) CHECK (type IN ('MethaSpense')) NOT NULL,
    location VARCHAR(255) NOT NULL,
    com_port VARCHAR(20),
    firmware VARCHAR(50),
    status VARCHAR(20) CHECK (status IN ('online', 'offline', 'maintenance')) DEFAULT 'offline',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- DoseEvent table - actual dispensing events
CREATE TABLE IF NOT EXISTS dose_event (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER REFERENCES patient_dispensing(id) ON DELETE CASCADE,
    order_id INTEGER REFERENCES medication_order(id) ON DELETE CASCADE,
    requested_mg DECIMAL(10,2) NOT NULL,
    dispensed_mg DECIMAL(10,2) NOT NULL,
    dispensed_ml DECIMAL(10,2) NOT NULL,
    bottle_id INTEGER REFERENCES bottle(id) ON DELETE CASCADE,
    device_id INTEGER REFERENCES device(id) ON DELETE CASCADE,
    by_user VARCHAR(255) NOT NULL,
    time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    outcome VARCHAR(20) CHECK (outcome IN ('success', 'aborted', 'alarm')) NOT NULL,
    signature_hash VARCHAR(255),
    notes TEXT
);

-- DeviceEvent table - device-specific events
CREATE TABLE IF NOT EXISTS device_event (
    id SERIAL PRIMARY KEY,
    device_id INTEGER REFERENCES device(id) ON DELETE CASCADE,
    event_type VARCHAR(50) CHECK (event_type IN ('bubble_detected', 'bottle_change', 'alarm', 'maintenance', 'calibration')) NOT NULL,
    payload JSONB,
    at_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,
    resolved_by VARCHAR(255)
);

-- ShiftCount table - shift reconciliation
CREATE TABLE IF NOT EXISTS shift_count (
    id SERIAL PRIMARY KEY,
    date DATE NOT NULL,
    shift VARCHAR(20) CHECK (shift IN ('day', 'evening', 'night')) NOT NULL,
    opening_ml DECIMAL(10,2) NOT NULL,
    closing_ml DECIMAL(10,2) NOT NULL,
    computed_use_ml DECIMAL(10,2) NOT NULL,
    physical_count_ml DECIMAL(10,2) NOT NULL,
    variance_ml DECIMAL(10,2) GENERATED ALWAYS AS (physical_count_ml - computed_use_ml) STORED,
    by_user VARCHAR(255) NOT NULL,
    verified_by VARCHAR(255),
    verified_at TIMESTAMP,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(date, shift)
);

-- Add foreign key constraint for dose_event_id in inventory_txn
ALTER TABLE inventory_txn 
ADD CONSTRAINT fk_inventory_txn_dose_event 
FOREIGN KEY (dose_event_id) REFERENCES dose_event(id) ON DELETE SET NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_bottle_status ON bottle(status);
CREATE INDEX IF NOT EXISTS idx_bottle_lot_id ON bottle(lot_id);
CREATE INDEX IF NOT EXISTS idx_inventory_txn_bottle_id ON inventory_txn(bottle_id);
CREATE INDEX IF NOT EXISTS idx_inventory_txn_type ON inventory_txn(type);
CREATE INDEX IF NOT EXISTS idx_dose_event_patient_id ON dose_event(patient_id);
CREATE INDEX IF NOT EXISTS idx_dose_event_time ON dose_event(time);
CREATE INDEX IF NOT EXISTS idx_device_event_device_id ON device_event(device_id);
CREATE INDEX IF NOT EXISTS idx_shift_count_date ON shift_count(date);
