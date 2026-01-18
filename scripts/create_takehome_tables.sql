-- Adding take-home methadone database schema
CREATE TABLE TakehomeOrder (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES Patient(id),
    days INTEGER NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    prescriber_id INTEGER NOT NULL,
    risk_level VARCHAR(20) DEFAULT 'standard',
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'closed')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE TakehomeKit (
    id SERIAL PRIMARY KEY,
    takehome_order_id INTEGER NOT NULL REFERENCES TakehomeOrder(id),
    issue_time TIMESTAMP NOT NULL,
    issued_by INTEGER NOT NULL,
    seal_batch VARCHAR(50),
    status VARCHAR(20) DEFAULT 'issued' CHECK (status IN ('issued', 'partial_return', 'full_return', 'lost')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE TakehomeDose (
    id SERIAL PRIMARY KEY,
    kit_id INTEGER NOT NULL REFERENCES TakehomeKit(id),
    day_date DATE NOT NULL,
    dose_mg DECIMAL(5,2) NOT NULL,
    dose_ml DECIMAL(5,2) NOT NULL,
    bottle_uid VARCHAR(50) UNIQUE NOT NULL,
    label_text TEXT,
    seal_uid VARCHAR(50),
    status VARCHAR(20) DEFAULT 'sealed' CHECK (status IN ('sealed', 'returned', 'waived')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ReturnInspection (
    id SERIAL PRIMARY KEY,
    bottle_uid VARCHAR(50) NOT NULL REFERENCES TakehomeDose(bottle_uid),
    returned_time TIMESTAMP NOT NULL,
    inspector_id INTEGER NOT NULL,
    seal_intact BOOLEAN NOT NULL,
    residue_ml_est DECIMAL(4,2),
    notes TEXT,
    photo_url VARCHAR(255),
    outcome VARCHAR(30) DEFAULT 'ok' CHECK (outcome IN ('ok', 'concern', 'diversion_suspected')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ComplianceHold (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES Patient(id),
    reason_code VARCHAR(50) NOT NULL,
    opened_by INTEGER NOT NULL,
    opened_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    requires_counselor BOOLEAN DEFAULT true,
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'cleared')),
    cleared_by INTEGER,
    cleared_time TIMESTAMP,
    clearance_note_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE CounselorEncounter (
    id SERIAL PRIMARY KEY,
    patient_id INTEGER NOT NULL REFERENCES Patient(id),
    time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    counselor_id INTEGER NOT NULL,
    summary TEXT NOT NULL,
    disposition VARCHAR(30) NOT NULL CHECK (disposition IN ('clear_hold', 'maintain_hold', 'escalate')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE TakehomeRules (
    id SERIAL PRIMARY KEY,
    rule_name VARCHAR(100) NOT NULL,
    rule_value VARCHAR(100) NOT NULL,
    risk_level VARCHAR(20) DEFAULT 'standard',
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for performance
CREATE INDEX idx_takehome_order_patient ON TakehomeOrder(patient_id);
CREATE INDEX idx_takehome_kit_order ON TakehomeKit(takehome_order_id);
CREATE INDEX idx_takehome_dose_kit ON TakehomeDose(kit_id);
CREATE INDEX idx_compliance_hold_patient ON ComplianceHold(patient_id);
CREATE INDEX idx_counselor_encounter_patient ON CounselorEncounter(patient_id);
