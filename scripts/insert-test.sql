-- Simple test script to insert a record directly

-- First, make sure RLS is enabled and we have a policy
ALTER TABLE public.scheduled ENABLE ROW LEVEL SECURITY;

-- Drop any existing policies
DROP POLICY IF EXISTS "Allow all operations for anon" ON public.scheduled;

-- Create a simple policy that allows all operations
CREATE POLICY "Allow all operations for anon" 
ON public.scheduled 
FOR ALL 
TO anon 
USING (true) 
WITH CHECK (true);

-- Now try inserting a test record
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
  '8888',
  'Direct',
  'Insert',
  'direct@example.com',
  CURRENT_DATE,
  '13:00:00',
  0,
  'confirmed'
)
RETURNING *;