-- Seed data for methadone dispensing system
-- Version 1.0 - Initial test data

-- Insert sample medications
INSERT INTO medication (name, conc_mg_per_ml, ndc) VALUES
('Methadone HCl Oral Solution', 10.0, '0054-3553-63'),
('Methadone HCl Concentrate', 10.0, '0054-3554-58'),
('Methadone HCl Sugar-Free', 10.0, '0054-3555-49');

-- Insert sample lot batches
INSERT INTO lot_batch (lot, manufacturer, exp_date, medication_id) VALUES
('LOT2024001', 'Roxane Laboratories', '2025-12-31', 1),
('LOT2024002', 'Mallinckrodt Pharmaceuticals', '2025-11-30', 2),
('LOT2024003', 'West-Ward Pharmaceuticals', '2025-10-31', 3);

-- Insert sample bottles
INSERT INTO bottle (lot_id, start_volume_ml, current_volume_ml, opened_at, status, serial_no) VALUES
(1, 1000.0, 850.5, '2024-01-15 08:00:00', 'active', 'BTL001'),
(1, 1000.0, 1000.0, NULL, 'reserved', 'BTL002'),
(2, 500.0, 425.2, '2024-01-16 09:30:00', 'active', 'BTL003'),
(3, 1000.0, 750.8, '2024-01-14 07:45:00', 'active', 'BTL004');

-- Insert sample devices
INSERT INTO device (type, location, com_port, firmware, status) VALUES
('MethaSpense', 'Dispensing Station 1', 'COM3', 'v2.1.4', 'online'),
('MethaSpense', 'Dispensing Station 2', 'COM4', 'v2.1.4', 'online'),
('MethaSpense', 'Backup Station', 'COM5', 'v2.1.3', 'offline');

-- Insert sample patients
INSERT INTO patient_dispensing (name, dob, mrn) VALUES
('John Smith', '1985-03-15', 'MRN001234'),
('Sarah Johnson', '1978-07-22', 'MRN001235'),
('Michael Brown', '1992-11-08', 'MRN001236'),
('Lisa Davis', '1980-05-30', 'MRN001237');

-- Insert sample medication orders
INSERT INTO medication_order (patient_id, daily_dose_mg, max_takehome, start_date, prescriber_id, status) VALUES
(1, 80.0, 6, '2024-01-01', 'DR001', 'active'),
(2, 120.0, 13, '2024-01-05', 'DR002', 'active'),
(3, 60.0, 0, '2024-01-10', 'DR001', 'active'),
(4, 100.0, 6, '2024-01-08', 'DR003', 'active');

-- Insert sample dose events
INSERT INTO dose_event (patient_id, order_id, requested_mg, dispensed_mg, dispensed_ml, bottle_id, device_id, by_user, outcome, signature_hash) VALUES
(1, 1, 80.0, 80.0, 8.0, 1, 1, 'nurse001', 'success', 'abc123def456'),
(2, 2, 120.0, 120.0, 12.0, 3, 1, 'nurse002', 'success', 'def456ghi789'),
(3, 3, 60.0, 60.0, 6.0, 4, 2, 'nurse001', 'success', 'ghi789jkl012'),
(1, 1, 80.0, 0.0, 0.0, 1, 1, 'nurse003', 'aborted', NULL);

-- Insert sample inventory transactions
INSERT INTO inventory_txn (bottle_id, type, qty_ml, reason, by_user, dose_event_id) VALUES
(1, 'dose', -8.0, 'Patient dose - John Smith', 'nurse001', 1),
(3, 'dose', -12.0, 'Patient dose - Sarah Johnson', 'nurse002', 2),
(4, 'dose', -6.0, 'Patient dose - Michael Brown', 'nurse001', 3),
(1, 'waste', -2.5, 'Line purge after maintenance', 'tech001', NULL),
(2, 'receipt', 1000.0, 'New bottle received', 'pharmacist001', NULL);

-- Insert sample device events
INSERT INTO device_event (device_id, event_type, payload, at_time) VALUES
(1, 'bottle_change', '{"old_bottle": "BTL005", "new_bottle": "BTL001"}', '2024-01-15 08:00:00'),
(1, 'bubble_detected', '{"line": "main", "severity": "warning"}', '2024-01-16 14:30:00'),
(2, 'maintenance', '{"type": "calibration", "technician": "tech001"}', '2024-01-14 16:00:00');

-- Insert sample shift counts
INSERT INTO shift_count (date, shift, opening_ml, closing_ml, computed_use_ml, physical_count_ml, by_user, verified_by, verified_at) VALUES
('2024-01-15', 'day', 2500.0, 2450.5, 49.5, 49.5, 'nurse001', 'supervisor001', '2024-01-15 16:00:00'),
('2024-01-15', 'evening', 2450.5, 2420.2, 30.3, 30.0, 'nurse002', 'supervisor002', '2024-01-15 23:30:00'),
('2024-01-16', 'day', 2420.2, 2385.8, 34.4, 34.7, 'nurse003', NULL, NULL);
