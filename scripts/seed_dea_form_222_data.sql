-- Sample DEA registrant and POA data
INSERT INTO dea_poa (registrant_dea_number, authorized_user_id, authorized_name, poa_document_url, effective_date) VALUES
('BM1234567', 1, 'Dr. Sarah Johnson', '/documents/poa-dr-johnson.pdf', '2024-01-01'),
('BM1234567', 2, 'PharmD Michael Smith', '/documents/poa-pharmD-smith.pdf', '2024-01-01');

-- Sample Form 222 with pending line items
INSERT INTO dea_form_222 (
  form_number, supplier_name, supplier_address, supplier_dea_number,
  registrant_name, registrant_dea_number, signed_by_user_id, signed_at,
  execution_date, expires_at, status
) VALUES (
  'F222-2024-001',
  'Cardinal Health',
  '7000 Cardinal Place, Dublin, OH 43017',
  'BC1234567',
  'MASE Treatment Center',
  'BM1234567',
  1,
  '2024-12-01 10:30:00',
  '2024-12-01',
  '2025-01-30 23:59:59',
  'executed'
);

INSERT INTO dea_form_222_line (form_222_id, line_number, medication_id, quantity_ordered, unit, status) VALUES
(1, 1, 1, 1000.0, 'mL', 'pending'),
(1, 2, 1, 500.0, 'mL', 'pending');
