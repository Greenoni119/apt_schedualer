-- This script checks the existing structure of your database

-- Check what tables exist in the public schema
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

-- Check the structure of the scheduled table if it exists
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'scheduled'
ORDER BY ordinal_position;

-- Check the structure of the appointment_types table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'appointment_types'
ORDER BY ordinal_position;