-- Create the scheduled table for appointments
CREATE TABLE IF NOT EXISTS public.scheduled (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  appointment_type_id UUID NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  time_slot TEXT,
  status TEXT DEFAULT 'scheduled',
  notes TEXT
);

-- Enable RLS on the scheduled table
ALTER TABLE public.scheduled ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations for now (for testing)
CREATE POLICY "Allow all operations for testing" 
ON public.scheduled FOR ALL 
TO anon
USING (true)
WITH CHECK (true);

-- Create the queue management tables
CREATE TABLE IF NOT EXISTS public.queued (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduled_id UUID REFERENCES public.scheduled(id),
  check_in_time TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT DEFAULT 'waiting',
  call_number INTEGER,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS public.showed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduled_id UUID REFERENCES public.scheduled(id),
  queued_id UUID REFERENCES public.queued(id),
  start_time TIMESTAMP WITH TIME ZONE DEFAULT now(),
  end_time TIMESTAMP WITH TIME ZONE,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS public.cancelled (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduled_id UUID REFERENCES public.scheduled(id),
  queued_id UUID REFERENCES public.queued(id),
  cancel_time TIMESTAMP WITH TIME ZONE DEFAULT now(),
  reason TEXT,
  notes TEXT
);

-- Add RLS policies for queue tables
ALTER TABLE public.queued ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.showed ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cancelled ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all operations for testing on queued" 
ON public.queued FOR ALL 
TO anon
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all operations for testing on showed" 
ON public.showed FOR ALL 
TO anon
USING (true)
WITH CHECK (true);

CREATE POLICY "Allow all operations for testing on cancelled" 
ON public.cancelled FOR ALL 
TO anon
USING (true)
WITH CHECK (true);

-- Create or replace a helper function to check if the table exists
CREATE OR REPLACE FUNCTION check_scheduled_table()
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_agg(column_name)
  INTO result
  FROM information_schema.columns
  WHERE table_name = 'scheduled';
  
  RETURN result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;