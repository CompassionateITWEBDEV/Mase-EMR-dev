-- Seed some sample notifications for testing
INSERT INTO team_notifications (
  id,
  title,
  message,
  notification_type,
  action_url,
  priority,
  is_read,
  created_at
) VALUES 
  (
    gen_random_uuid(),
    'New Patient Registration',
    'A new patient has been registered and requires initial assessment.',
    'intake',
    '/intake-queue',
    'normal',
    false,
    NOW() - INTERVAL '5 minutes'
  ),
  (
    gen_random_uuid(),
    'Lab Results Available',
    'Toxicology screening results are ready for review.',
    'lab',
    '/patients',
    'high',
    false,
    NOW() - INTERVAL '15 minutes'
  ),
  (
    gen_random_uuid(),
    'Appointment Reminder',
    'You have 4 patient appointments scheduled for today.',
    'appointment',
    '/appointments',
    'normal',
    true,
    NOW() - INTERVAL '1 hour'
  ),
  (
    gen_random_uuid(),
    'Prior Authorization Approved',
    'Insurance prior authorization #PA-2024-0892 has been approved.',
    'billing',
    '/insurance',
    'normal',
    true,
    NOW() - INTERVAL '2 hours'
  ),
  (
    gen_random_uuid(),
    'Compliance Alert',
    '3 patient assessments are overdue and require immediate attention.',
    'compliance',
    '/assessments',
    'urgent',
    false,
    NOW() - INTERVAL '3 hours'
  ),
  (
    gen_random_uuid(),
    'Prescription Renewal Request',
    'Patient requested medication refill for Suboxone.',
    'prescription',
    '/prescriptions',
    'high',
    false,
    NOW() - INTERVAL '4 hours'
  ),
  (
    gen_random_uuid(),
    'Care Team Update',
    'New counselor has been assigned to care team.',
    'team',
    '/care-teams',
    'normal',
    true,
    NOW() - INTERVAL '1 day'
  )
ON CONFLICT DO NOTHING;
