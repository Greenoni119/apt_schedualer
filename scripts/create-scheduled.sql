-- Create the scheduled table for appointments
CREATE TABLE IF NOT EXISTS public.scheduled (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  
  -- Appointment details
  appointment_type_id UUID NOT NULL,
  appointment_date DATE NOT NULL,
  time_slot TEXT NOT NULL,
  
  -- Contact info
  client_name TEXT NOT NULL,
  client_email TEXT NOT NULL,
  client_phone TEXT,
  
  -- Status
  status TEXT DEFAULT 'confirmed',
  notes TEXT
);

-- Enable RLS
ALTER TABLE public.scheduled ENABLE ROW LEVEL SECURITY;

-- Create policy for anonymous access
CREATE POLICY "Allow all operations for anon" ON public.scheduled
  FOR ALL 
  TO anon
  USING (true) 
  WITH CHECK (true);

-- Insert a test record to verify
INSERT INTO public.scheduled (
  appointment_type_id,
  appointment_date,
  time_slot,
  client_name,
  client_email,
  status
)
VALUES (
  '766ad826-2114-4478-bf9f-174b0bac49ae',
  CURRENT_DATE,
  '10:30',
  'Test Client',
  'test@example.com',
  'confirmed'
);