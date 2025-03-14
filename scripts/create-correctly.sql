-- This script will create new tables with correct structure

-- Drop existing tables if they exist
DROP TABLE IF EXISTS public.scheduled;

-- Create scheduled table with proper columns
CREATE TABLE IF NOT EXISTS public.scheduled (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  user_id TEXT DEFAULT 'anonymous',
  first_name TEXT,
  last_name TEXT,
  full_name TEXT,
  email TEXT,
  phone TEXT,
  appointment_type_id UUID,
  time_slot TEXT,
  status TEXT DEFAULT 'scheduled',
  notes TEXT
);

-- Insert test data
INSERT INTO public.scheduled (
  full_name, 
  email, 
  appointment_type_id, 
  time_slot, 
  status
)
VALUES (
  'Test User', 
  'test@example.com', 
  '766ad826-2114-4478-bf9f-174b0bac49ae', 
  '10:30', 
  'scheduled'
);

-- Enable RLS
ALTER TABLE public.scheduled ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations
CREATE POLICY "Allow all operations" ON public.scheduled
  FOR ALL 
  TO anon
  USING (true) 
  WITH CHECK (true);

-- After running this script, let's see what we created
SELECT * FROM public.scheduled LIMIT 10;