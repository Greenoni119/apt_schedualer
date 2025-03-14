# Queue System Setup Guide

Based on your requirements, here's how to set up a queue management system for appointments in Supabase.

## Table Structure Overview

We'll create these essential tables:

1. **appointment_types** - Types of appointments available
2. **scheduled** - Appointments made by clients (before check-in)
3. **queued** - Clients who have checked in and are waiting
4. **showed** - Clients who completed their appointments
5. **cancelled** - Clients who were no-shows or cancelled
6. **staff** - Staff members who handle the clients

## SQL to Create Tables

### Scheduled Table

```sql
CREATE TABLE scheduled (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apt_number TEXT NOT NULL UNIQUE,
  appointment_type_id UUID REFERENCES appointment_types(id),
  last_name TEXT NOT NULL,
  first_name TEXT NOT NULL,
  phone_number TEXT,
  email TEXT,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  text_notification INTEGER NOT NULL DEFAULT 0, -- 0: not sent, 1: sent
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'checked_in', 'showing', 'showed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for faster lookups by name and appointment number
CREATE INDEX idx_scheduled_names ON scheduled (last_name, first_name);
CREATE INDEX idx_scheduled_apt_number ON scheduled (apt_number);
CREATE INDEX idx_scheduled_date ON scheduled (appointment_date);

-- Function to generate appointment numbers (format: YYYYMMDD-XXX)
CREATE OR REPLACE FUNCTION generate_appointment_number()
RETURNS TRIGGER AS $$
DECLARE
  date_part TEXT;
  sequence_part TEXT;
  today_count INTEGER;
BEGIN
  -- Format: YYYYMMDD-XXX where XXX is sequential for the day
  date_part := to_char(NEW.appointment_date, 'YYYYMMDD');
  
  -- Count existing appointments for this date
  SELECT COUNT(*) + 1 INTO today_count 
  FROM scheduled 
  WHERE appointment_date = NEW.appointment_date;
  
  -- Format sequence part as 3 digits with leading zeros
  sequence_part := lpad(today_count::text, 3, '0');
  
  -- Set the appointment number
  NEW.apt_number := date_part || '-' || sequence_part;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate appointment numbers
CREATE TRIGGER set_appointment_number
BEFORE INSERT ON scheduled
FOR EACH ROW
WHEN (NEW.apt_number IS NULL)
EXECUTE FUNCTION generate_appointment_number();
```

### Queued Table

```sql
CREATE TABLE queued (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_number TEXT NOT NULL, -- Format: Letter + Number (e.g., D19)
  apt_number TEXT NOT NULL REFERENCES scheduled(apt_number),
  last_name TEXT NOT NULL,
  first_name TEXT NOT NULL,
  phone_number TEXT,
  email TEXT,
  appointment_date DATE NOT NULL,
  check_in_time TIMESTAMP WITH TIME ZONE DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'called', 'serving')),
  window_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_queued_call_number ON queued (call_number);
CREATE INDEX idx_queued_apt_number ON queued (apt_number);
CREATE INDEX idx_queued_status ON queued (status);

-- Function to generate call numbers (e.g., D19)
CREATE OR REPLACE FUNCTION generate_call_number()
RETURNS TRIGGER AS $$
DECLARE
  letter CHAR;
  number_part INTEGER;
  last_number INTEGER;
  current_hour INTEGER;
BEGIN
  -- Different letter for different parts of the day
  current_hour := EXTRACT(HOUR FROM CURRENT_TIME);
  
  IF current_hour >= 8 AND current_hour < 10 THEN
    letter := 'A';
  ELSIF current_hour >= 10 AND current_hour < 12 THEN
    letter := 'B';
  ELSIF current_hour >= 12 AND current_hour < 14 THEN
    letter := 'C';
  ELSIF current_hour >= 14 AND current_hour < 16 THEN
    letter := 'D';
  ELSE
    letter := 'E';
  END IF;
  
  -- Find the last number used for this letter today
  SELECT COALESCE(MAX(REGEXP_REPLACE(call_number, '^[A-Z]', '', 'g')::INTEGER), 0)
  INTO last_number
  FROM queued
  WHERE call_number LIKE letter || '%'
    AND DATE(check_in_time) = CURRENT_DATE;
  
  -- Increment the number
  number_part := last_number + 1;
  
  -- Set the call number
  NEW.call_number := letter || number_part::TEXT;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate call numbers
CREATE TRIGGER set_call_number
BEFORE INSERT ON queued
FOR EACH ROW
WHEN (NEW.call_number IS NULL)
EXECUTE FUNCTION generate_call_number();
```

### Showed Table

```sql
CREATE TABLE showed (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  call_number TEXT NOT NULL,
  apt_number TEXT NOT NULL,
  last_name TEXT NOT NULL,
  first_name TEXT NOT NULL,
  phone_number TEXT,
  email TEXT,
  appointment_date DATE NOT NULL,
  check_in_time TIMESTAMP WITH TIME ZONE NOT NULL,
  window_number TEXT NOT NULL,
  served_by TEXT,
  service_start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  service_end_time TIMESTAMP WITH TIME ZONE,
  service_duration INTEGER, -- in minutes
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_showed_apt_number ON showed (apt_number);
CREATE INDEX idx_showed_date ON showed (appointment_date);
```

### Cancelled Table

```sql
CREATE TABLE cancelled (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  apt_number TEXT NOT NULL,
  appointment_type_id UUID REFERENCES appointment_types(id),
  last_name TEXT NOT NULL,
  first_name TEXT NOT NULL,
  phone_number TEXT,
  email TEXT,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  text_notification INTEGER NOT NULL DEFAULT 0,
  cancellation_reason TEXT NOT NULL,
  cancellation_time TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create index for faster lookups
CREATE INDEX idx_cancelled_apt_number ON cancelled (apt_number);
CREATE INDEX idx_cancelled_date ON cancelled (appointment_date);
```

## Key Functions

### Check-in Function

```sql
-- Function to check in an appointment
CREATE OR REPLACE FUNCTION check_in_appointment(appointment_num TEXT)
RETURNS TEXT AS $$
DECLARE
  appt RECORD;
  call_num TEXT;
BEGIN
  -- Find the appointment in scheduled
  SELECT * INTO appt FROM scheduled
  WHERE apt_number = appointment_num
    AND appointment_date = CURRENT_DATE
    AND status = 'scheduled';
  
  -- If not found, return error
  IF NOT FOUND THEN
    RETURN 'error:appointment_not_found';
  END IF;
  
  -- Update status in scheduled
  UPDATE scheduled
  SET status = 'checked_in', updated_at = now()
  WHERE apt_number = appointment_num;
  
  -- Insert into queued (will trigger call number generation)
  INSERT INTO queued (
    apt_number, last_name, first_name, 
    phone_number, email, appointment_date
  ) VALUES (
    appt.apt_number, appt.last_name, appt.first_name,
    appt.phone_number, appt.email, appt.appointment_date
  ) RETURNING call_number INTO call_num;
  
  RETURN call_num;
END;
$$ LANGUAGE plpgsql;
```

### No-Show Function

```sql
-- Function to mark no-shows (appointments that didn't check in within buffer time)
CREATE OR REPLACE FUNCTION check_for_no_shows()
RETURNS INTEGER AS $$
DECLARE
  no_show_count INTEGER := 0;
  no_show RECORD;
  current_time_minus_buffer TIMESTAMP;
BEGIN
  -- Calculate current time minus buffer (20 minutes)
  current_time_minus_buffer := now() - INTERVAL '20 minutes';
  
  -- Find all appointments that should have checked in by now
  FOR no_show IN 
    SELECT * FROM scheduled
    WHERE appointment_date = CURRENT_DATE
      AND (appointment_time < current_time_minus_buffer::TIME)
      AND status = 'scheduled'
  LOOP
    -- Move to cancelled
    INSERT INTO cancelled (
      apt_number, appointment_type_id, last_name, first_name,
      phone_number, email, appointment_date, appointment_time,
      text_notification, cancellation_reason
    ) VALUES (
      no_show.apt_number, no_show.appointment_type_id, no_show.last_name, no_show.first_name,
      no_show.phone_number, no_show.email, no_show.appointment_date, no_show.appointment_time,
      no_show.text_notification, 'No show (automated)'
    );
    
    -- Update status in scheduled
    UPDATE scheduled
    SET status = 'cancelled', updated_at = now()
    WHERE apt_number = no_show.apt_number;
    
    no_show_count := no_show_count + 1;
  END LOOP;
  
  RETURN no_show_count;
END;
$$ LANGUAGE plpgsql;
```

### Call Next Client Function

```sql
-- Function to call the next client
CREATE OR REPLACE FUNCTION call_next_client(staff_username TEXT)
RETURNS TABLE (
  call_number TEXT,
  apt_number TEXT,
  first_name TEXT,
  last_name TEXT,
  window_number TEXT
) AS $$
DECLARE
  next_client RECORD;
  staff_record RECORD;
BEGIN
  -- Get staff info
  SELECT * INTO staff_record FROM staff
  WHERE username = staff_username;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Staff member not found';
  END IF;
  
  -- Find the next client who has been waiting the longest
  SELECT * INTO next_client FROM queued
  WHERE status = 'waiting'
  ORDER BY check_in_time ASC
  LIMIT 1;
  
  IF NOT FOUND THEN
    RETURN;
  END IF;
  
  -- Update queued status
  UPDATE queued
  SET 
    status = 'called',
    window_number = staff_record.window_number,
    updated_at = now()
  WHERE id = next_client.id;
  
  -- Update scheduled status
  UPDATE scheduled
  SET 
    status = 'showing',
    updated_at = now()
  WHERE apt_number = next_client.apt_number;
  
  -- Return info for display
  RETURN QUERY
  SELECT 
    next_client.call_number,
    next_client.apt_number,
    next_client.first_name,
    next_client.last_name,
    staff_record.window_number;
END;
$$ LANGUAGE plpgsql;
```

### Mark Client Show/No-Show Functions

```sql
-- Function to mark a client as served
CREATE OR REPLACE FUNCTION mark_client_showed(p_call_number TEXT, p_staff_username TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  client_record RECORD;
  staff_record RECORD;
BEGIN
  -- Get client info
  SELECT * INTO client_record FROM queued
  WHERE call_number = p_call_number
    AND status IN ('called', 'serving');
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Get staff info
  SELECT * INTO staff_record FROM staff
  WHERE username = p_staff_username;
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Move to showed
  INSERT INTO showed (
    call_number, apt_number, last_name, first_name,
    phone_number, email, appointment_date, check_in_time,
    window_number, served_by, service_start_time
  ) VALUES (
    client_record.call_number, client_record.apt_number, 
    client_record.last_name, client_record.first_name,
    client_record.phone_number, client_record.email, 
    client_record.appointment_date, client_record.check_in_time,
    staff_record.window_number, p_staff_username, now()
  );
  
  -- Update scheduled status
  UPDATE scheduled
  SET 
    status = 'showed',
    updated_at = now()
  WHERE apt_number = client_record.apt_number;
  
  -- Remove from queued
  DELETE FROM queued
  WHERE call_number = p_call_number;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to mark a client as no-show after being called
CREATE OR REPLACE FUNCTION mark_client_no_show(p_call_number TEXT, p_staff_username TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  client_record RECORD;
  appt_record RECORD;
BEGIN
  -- Get client info
  SELECT * INTO client_record FROM queued
  WHERE call_number = p_call_number
    AND status IN ('called', 'serving');
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Get appointment info
  SELECT * INTO appt_record FROM scheduled
  WHERE apt_number = client_record.apt_number;
  
  -- Move to cancelled
  INSERT INTO cancelled (
    apt_number, appointment_type_id, last_name, first_name,
    phone_number, email, appointment_date, appointment_time,
    text_notification, cancellation_reason
  ) VALUES (
    appt_record.apt_number, appt_record.appointment_type_id, 
    appt_record.last_name, appt_record.first_name,
    appt_record.phone_number, appt_record.email, 
    appt_record.appointment_date, appt_record.appointment_time,
    appt_record.text_notification, 'No show after call'
  );
  
  -- Update scheduled status
  UPDATE scheduled
  SET 
    status = 'cancelled', 
    updated_at = now()
  WHERE apt_number = client_record.apt_number;
  
  -- Remove from queued
  DELETE FROM queued
  WHERE call_number = p_call_number;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;
```

## Staff Table

```sql
CREATE TABLE staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username TEXT NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  window_number TEXT,
  role TEXT NOT NULL CHECK (role IN ('clerk', 'supervisor', 'admin')),
  status TEXT NOT NULL DEFAULT 'offline' CHECK (status IN ('offline', 'online', 'serving', 'break')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Insert sample staff
INSERT INTO staff (username, full_name, window_number, role)
VALUES 
  ('clerk1', 'John Doe', '1', 'clerk'),
  ('clerk2', 'Jane Smith', '2', 'clerk'),
  ('clerk3', 'Robert Johnson', '3', 'clerk'),
  ('supervisor1', 'Emily Wilson', NULL, 'supervisor'),
  ('admin1', 'System Administrator', NULL, 'admin');
```

## Row Level Security Policies

```sql
-- Enable RLS on all tables
ALTER TABLE appointment_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE scheduled ENABLE ROW LEVEL SECURITY;
ALTER TABLE queued ENABLE ROW LEVEL SECURITY;
ALTER TABLE showed ENABLE ROW LEVEL SECURITY;
ALTER TABLE cancelled ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;

-- Create policies for appointment_types
CREATE POLICY "Anyone can read appointment types"
ON appointment_types FOR SELECT
TO anon, authenticated
USING (true);

-- Create policies for scheduled
CREATE POLICY "Anyone can read scheduled"
ON scheduled FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Anyone can insert into scheduled"
ON scheduled FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Create policies for queued
CREATE POLICY "Anyone can read queued"
ON queued FOR SELECT
TO anon, authenticated
USING (true);

-- Create policies for showed and cancelled
CREATE POLICY "Anyone can read showed"
ON showed FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Anyone can read cancelled"
ON cancelled FOR SELECT
TO anon, authenticated
USING (true);

-- Create policies for staff
CREATE POLICY "Anyone can read staff"
ON staff FOR SELECT
TO anon, authenticated
USING (true);
```

## Implementation Steps

1. **Create the DB Tables**
   - Log into Supabase SQL Editor
   - Run the table creation scripts one by one
   
2. **Run the DB Functions**
   - Create all helper functions for check-in, queue management, etc.
   
3. **Create Client UI Components**
   - A check-in form where clients enter appointment #
   - A display screen that shows call numbers
   
4. **Create Staff UI Components**
   - Queue management interface
   - Next client button
   - Showed/No-showed buttons

## Integration with Next.js App

In your Next.js app, you'll use the Supabase client to:

1. Check in clients (using the `check_in_appointment` function)
2. Display queue status (queried from the `queued` table)
3. Let staff call next client (using the `call_next_client` function)
4. Mark outcomes (using `mark_client_showed` or `mark_client_no_show` functions)

Example API endpoint for check-in:

```typescript
// In your API route handler
export async function POST(req: Request) {
  const { appointmentNumber } = await req.json();
  
  const { data, error } = await supabase.rpc(
    'check_in_appointment', 
    { appointment_num: appointmentNumber }
  );
  
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400 });
  
  return new Response(JSON.stringify({ callNumber: data }), { status: 200 });
}
```

## Testing

You can test the system by:

1. Creating test appointments in `scheduled`
2. Testing check-in to see if call numbers generate
3. Testing staff call-next functionality
4. Testing show/no-show outcomes