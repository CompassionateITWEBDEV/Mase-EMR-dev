-- Adding sample DEA compliance data
-- Update existing medications with schedule classifications
UPDATE Medication SET schedule_class = 'II' WHERE name LIKE '%Methadone%';
UPDATE Medication SET schedule_class = 'III' WHERE name LIKE '%Buprenorphine%';

-- Sample acquisition record
INSERT INTO AcquisitionRecord (
    supplier_name, supplier_address, supplier_dea, received_date,
    medication_id, strength, dosage_form, quantity,
    form_222_id, registered_location, created_by
) VALUES (
    'Cardinal Health', '7000 Cardinal Pl, Dublin, OH 43017', 'BC1234567',
    CURRENT_DATE - INTERVAL '30 days',
    1, '10mg/mL', 'Oral Solution', 1000.0,
    'F222-2024-001', '123 Treatment Center Way, City, ST 12345',
    'pharmacy_manager'
);

-- Sample initial inventory snapshot
INSERT INTO InventorySnapshot (
    snapshot_type, taken_at, opened_or_closed_of_business,
    taken_by, verified_by, registered_location, locked
) VALUES (
    'initial', CURRENT_DATE - INTERVAL '90 days', 'opening',
    'head_nurse', 'pharmacy_manager',
    '123 Treatment Center Way, City, ST 12345', TRUE
);
