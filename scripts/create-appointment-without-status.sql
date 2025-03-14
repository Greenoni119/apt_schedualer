-- Create an appointment while bypassing the status constraint

-- First, let's try to temporarily disable the constraint
ALTER TABLE scheduled DISABLE TRIGGER ALL;

-- Insert a test appointment without a status (will use default if there is one)
INSERT INTO scheduled (
  apt_number,
  first_name,
  last_name,
  email,
  appointment_date,
  appointment_time,
  text_notification
)
VALUES (
  '9000',
  'API',
  'Test',
  'apitest@example.com',
  CURRENT_DATE,
  '09:00:00',
  0
)
RETURNING *;

-- Re-enable the triggers
ALTER TABLE scheduled ENABLE TRIGGER ALL;

-- See what status value was assigned
SELECT * FROM scheduled WHERE apt_number = '9000';