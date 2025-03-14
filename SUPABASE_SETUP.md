# Supabase Setup Guide for Appointment Scheduler

This guide will help you set up the required tables and schema in your Supabase project.

## Step 1: Configure Environment Variables

1. Log in to your Supabase dashboard at https://app.supabase.com
2. Select your project
3. Go to Settings > API
4. Copy the URL and anon key
5. Update your `.env.local` file with these values:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-url.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Step 2: Create Tables

Run these SQL scripts in the Supabase SQL Editor to create the required tables.

### Create appointment_types Table

```sql
CREATE TABLE appointment_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  duration INTEGER NOT NULL, -- in minutes
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert sample appointment types
INSERT INTO appointment_types (name, description, duration, icon, color)
VALUES 
  ('Consultation', 'A brief 30-minute initial consultation to discuss your needs', 30, 'message-square', 'bg-blue-500/10 text-blue-600 dark:bg-blue-500/30 dark:text-blue-400'),
  ('Standard Session', 'A comprehensive 1-hour session for most standard needs', 60, 'clock', 'bg-green-500/10 text-green-600 dark:bg-green-500/30 dark:text-green-400'),
  ('Extended Session', 'An in-depth 90-minute session for complex matters requiring extra time', 90, 'star', 'bg-purple-500/10 text-purple-600 dark:bg-purple-500/30 dark:text-purple-400'),
  ('Emergency', 'A priority 45-minute session for urgent matters requiring immediate attention', 45, 'alert-circle', 'bg-red-500/10 text-red-600 dark:bg-red-500/30 dark:text-red-400');
```

### Create time_slots Table

```sql
CREATE TABLE time_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  available INTEGER NOT NULL DEFAULT 10,
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'limited', 'busy', 'past')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(date, start_time, end_time)
);

-- Create function to generate time slots
CREATE OR REPLACE FUNCTION generate_time_slots(
  start_date DATE,
  end_date DATE,
  start_hour INTEGER DEFAULT 9, -- 9 AM
  end_hour INTEGER DEFAULT 17, -- 5 PM
  slot_duration INTEGER DEFAULT 30, -- minutes
  slots_per_time INTEGER DEFAULT 3 -- how many parallel appointments can be booked
)
RETURNS void AS $$
DECLARE
  current_date DATE;
  slot_start TIME;
  slot_end TIME;
BEGIN
  current_date := start_date;
  
  WHILE current_date <= end_date LOOP
    -- Skip weekends (6 = Saturday, 0 = Sunday)
    IF EXTRACT(DOW FROM current_date) NOT IN (0, 6) THEN
      slot_start := make_time(start_hour, 0, 0);
      
      WHILE EXTRACT(HOUR FROM slot_start) < end_hour LOOP
        slot_end := slot_start + (slot_duration || ' minutes')::interval;
        
        -- Insert time slot if it doesn't exist
        INSERT INTO time_slots (date, start_time, end_time, available)
        VALUES (current_date, slot_start, slot_end, slots_per_time)
        ON CONFLICT (date, start_time, end_time) DO NOTHING;
        
        slot_start := slot_start + (slot_duration || ' minutes')::interval;
      END LOOP;
    END IF;
    
    current_date := current_date + 1;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Generate time slots for the next 30 days
SELECT generate_time_slots(CURRENT_DATE, CURRENT_DATE + 30);
```

### Create users & appointments Tables

```sql
-- Create users table (will be connected to auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users,
  email TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create appointments table
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  appointment_type_id UUID NOT NULL REFERENCES appointment_types(id),
  date DATE NOT NULL,
  time_slot_id UUID NOT NULL REFERENCES time_slots(id),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled', 'completed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create function to decrease time slot availability when an appointment is created
CREATE OR REPLACE FUNCTION decrease_time_slot_availability()
RETURNS TRIGGER AS $$
BEGIN
  -- Decrease availability
  UPDATE time_slots
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
$$ LANGUAGE plpgsql;

-- Create trigger to decrease availability
CREATE TRIGGER appointment_created
AFTER INSERT ON appointments
FOR EACH ROW EXECUTE FUNCTION decrease_time_slot_availability();

-- Create function to increase time slot availability when an appointment is cancelled
CREATE OR REPLACE FUNCTION increase_time_slot_availability()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if status changed to cancelled
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    -- Increase availability
    UPDATE time_slots
    SET 
      available = available + 1,
      status = CASE 
        WHEN available + 1 > 5 THEN 'available'
        WHEN available + 1 > 0 THEN 'limited'
        ELSE 'busy'
      END,
      updated_at = now()
    WHERE id = NEW.time_slot_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to increase availability
CREATE TRIGGER appointment_cancelled
AFTER UPDATE ON appointments
FOR EACH ROW EXECUTE FUNCTION increase_time_slot_availability();
```

### Create Task to Mark Past Time Slots

```sql
-- Function to mark past time slots
CREATE OR REPLACE FUNCTION mark_past_time_slots()
RETURNS void AS $$
BEGIN
  UPDATE time_slots
  SET status = 'past', updated_at = now()
  WHERE date < CURRENT_DATE AND status != 'past';
END;
$$ LANGUAGE plpgsql;

-- Run this manually periodically, or set up a scheduled function with pg_cron if available
-- SELECT mark_past_time_slots();
```

## Step 3: Set Up Row Level Security Policies

```sql
-- Enable RLS on all tables
ALTER TABLE appointment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Create policies

-- Allow anyone to read appointment types
CREATE POLICY "Anyone can read appointment types"
ON appointment_types FOR SELECT
TO anon, authenticated
USING (true);

-- Allow anyone to read available time slots
CREATE POLICY "Anyone can read time slots"
ON time_slots FOR SELECT
TO anon, authenticated
USING (true);

-- Users can only read their own user data
CREATE POLICY "Users can read their own data"
ON users FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Users can read appointments they created
CREATE POLICY "Users can read their own appointments"
ON appointments FOR SELECT
TO authenticated
USING (user_id = auth.uid() OR email = auth.email());

-- Users can insert appointments (for booking)
CREATE POLICY "Anyone can insert appointments"
ON appointments FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Users can update their own appointments (for canceling)
CREATE POLICY "Users can update their own appointments"
ON appointments FOR UPDATE
TO authenticated
USING (user_id = auth.uid() OR email = auth.email())
WITH CHECK (user_id = auth.uid() OR email = auth.email());
```

## Step 4: Testing Your Setup

After running all the SQL, try the following:

1. Ensure appointment types are visible
2. Check if time slots have been generated
3. Try creating a test appointment

## Next Steps

Once you have this basic structure set up:

1. Set up authentication (if needed)
2. Adjust policies for your specific requirements
3. Consider setting up emails for appointment confirmations using Edge Functions

## Troubleshooting

- If you encounter errors about references, ensure tables are created in the correct order
- If RLS policies block access, you might need to adjust them
- Make sure your .env.local file has the correct Supabase URL and anon key
