import { supabase, AppointmentType, TimeSlot, Appointment } from './supabase';

// Appointment Types
export async function getAppointmentTypes(): Promise<AppointmentType[]> {
  try {
    const { data, error } = await supabase
      .from('appointment_types')
      .select('*')
      .order('id');

    if (error) {
      console.log('Using mock appointment types data');
      return [];
    }

    return data || [];
  } catch (err) {
    console.log('Using mock appointment types data');
    return [];
  }
}

export async function getAppointmentTypeById(id: string): Promise<AppointmentType | null> {
  try {
    const { data, error } = await supabase
      .from('appointment_types')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.log(`Using mock data for appointment type ${id}`);
      return null;
    }

    return data;
  } catch (err) {
    console.log(`Using mock data for appointment type ${id}`);
    return null;
  }
}

// Time Slots
export async function getTimeSlotsByDate(date: string): Promise<TimeSlot[]> {
  try {
    const { data, error } = await supabase
      .from('time_slots')
      .select('*')
      .eq('date', date)
      .order('start_time');

    if (error) {
      console.log(`Using mock data for time slots on ${date}`);
      return [];
    }

    // Add display format for the time slots
    return data?.map(slot => ({
      ...slot,
      display: formatTimeSlot(slot.start_time, slot.end_time)
    })) || [];
  } catch (err) {
    console.log(`Using mock data for time slots on ${date}`);
    return [];
  }
}

export async function getTimeSlots(date: string, durationMinutes: number = 30): Promise<TimeSlot[]> {
  try {
    const { data, error } = await supabase
      .from('time_slots')
      .select('*')
      .eq('date', date)
      .order('start_time');

    if (error) {
      console.log(`Using mock data for time slots on ${date}`);
      return [];
    }

    // Add display format for the time slots
    return data?.map(slot => ({
      ...slot,
      display: formatTimeSlot(slot.start_time, slot.end_time)
    })) || [];
  } catch (err) {
    console.log(`Using mock data for time slots on ${date}`);
    return [];
  }
}

export async function getTimeSlotById(id: string): Promise<TimeSlot | null> {
  const { data, error } = await supabase
    .from('time_slots')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error(`Error fetching time slot ${id}:`, error);
    return null;
  }

  // Add display format
  if (data) {
    return {
      ...data,
      display: formatTimeSlot(data.start_time, data.end_time)
    };
  }

  return null;
}

// Appointments
export async function createAppointment(appointmentData: Omit<Appointment, 'id' | 'created_at'>): Promise<Appointment | null> {
  // Insert into the 'scheduled' table for the queue system
  const { data, error } = await supabase
    .from('scheduled')
    .insert([appointmentData])
    .select()
    .single();

  if (error) {
    console.error('Error creating appointment:', error);
    return null;
  }

  return data;
}

export async function getAppointmentsByUserId(userId: string): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (error) {
    console.error(`Error fetching appointments for user ${userId}:`, error);
    return [];
  }

  return data || [];
}

export async function getAppointmentsByDate(date: string): Promise<Appointment[]> {
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('date', date)
    .order('time_slot_id');

  if (error) {
    console.error(`Error fetching appointments for date ${date}:`, error);
    return [];
  }

  return data || [];
}

export async function updateAppointmentStatus(id: string, status: 'confirmed' | 'cancelled' | 'completed'): Promise<boolean> {
  const { error } = await supabase
    .from('appointments')
    .update({ status })
    .eq('id', id);

  if (error) {
    console.error(`Error updating appointment ${id} status:`, error);
    return false;
  }

  return true;
}

// Helper functions
function formatTimeSlot(startTime: string, endTime: string): string {
  // Convert 24-hour format to 12-hour format with AM/PM
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':');
    const hour = parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const formattedHour = hour % 12 || 12;
    return `${formattedHour}:${minutes} ${ampm}`;
  };

  return `${formatTime(startTime)} - ${formatTime(endTime)}`;
}

// Authentication
export async function signUp(email: string, password: string, name: string): Promise<boolean> {
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name,
      }
    }
  });

  if (error) {
    console.error('Error signing up:', error);
    return false;
  }

  return true;
}

export async function signIn(email: string, password: string): Promise<boolean> {
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    console.error('Error signing in:', error);
    return false;
  }

  return true;
}

export async function signOut(): Promise<boolean> {
  const { error } = await supabase.auth.signOut();

  if (error) {
    console.error('Error signing out:', error);
    return false;
  }

  return true;
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
}

// Availability management
export async function updateTimeSlotAvailability(id: string, available: number): Promise<boolean> {
  // Calculate status based on availability
  let status: TimeSlot['status'] = 'busy';
  if (available > 5) {
    status = 'available';
  } else if (available > 0) {
    status = 'limited';
  }

  const { error } = await supabase
    .from('time_slots')
    .update({ available, status })
    .eq('id', id);

  if (error) {
    console.error(`Error updating time slot ${id} availability:`, error);
    return false;
  }

  return true;
}

// When an appointment is created, decrease the availability of the time slot
export async function decreaseTimeSlotAvailability(timeSlotId: string): Promise<boolean> {
  // First get the current availability
  const { data, error: fetchError } = await supabase
    .from('time_slots')
    .select('available')
    .eq('id', timeSlotId)
    .single();

  if (fetchError || !data) {
    console.error(`Error fetching time slot ${timeSlotId}:`, fetchError);
    return false;
  }

  const newAvailable = Math.max(0, data.available - 1);
  return updateTimeSlotAvailability(timeSlotId, newAvailable);
}

// When an appointment is cancelled, increase the availability of the time slot
export async function increaseTimeSlotAvailability(timeSlotId: string): Promise<boolean> {
  // First get the current availability
  const { data, error: fetchError } = await supabase
    .from('time_slots')
    .select('available')
    .eq('id', timeSlotId)
    .single();

  if (fetchError || !data) {
    console.error(`Error fetching time slot ${timeSlotId}:`, fetchError);
    return false;
  }

  const newAvailable = data.available + 1;
  return updateTimeSlotAvailability(timeSlotId, newAvailable);
}
