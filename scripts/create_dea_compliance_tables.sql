-- Adding DEA compliance tables for controlled substance tracking
-- Schedule Class tracking for medications
ALTER TABLE Medication ADD COLUMN schedule_class VARCHAR(3) CHECK (schedule_class IN ('I', 'II', 'III', 'IV', 'V'));

-- Inventory Snapshots for DEA compliance
CREATE TABLE InventorySnapshot (
    id SERIAL PRIMARY KEY,
    snapshot_type VARCHAR(20) NOT NULL CHECK (snapshot_type IN ('initial', 'biennial', 'newly_scheduled', 'daily')),
    taken_at TIMESTAMP NOT NULL DEFAULT NOW(),
    opened_or_closed_of_business VARCHAR(10) CHECK (opened_or_closed_of_business IN ('opening', 'closing')),
    taken_by VARCHAR(100) NOT NULL,
    verified_by VARCHAR(100),
    note TEXT,
    locked BOOLEAN DEFAULT FALSE,
    registered_location VARCHAR(200) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE InventorySnapshotLine (
    id SERIAL PRIMARY KEY,
    snapshot_id INTEGER REFERENCES InventorySnapshot(id),
    medication_id INTEGER REFERENCES Medication(id),
    lot_id INTEGER REFERENCES LotBatch(id),
    bottle_id INTEGER REFERENCES Bottle(id),
    qty_ml DECIMAL(10,3),
    qty_units INTEGER,
    opened_container BOOLEAN DEFAULT FALSE,
    counting_method VARCHAR(10) CHECK (counting_method IN ('exact', 'estimate')),
    created_at TIMESTAMP DEFAULT NOW()
);

-- Acquisition Records for controlled substance receipts
CREATE TABLE AcquisitionRecord (
    id SERIAL PRIMARY KEY,
    supplier_name VARCHAR(200) NOT NULL,
    supplier_address TEXT NOT NULL,
    supplier_dea VARCHAR(20) NOT NULL,
    received_date DATE NOT NULL,
    medication_id INTEGER REFERENCES Medication(id),
    strength VARCHAR(50),
    dosage_form VARCHAR(50),
    quantity DECIMAL(10,3),
    form_222_id VARCHAR(50), -- Required for Schedule II
    form_222_attachment_url TEXT,
    csos_certificate_ref VARCHAR(100),
    registered_location VARCHAR(200) NOT NULL,
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Disposal Records for waste and destruction
CREATE TABLE DisposalRecord (
    id SERIAL PRIMARY KEY,
    disposal_type VARCHAR(20) CHECK (disposal_type IN ('waste', 'destruction')),
    reason TEXT NOT NULL,
    medication_id INTEGER REFERENCES Medication(id),
    quantity DECIMAL(10,3),
    witness_1 VARCHAR(100) NOT NULL,
    witness_2 VARCHAR(100) NOT NULL,
    dea_form_41_id VARCHAR(50),
    form_41_attachment_url TEXT,
    disposal_method TEXT,
    registered_location VARCHAR(200) NOT NULL,
    disposed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_by VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Dispensing Log for DEA compliance (extends existing DoseEvent)
CREATE TABLE DispensingLog (
    id SERIAL PRIMARY KEY,
    dose_event_id INTEGER REFERENCES DoseEvent(id),
    takehome_kit_id INTEGER, -- References TakehomeKit if applicable
    drug_name VARCHAR(100) NOT NULL,
    dosage_form VARCHAR(50),
    quantity_ml DECIMAL(10,3),
    quantity_units INTEGER,
    patient_mrn VARCHAR(50) NOT NULL,
    dispensed_at TIMESTAMP NOT NULL,
    staff_initials VARCHAR(10) NOT NULL,
    running_total_ml DECIMAL(10,3),
    registered_location VARCHAR(200) NOT NULL,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Compliance Holds enhancement
ALTER TABLE ComplianceHold ADD COLUMN dea_related BOOLEAN DEFAULT FALSE;
ALTER TABLE ComplianceHold ADD COLUMN requires_dual_signature BOOLEAN DEFAULT FALSE;

-- Indexes for performance and DEA retrieval requirements
CREATE INDEX idx_inventory_snapshot_type_date ON InventorySnapshot(snapshot_type, taken_at);
CREATE INDEX idx_acquisition_schedule ON AcquisitionRecord(medication_id, received_date);
CREATE INDEX idx_disposal_type_date ON DisposalRecord(disposal_type, disposed_at);
CREATE INDEX idx_dispensing_log_date ON DispensingLog(dispensed_at);
CREATE INDEX idx_medication_schedule ON Medication(schedule_class);
