import { createClient } from '@supabase/supabase-js';

// The URL and key from .env.local
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Safeguard against invalid credentials
if (!supabaseUrl || !supabaseAnonKey || supabaseUrl === 'undefined') {
  console.error('Missing Supabase credentials. Check your .env.local file.');
}

// Create a single supabase client for interacting with your database
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Database types
export type AppointmentType = {
  id: string;
  name: string;
  description: string;
  duration: number;
  icon: string;
  color: string;
};

export type TimeSlot = {
  id: string;
  start_time: string;
  end_time: string;
  date: string;
  available: number;
  status: 'available' | 'limited' | 'busy' | 'past';
  display?: string;
};

export type Appointment = {
  id: string;
  user_id: string;
  appointment_type_id: string;
  date: string;
  time_slot_id: string;
  name: string;
  email: string;
  phone?: string;
  notes?: string;
  status: 'confirmed' | 'cancelled' | 'completed';
  created_at: string;
};

export type User = {
  id: string;
  email: string;
  name?: string;
  phone?: string;
};
