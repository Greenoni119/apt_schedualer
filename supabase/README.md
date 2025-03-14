# Supabase Setup for Appointment Scheduler App

This directory contains the necessary files to set up your Supabase database for the appointment scheduler app.

## Getting Started

1. Create a Supabase account at [supabase.com](https://supabase.com) if you don't have one already.
2. Create a new project in Supabase.
3. Get your Supabase URL and anon key from the project settings.
4. Create a `.env.local` file in the root of your project with the following variables:
   ```
   NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

## Database Setup

You can set up the database in two ways:

### Option 1: Using the Supabase UI

1. Go to the SQL Editor in your Supabase dashboard.
2. Copy the contents of `migrations/20250312_initial_schema.sql`.
3. Paste and run the SQL in the SQL Editor.

### Option 2: Using Supabase CLI

1. Install the Supabase CLI: `npm install -g supabase`
2. Login to Supabase: `supabase login`
3. Link your project: `supabase link --project-ref your-project-ref`
4. Push the migrations: `supabase db push`

## Database Schema

The database consists of the following tables:

- `users`: Extends Supabase auth.users with additional user information
- `appointment_types`: Different types of appointments that can be scheduled
- `time_slots`: Available time slots for appointments
- `appointments`: Scheduled appointments

## Row Level Security (RLS)

The database is set up with Row Level Security to ensure that:

- Users can only see and update their own data
- Anyone can view appointment types and time slots
- Users can only view, insert, and update their own appointments

## Automatic Functions

The database includes several automatic functions:

- `update_time_slot_availability_on_appointment_insert`: Decreases time slot availability when an appointment is created
- `update_time_slot_availability_on_appointment_cancel`: Increases time slot availability when an appointment is cancelled
- `update_past_time_slots`: Updates time slots to 'past' when the date is in the past
- `generate_time_slots`: Generates time slots for a specified date range

## Cron Jobs

The database is set up with cron jobs to:

- Update past time slots daily
- Generate new time slots monthly

## Sample Data

The migration includes sample data for appointment types and generates time slots for the next 3 months.

## Troubleshooting

If you encounter any issues with the database setup, check the Supabase logs in the dashboard for error messages.
