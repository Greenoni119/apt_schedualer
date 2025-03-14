-- Create users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create appointment_types table
CREATE TABLE IF NOT EXISTS public.appointment_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  duration INTEGER NOT NULL, -- in minutes
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create time_slots table
CREATE TABLE IF NOT EXISTS public.time_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  available INTEGER NOT NULL DEFAULT 10,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'limited', 'busy', 'past')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  UNIQUE(date, start_time, end_time)
);

-- Create appointments table
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id),
  appointment_type_id UUID REFERENCES public.appointment_types(id) NOT NULL,
  date DATE NOT NULL,
  time_slot_id UUID REFERENCES public.time_slots(id) NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL
);

-- Create RLS policies
-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Users can only see and update their own data
CREATE POLICY "Users can view own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON public.users
  FOR UPDATE USING (auth.uid() = id);

-- Anyone can view appointment types
CREATE POLICY "Anyone can view appointment types" ON public.appointment_types
  FOR SELECT USING (true);

-- Anyone can view time slots
CREATE POLICY "Anyone can view time slots" ON public.time_slots
  FOR SELECT USING (true);

-- Users can view their own appointments
CREATE POLICY "Users can view own appointments" ON public.appointments
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert appointments
CREATE POLICY "Users can insert appointments" ON public.appointments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own appointments
CREATE POLICY "Users can update own appointments" ON public.appointments
  FOR UPDATE USING (auth.uid() = user_id);

-- Create functions and triggers
-- Function to update time_slot availability when an appointment is created
CREATE OR REPLACE FUNCTION public.update_time_slot_availability_on_appointment_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Decrease availability by 1
  UPDATE public.time_slots
  SET 
    available = GREATEST(0, available - 1),
    status = CASE 
      WHEN available <= 1 THEN 'busy'
      WHEN available <= 5 THEN 'limited'
      ELSE 'available'
    END,
    updated_at = now()
  WHERE id = NEW.time_slot_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update time_slot availability when an appointment is created
CREATE TRIGGER update_time_slot_availability_on_appointment_insert
AFTER INSERT ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.update_time_slot_availability_on_appointment_insert();

-- Function to update time_slot availability when an appointment is cancelled
CREATE OR REPLACE FUNCTION public.update_time_slot_availability_on_appointment_cancel()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status != 'cancelled' AND NEW.status = 'cancelled' THEN
    -- Increase availability by 1
    UPDATE public.time_slots
    SET 
      available = available + 1,
      status = CASE 
        WHEN available = 0 THEN 'limited'
        WHEN available < 5 THEN 'limited'
        ELSE 'available'
      END,
      updated_at = now()
    WHERE id = NEW.time_slot_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to update time_slot availability when an appointment is cancelled
CREATE TRIGGER update_time_slot_availability_on_appointment_cancel
AFTER UPDATE ON public.appointments
FOR EACH ROW
WHEN (OLD.status != 'cancelled' AND NEW.status = 'cancelled')
EXECUTE FUNCTION public.update_time_slot_availability_on_appointment_cancel();

-- Function to update time_slots status to 'past' when date is in the past
CREATE OR REPLACE FUNCTION public.update_past_time_slots()
RETURNS void AS $$
BEGIN
  UPDATE public.time_slots
  SET status = 'past'
  WHERE date < CURRENT_DATE AND status != 'past';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create a cron job to run update_past_time_slots daily
SELECT cron.schedule(
  'update-past-time-slots',
  '0 0 * * *',  -- Run at midnight every day
  $$SELECT public.update_past_time_slots()$$
);

-- Insert sample data for appointment types
INSERT INTO public.appointment_types (name, description, duration, icon, color)
VALUES 
  ('Consultation', 'Initial consultation to discuss your needs and goals', 30, 'message-square', 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/30 dark:text-blue-400'),
  ('Follow-up', 'Follow-up appointment to check on progress', 45, 'clock', 'bg-green-500/10 text-green-600 dark:bg-green-500/30 dark:text-green-400'),
  ('Review', 'Comprehensive review of your progress and plan adjustments', 60, 'star', 'bg-purple-500/10 text-purple-600 dark:bg-purple-500/30 dark:text-purple-400'),
  ('Emergency', 'Urgent appointment for immediate concerns', 30, 'alert-circle', 'bg-red-500/10 text-red-600 dark:bg-red-500/30 dark:text-red-400');

-- Create function to generate time slots for the next 3 months
CREATE OR REPLACE FUNCTION public.generate_time_slots(start_date DATE, end_date DATE)
RETURNS void AS $$
DECLARE
  current_date DATE := start_date;
  slot_start TIME;
  slot_end TIME;
  weekday INTEGER;
BEGIN
  WHILE current_date <= end_date LOOP
    weekday := EXTRACT(DOW FROM current_date);
    
    -- Skip weekends (0 = Sunday, 6 = Saturday)
    IF weekday != 0 AND weekday != 6 THEN
      -- Morning slots (9 AM to 12 PM)
      slot_start := '09:00:00'::TIME;
      WHILE slot_start < '12:00:00'::TIME LOOP
        slot_end := slot_start + INTERVAL '30 minutes';
        
        -- Insert only if this slot doesn't already exist
        INSERT INTO public.time_slots (date, start_time, end_time, available, status)
        VALUES (current_date, slot_start, slot_end, 10, 'available')
        ON CONFLICT (date, start_time, end_time) DO NOTHING;
        
        slot_start := slot_end;
      END LOOP;
      
      -- Afternoon slots (1 PM to 5 PM)
      slot_start := '13:00:00'::TIME;
      WHILE slot_start < '17:00:00'::TIME LOOP
        slot_end := slot_start + INTERVAL '30 minutes';
        
        -- Insert only if this slot doesn't already exist
        INSERT INTO public.time_slots (date, start_time, end_time, available, status)
        VALUES (current_date, slot_start, slot_end, 10, 'available')
        ON CONFLICT (date, start_time, end_time) DO NOTHING;
        
        slot_start := slot_end;
      END LOOP;
    END IF;
    
    current_date := current_date + INTERVAL '1 day';
  END LOOP;
  
  -- Mark past slots as 'past'
  UPDATE public.time_slots
  SET status = 'past'
  WHERE date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Generate time slots for the next 3 months
SELECT public.generate_time_slots(CURRENT_DATE, CURRENT_DATE + INTERVAL '3 months');

-- Create a cron job to generate time slots monthly
SELECT cron.schedule(
  'generate-time-slots-monthly',
  '0 0 1 * *',  -- Run at midnight on the 1st of every month
  $$SELECT public.generate_time_slots(CURRENT_DATE + INTERVAL '3 months', CURRENT_DATE + INTERVAL '4 months')$$
);
