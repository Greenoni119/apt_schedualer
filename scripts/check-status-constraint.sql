-- Check the constraints on the scheduled table, specifically for the status column

-- Get all check constraints for the scheduled table
SELECT con.conname, pg_get_constraintdef(con.oid)
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
WHERE rel.relname = 'scheduled'
  AND con.contype = 'c'; -- 'c' means check constraint

-- Check the available values in existing records
SELECT DISTINCT status FROM scheduled;

-- Try inserting with various status values to find what's allowed
-- First attempt with 'scheduled' status
INSERT INTO public.scheduled (
  apt_number,
  first_name,
  last_name,
  email,
  appointment_date,
  appointment_time,
  text_notification,
  status
)
VALUES (
  '8001',
  'Test',
  'Status',
  'test@example.com',
  CURRENT_DATE,
  '14:00:00',
  0,
  'scheduled'  -- Try 'scheduled' status
)
RETURNING *;

-- Second attempt with 'pending' status
INSERT INTO public.scheduled (
  apt_number,
  first_name,
  last_name,
  email,
  appointment_date,
  appointment_time,
  text_notification,
  status
)
VALUES (
  '8002',
  'Test',
  'Status',
  'test@example.com',
  CURRENT_DATE,
  '14:30:00',
  0,
  'pending'  -- Try 'pending' status
)
RETURNING *;

-- Third attempt with 'active' status
INSERT INTO public.scheduled (
  apt_number,
  first_name,
  last_name,
  email,
  appointment_date,
  appointment_time,
  text_notification,
  status
)
VALUES (
  '8003',
  'Test',
  'Status',
  'test@example.com',
  CURRENT_DATE,
  '15:00:00',
  0,
  'active'  -- Try 'active' status
)
RETURNING *;