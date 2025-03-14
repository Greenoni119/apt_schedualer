-- *** IMPORTANT: Run this in the Supabase SQL Editor to set up your database properly ***

-- Create scheduled table
CREATE TABLE IF NOT EXISTS public.scheduled (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  appointment_type_id UUID NOT NULL,
  time_slot TEXT,
  status TEXT DEFAULT 'scheduled',
  notes TEXT
);

-- Create a test entry to verify it works
INSERT INTO public.scheduled (name, email, appointment_type_id, time_slot, status)
VALUES 
  ('Test User', 'test@example.com', '766ad826-2114-4478-bf9f-174b0bac49ae', '10:30', 'scheduled');

-- Set up RLS (Row Level Security) to allow anonymous access
ALTER TABLE public.scheduled ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for anonymous users
CREATE POLICY "Allow all operations" ON public.scheduled
  FOR ALL 
  TO anon
  USING (true) 
  WITH CHECK (true);

-- Verify the table exists and has the right structure
SELECT table_name, column_name, data_type
FROM information_schema.columns
WHERE table_name = 'scheduled'
ORDER BY ordinal_position;