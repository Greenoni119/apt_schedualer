'use server';

import { supabase } from '@/lib/supabase';

export async function createAppointment(formData: FormData) {
  try {
    // Convert FormData to regular object
    const data = Object.fromEntries(formData.entries());
    
    // Print the available columns in the scheduled table
    const { data: columnInfo, error: columnError } = await supabase
      .from('scheduled')
      .select()
      .limit(1);
    
    console.log('Table column info:', columnInfo);
    if (columnError) {
      console.error('Error fetching column info:', columnError);
      return { error: 'Failed to read table structure' };
    }
    
    // Insert the appointment with only required fields
    const { data: result, error } = await supabase
      .from('scheduled')
      .insert({
        name: data.name as string,
        email: data.email as string,
        phone: data.phone as string || '',
        appointment_type_id: data.appointment_type_id as string,
        time_slot: data.time_slot as string || '',
        status: 'confirmed',
      })
      .select();
      
    if (error) {
      console.error('Error inserting appointment:', error);
      return { error: error.message };
    }
    
    return { success: true, data: result };
  } catch (e) {
    console.error('Server action error:', e);
    return { error: 'Failed to create appointment' };
  }
}