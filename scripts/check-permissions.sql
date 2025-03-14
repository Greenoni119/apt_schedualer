-- Check RLS (Row Level Security) policies on the scheduled table
SELECT
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM
  pg_policies
WHERE
  tablename = 'scheduled';

-- Add a policy if none exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'scheduled' 
    AND roles = '{anon}'
  ) THEN
    -- Enable RLS on the table (if not already enabled)
    EXECUTE 'ALTER TABLE public.scheduled ENABLE ROW LEVEL SECURITY;';
    
    -- Create a policy that allows all operations
    EXECUTE 'CREATE POLICY "Allow all operations for anon" ON public.scheduled FOR ALL TO anon USING (true) WITH CHECK (true);';
  END IF;
END
$$;

-- Verify policies after changes
SELECT
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM
  pg_policies
WHERE
  tablename = 'scheduled';

-- Check for any specific INSERT policies
SELECT
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM
  pg_policies
WHERE
  tablename = 'scheduled'
  AND cmd = 'INSERT';

-- Try inserting a test record to verify permissions
INSERT INTO public.scheduled (
  apt_number,
  first_name,
  last_name,
  email,
  phone_number,
  appointment_date,
  appointment_time,
  text_notification,
  status,
  appointment_type_id
) VALUES (
  '9999',
  'SQL',
  'Test',
  'sqltest@example.com',
  '555-1212',
  CURRENT_DATE,
  '12:00:00',
  0,
  'confirmed',
  '766ad826-2114-4478-bf9f-174b0bac49ae'
)
RETURNING *;